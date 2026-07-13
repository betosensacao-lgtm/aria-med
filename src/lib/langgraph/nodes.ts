import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { getClinicContext } from "@/lib/rag/knowledge-base";
import { hardenSystemPrompt, sanitizeInput, validateOutput } from "@/lib/security/guardrails";
import { createGroqChatModel, executeToolCalls, schedulingTools, preAnamnesisTools } from "./tools";
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

  const { clean: userMessage } = sanitizeInput(rawMessage);

  try {
    const model = createGroqChatModel({ temperature: 0, maxTokens: 20 });
    const response = await model.invoke([
      new HumanMessage(ROUTER_PROMPT.replace("{message}", userMessage)),
    ]);

    const raw = (response.content as string || "").trim().toUpperCase();
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

  const systemPrompt = hardenSystemPrompt(
    DOUBT_SYSTEM_PROMPT
      .replace("{context}", context || "Nenhuma informacao cadastrada.")
      .replace("{history}", history)
  );

  try {
    const model = createGroqChatModel({ temperature: 0.3, maxTokens: 1024 });
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage((state.messages[state.messages.length - 1]?.content as string) || ""),
    ]);

    let responseText = typeof response.content === "string"
      ? response.content
      : "Desculpe, nao consegui processar sua pergunta.";

    const outputCheck = validateOutput(responseText);
    if (!outputCheck.safe) {
      responseText = outputCheck.cleaned;
    }

    return { messages: [new AIMessage(responseText)], completed: true };
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
    .filter((m) => m instanceof HumanMessage || m instanceof AIMessage);

  const systemPrompt = hardenSystemPrompt(SCHEDULING_SYSTEM_PROMPT);
  const model = createGroqChatModel().bindTools(schedulingTools);

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      ...history,
    ]);

    if (response.tool_calls?.length) {
      const toolMessages = await executeToolCalls(response.tool_calls);
      const followUp = await model.invoke([
        new SystemMessage(systemPrompt),
        ...history,
        response,
        ...toolMessages,
      ]);

      return {
        messages: [new AIMessage(followUp.content as string || "Processado.")],
        completed: true,
      };
    }

    return {
      messages: [new AIMessage(response.content as string || "Como posso ajudar com o agendamento?")],
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
    .filter((m) => m instanceof HumanMessage || m instanceof AIMessage);

  const systemPrompt = hardenSystemPrompt(PRE_ANAMNESE_SYSTEM_PROMPT);
  const model = createGroqChatModel().bindTools(preAnamnesisTools);

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      ...history,
    ]);

    if (response.tool_calls?.length) {
      const toolMessages = await executeToolCalls(response.tool_calls);

      const preAnamnesisArgs = response.tool_calls[0].args;

      return {
        messages: [
          new AIMessage(
            "Pre-anamnese concluida! Seus dados foram registrados com sucesso. Obrigado!"
          ),
        ],
        patientData: { ...preAnamnesisArgs, collectionComplete: true } as any,
        completed: true,
      };
    }

    return {
      messages: [new AIMessage(response.content as string || "Vamos iniciar sua pre-anamnese.")],
    };
  } catch (error) {
    return {
      messages: [new AIMessage("Desculpe, ocorreu um erro. Tente novamente.")],
      error: String(error),
    };
  }
}
