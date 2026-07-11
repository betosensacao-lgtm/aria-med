import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ai, CHAT_MODEL } from "@/lib/ai";
import { getClinicContext } from "@/lib/rag/knowledge-base";
import { hardenSystemPrompt, sanitizeInput, validateOutput } from "@/lib/security/guardrails";
import type { ChatStateType, Intent } from "./state";

const ROUTER_PROMPT = `Você é um roteador para uma clínica médica.
Analise a mensagem do paciente e classifique a intenção.

Mensagem: "{message}"

Classifique em UMA das opções:
- DUVIDA: O paciente quer esclarecer dúvidas sobre horários, convênios, serviços, localização
- AGENDAMENTO: O paciente quer marcar ou verificar disponibilidade de consulta
- CANCELAMENTO: O paciente quer cancelar uma consulta existente
- PRE_ANAMNESE: O paciente está fornecendo dados pessoais, sintomas ou histórico médico
- NAO_IDENTIFICADO: Não se encaixa em nenhum dos acima

Responda APENAS com a intenção (uma palavra, maiúscula, sem acentos).`;

export async function routerNode(state: ChatStateType): Promise<Partial<ChatStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const rawMessage = (lastMessage?.content as string) || "";

  // Sanitize input before processing
  const { clean: userMessage } = sanitizeInput(rawMessage);

  try {
    const completion = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: ROUTER_PROMPT.replace("{message}", userMessage),
        },
      ],
      temperature: 0,
      max_tokens: 20,
    });

    const raw = completion.choices[0]?.message?.content?.trim().toUpperCase() || "";
    const intent = raw.replace(/[^A-Z_]/g, "") as Intent;

    const valid: Intent[] = ["DUVIDA", "AGENDAMENTO", "CANCELAMENTO", "PRE_ANAMNESE"];
    return { intent: valid.includes(intent) ? intent : "NAO_IDENTIFICADO" };
  } catch (error) {
    console.error("[Router Node] Error:", error);
    return { intent: "NAO_IDENTIFICADO" };
  }
}

const DOUBT_SYSTEM_PROMPT = `Você é um assistente virtual de uma clínica médica.
Use as informações abaixo para responder às perguntas do paciente de forma clara e objetiva.
Se não souber a resposta, diga que não tem essa informação e sugira contato direto com a clínica.
Não faça diagnósticos nem prescreva medicamentos.

CONTEXTO DA CLÍNICA:
{context}

Histórico da conversa:
{history}`;

export async function doubtResolutionNode(
  state: ChatStateType
): Promise<Partial<ChatStateType>> {
  const clinicId = state.clinicId;
  const context = await getClinicContext(clinicId);

  const history = state.messages
    .filter((m) => m instanceof HumanMessage || m instanceof AIMessage)
    .map((m) => `${m instanceof HumanMessage ? "Paciente" : "Assistente"}: ${m.content}`)
    .join("\n");

  // Use hardened system prompt
  const systemPrompt = hardenSystemPrompt(
    DOUBT_SYSTEM_PROMPT
      .replace("{context}", context || "Nenhuma informacao cadastrada.")
      .replace("{history}", history)
  );

  try {
    const completion = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: (state.messages[state.messages.length - 1]?.content as string) || "",
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    let response = completion.choices[0]?.message?.content || "Desculpe, nao consegui processar sua pergunta.";

    // Validate output for security
    const outputCheck = validateOutput(response);
    if (!outputCheck.safe) {
      response = outputCheck.cleaned;
    }

    return { messages: [new AIMessage(response)], completed: true };
  } catch (error) {
    return {
      messages: [new AIMessage("Desculpe, ocorreu um erro ao processar sua pergunta.")],
      error: String(error),
    };
  }
}

const SCHEDULING_SYSTEM_PROMPT = `Você é um assistente de agendamento de consultas.
Ajude o paciente a escolher um horário disponível e agende a consulta.

Regras:
1. Primeiro pergunte a especialidade ou profissional desejado
2. Depois pergunte a data preferida
3. Use a ferramenta check_calendar para verificar disponibilidade
4. Apresente os horários disponíveis ao paciente
5. Quando o paciente confirmar, use create_event para agendar

Se o paciente quiser cancelar, use cancel_event.
Seja educado e objetivo. Responda em português.`;

export async function schedulingNode(
  state: ChatStateType
): Promise<Partial<ChatStateType>> {
  const history = state.messages
    .filter((m) => m instanceof HumanMessage || m instanceof AIMessage)
    .map((m) => ({
      role: m instanceof HumanMessage ? "user" as const : "assistant" as const,
      content: m.content as string,
    }));

  // Use hardened system prompt
  const systemPrompt = hardenSystemPrompt(SCHEDULING_SYSTEM_PROMPT);

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "check_calendar",
        description: "Verifica horários disponíveis no calendário para uma data",
        parameters: {
          type: "object",
          properties: {
            calendarId: { type: "string", description: "ID do calendário do profissional" },
            date: { type: "string", description: "Data YYYY-MM-DD" },
          },
          required: ["calendarId", "date"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "create_event",
        description: "Cria uma consulta no calendário",
        parameters: {
          type: "object",
          properties: {
            calendarId: { type: "string", description: "ID do calendário" },
            patientName: { type: "string", description: "Nome do paciente" },
            patientEmail: { type: "string", description: "Email do paciente" },
            date: { type: "string", description: "Data YYYY-MM-DD" },
            time: { type: "string", description: "Horário HH:MM" },
            duration: { type: "number", description: "Duração em minutos" },
            notes: { type: "string", description: "Observações" },
          },
          required: ["calendarId", "patientName", "patientEmail", "date", "time"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "cancel_event",
        description: "Cancela uma consulta",
        parameters: {
          type: "object",
          properties: {
            calendarId: { type: "string" },
            eventId: { type: "string" },
          },
          required: ["calendarId", "eventId"],
        },
      },
    },
  ];

  try {
    const completion = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const choice = completion.choices[0];
    const assistantMessage = choice.message;

    if (assistantMessage.tool_calls?.length) {
      const toolResults: Array<{ role: "tool"; tool_call_id: string; content: string }> = [];

      for (const tc of assistantMessage.tool_calls) {
        const { default: toolsModule } = await import("./tools");
        const args = JSON.parse(tc.function.arguments);

        let result: string;
        switch (tc.function.name) {
          case "check_calendar":
            result = await toolsModule.checkCalendarTool.func(args);
            break;
          case "create_event":
            result = await toolsModule.createEventTool.func(args);
            break;
          case "cancel_event":
            result = await toolsModule.cancelEventTool.func(args);
            break;
          default:
            result = JSON.stringify({ error: "Tool desconhecida" });
        }

        toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
      }

      const followUp = await ai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "assistant", content: assistantMessage.content || null, tool_calls: assistantMessage.tool_calls },
          ...toolResults,
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });

      return {
        messages: [new AIMessage(followUp.choices[0]?.message?.content || "Processado.")],
        completed: true,
      };
    }

    return {
      messages: [new AIMessage(assistantMessage.content || "Como posso ajudar com o agendamento?")],
    };
  } catch (error) {
    return {
      messages: [new AIMessage("Desculpe, erro ao processar agendamento. Tente novamente.")],
      error: String(error),
    };
  }
}

const PRE_ANAMNESE_SYSTEM_PROMPT = `Você é um assistente de pré-anamnese.
Conduza uma entrevista para coletar as seguintes informações do paciente de forma natural e conversacional:

1. Nome completo
2. Telefone para contato
3. Data de nascimento
4. Queixa principal (motivo da consulta)
5. Descrição dos sintomas
6. Há quanto tempo apresenta os sintomas
7. Medicamentos que usa atualmente
8. Alergias
9. Condições crônicas (diabetes, hipertensão, etc)

Faça perguntas uma de cada vez. Seja acolhedor.
Quando tiver todos os dados, use a ferramenta save_pre_anamnesis.`;

export async function preAnamnesisNode(
  state: ChatStateType
): Promise<Partial<ChatStateType>> {
  const history = state.messages
    .filter((m) => m instanceof HumanMessage || m instanceof AIMessage)
    .map((m) => ({
      role: m instanceof HumanMessage ? "user" as const : "assistant" as const,
      content: m.content as string,
    }));

  // Use hardened system prompt
  const systemPrompt = hardenSystemPrompt(PRE_ANAMNESE_SYSTEM_PROMPT);

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "save_pre_anamnesis",
        description: "Salva os dados da pré-anamnese quando todos foram coletados",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string" },
            phone: { type: "string" },
            chiefComplaint: { type: "string" },
            symptomsDescription: { type: "string" },
            symptomsDuration: { type: "string" },
            currentMedications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            chronicConditions: { type: "array", items: { type: "string" } },
          },
          required: ["fullName", "phone", "chiefComplaint"],
        },
      },
    },
  ];
  try {
    const completion = await ai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const choice = completion.choices[0];
    const assistantMessage = choice.message;

    if (assistantMessage.tool_calls?.length) {
      const { default: toolsModule } = await import("./tools");
      const args = JSON.parse(assistantMessage.tool_calls[0].function.arguments);

      const result = await toolsModule.savePreAnamnesisTool.func(args);

      return {
        messages: [
          new AIMessage(
            "Pre-anamnese concluida! Seus dados foram registrados com sucesso. Obrigado!"
          ),
        ],
        patientData: { ...args, collectionComplete: true },
        completed: true,
      };
    }

    return {
      messages: [new AIMessage(assistantMessage.content || "Vamos iniciar sua pre-anamnese.")],
    };
  } catch (error) {
    return {
      messages: [new AIMessage("Desculpe, ocorreu um erro. Tente novamente.")],
      error: String(error),
    };
  }
}
