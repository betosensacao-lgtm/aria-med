import { DynamicStructuredTool } from "@langchain/core/tools";
import { ToolMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { listAvailableSlots, createCalendarEvent, cancelCalendarEvent } from "@/lib/calendar/google";
import { getClinicContext } from "@/lib/rag/knowledge-base";

export const checkCalendarTool = new DynamicStructuredTool({
  name: "check_calendar",
  description: "Busca horários disponíveis no calendário para uma data específica.",
  schema: z.object({
    calendarId: z.string().describe("ID do calendário do profissional"),
    date: z.string().describe("Data no formato YYYY-MM-DD"),
  }),
  func: async ({ calendarId, date }) => {
    try {
      const slots = await listAvailableSlots(calendarId, date);
      const available = slots.filter((s) => s.available);

      return JSON.stringify({
        success: true,
        date,
        availableSlots: available.map((s) => s.time),
        totalAvailable: available.length,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: "Erro ao consultar calendário.",
        error: String(error),
      });
    }
  },
});

export const createEventTool = new DynamicStructuredTool({
  name: "create_event",
  description: "Cria um evento de consulta no Google Calendar.",
  schema: z.object({
    calendarId: z.string().describe("ID do calendário do profissional"),
    patientName: z.string().describe("Nome do paciente"),
    patientEmail: z.string().describe("Email do paciente"),
    date: z.string().describe("Data no formato YYYY-MM-DD"),
    time: z.string().describe("Horário no formato HH:MM"),
    duration: z.number().describe("Duração em minutos (padrão 30)"),
    notes: z.string().optional().describe("Observações da consulta"),
  }),
  func: async ({ calendarId, patientName, patientEmail, date, time, duration = 30, notes }) => {
    try {
      const startDateTime = `${date}T${time}:00`;
      const endDate = new Date(`${date}T${time}:00`);
      endDate.setMinutes(endDate.getMinutes() + duration);
      const endDateTime = endDate.toISOString().replace(/\.\d{3}Z$/, "");

      const event = await createCalendarEvent(calendarId, {
        summary: `Consulta: ${patientName}`,
        description: notes || "Agendamento via chat",
        start: startDateTime,
        end: endDateTime,
        attendees: [{ email: patientEmail, displayName: patientName }],
      });

      return JSON.stringify({
        success: true,
        message: "Consulta agendada com sucesso!",
        eventId: event.id,
        date,
        time,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: "Erro ao criar evento no calendário.",
        error: String(error),
      });
    }
  },
});

export const cancelEventTool = new DynamicStructuredTool({
  name: "cancel_event",
  description: "Cancela um evento no Google Calendar.",
  schema: z.object({
    calendarId: z.string().describe("ID do calendário"),
    eventId: z.string().describe("ID do evento a cancelar"),
  }),
  func: async ({ calendarId, eventId }) => {
    try {
      await cancelCalendarEvent(calendarId, eventId);
      return JSON.stringify({
        success: true,
        message: "Consulta cancelada com sucesso.",
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: "Erro ao cancelar consulta.",
        error: String(error),
      });
    }
  },
});

export const queryKnowledgeBaseTool = new DynamicStructuredTool({
  name: "query_knowledge_base",
  description: "Consulta a base de conhecimento da clínica para responder dúvidas sobre horários, convênios, serviços e regras.",
  schema: z.object({
    clinicId: z.string().describe("ID da clínica"),
    question: z.string().describe("Pergunta do paciente"),
  }),
  func: async ({ clinicId, question }) => {
    try {
      const context = await getClinicContext(clinicId);

      if (!context) {
        return JSON.stringify({
          success: true,
          context: "Nenhuma informação cadastrada no momento.",
        });
      }

      return JSON.stringify({
        success: true,
        context,
        question,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: "Erro ao consultar base de conhecimento.",
        error: String(error),
      });
    }
  },
});

export const savePreAnamnesisTool = new DynamicStructuredTool({
  name: "save_pre_anamnesis",
  description: "Salva os dados da pré-anamnese coletados durante a conversa.",
  schema: z.object({
    fullName: z.string().describe("Nome completo do paciente"),
    phone: z.string().describe("Telefone do paciente"),
    chiefComplaint: z.string().describe("Queixa principal"),
    symptomsDescription: z.string().optional().describe("Descrição dos sintomas"),
    symptomsDuration: z.string().optional().describe("Duração dos sintomas"),
    currentMedications: z.array(z.string()).optional().describe("Medicamentos atuais"),
    allergies: z.array(z.string()).optional().describe("Alergias"),
    chronicConditions: z.array(z.string()).optional().describe("Condições crônicas"),
  }),
  func: async (data) => {
    try {
      return JSON.stringify({
        success: true,
        message: "Pré-anamnese registrada com sucesso.",
        data,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        message: "Erro ao salvar pré-anamnese.",
        error: String(error),
      });
    }
  },
});

export const allTools = [
  checkCalendarTool,
  createEventTool,
  cancelEventTool,
  queryKnowledgeBaseTool,
  savePreAnamnesisTool,
];

export const schedulingTools = [
  checkCalendarTool,
  createEventTool,
  cancelEventTool,
];

export const preAnamnesisTools = [
  savePreAnamnesisTool,
];

export function createGroqChatModel(params?: {
  temperature?: number;
  maxTokens?: number;
}) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  return new ChatOpenAI({
    model: process.env.GROQ_MODEL?.trim() || "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: params?.temperature ?? 0.3,
    maxTokens: params?.maxTokens ?? 1024,
    apiKey: apiKey ?? "missing-key",
    configuration: {
      baseURL: "https://api.groq.com/openai/v1",
    },
  });
}

export async function executeToolCalls(
  toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }>
): Promise<ToolMessage[]> {
  const results: ToolMessage[] = [];

  for (const tc of toolCalls) {
    const tool = allTools.find((t) => t.name === tc.name);
    if (tool) {
      try {
        const result = await tool.func(tc.args as any);
        results.push(
          new ToolMessage({
            content: typeof result === "string" ? result : JSON.stringify(result),
            tool_call_id: tc.id ?? crypto.randomUUID(),
            name: tc.name,
          })
        );
      } catch (error) {
        results.push(
          new ToolMessage({
            content: JSON.stringify({ error: String(error) }),
            tool_call_id: tc.id ?? crypto.randomUUID(),
            name: tc.name,
          })
        );
      }
    }
  }

  return results;
}
