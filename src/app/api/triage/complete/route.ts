import { Type } from "@google/genai";
import { genai, EXTRACTION_MODEL } from "@/lib/gemini";
import { db } from "@/db";
import { triageSessions, triageMessages } from "@/db/schema";
import { aiTriageOutputSchema, completeRequestSchema } from "@/lib/triage-validation";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    main_symptom: { type: Type.STRING },
    evolution_time: { type: Type.STRING },
    pain_intensity: { type: Type.INTEGER },
    relevant_history: { type: Type.STRING },
    urgency_classification: { type: Type.STRING, enum: ["RED", "YELLOW", "GREEN"] },
    suggested_specialty: {
      type: Type.STRING,
      enum: [
        "general_practice", "dentistry", "aesthetics", "cardiology",
        "dermatology", "neurology", "orthopedics", "ophthalmology",
        "gynecology", "pediatrics", "psychiatry", "other",
      ],
    },
    classification_justification: { type: Type.STRING },
    ai_summary: { type: Type.STRING },
  },
  required: [
    "main_symptom", "evolution_time", "pain_intensity", "relevant_history",
    "urgency_classification", "suggested_specialty", "classification_justification", "ai_summary",
  ],
};

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = completeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { patientName, patientEmail, fullConversation } = parsed.data;

  const extraction = await genai.models.generateContent({
    model: EXTRACTION_MODEL,
    config: {
      systemInstruction:
        "You are a clinical data extraction assistant. From the triage conversation, produce the structured triage record. Base pain_intensity (1-10) and urgency strictly on what the patient reported. Choose the most appropriate suggested_specialty for a clinic referral.",
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
    contents: `Extract the triage record from this conversation:\n\n${fullConversation}`,
  });

  const rawText = extraction.text;
  if (!rawText) {
    return Response.json({ error: "Empty extraction response" }, { status: 422 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return Response.json({ error: "JSON parse error" }, { status: 422 });
  }

  const validated = aiTriageOutputSchema.safeParse(parsedJson);
  if (!validated.success) {
    return Response.json(
      { error: "Invalid triage schema", details: validated.error.flatten() },
      { status: 422 }
    );
  }

  const data = validated.data;

  const [session] = await db
    .insert(triageSessions)
    .values({
      patientName,
      patientEmail,
      mainSymptom: data.main_symptom,
      symptomDuration: data.evolution_time,
      painIntensity: data.pain_intensity,
      relevantHistory: data.relevant_history,
      urgency: data.urgency_classification,
      suggestedSpecialty: data.suggested_specialty,
    })
    .returning();

  const conversationLines = fullConversation.split("\n\n").filter(Boolean);
  const messagesToInsert = conversationLines
    .map((line) => {
      if (line.startsWith("Patient: ")) {
        return { sessionId: session.id, role: "user" as const, content: line.replace("Patient: ", "").trim() };
      }
      if (line.startsWith("MedBook AI: ")) {
        return { sessionId: session.id, role: "assistant" as const, content: line.replace("MedBook AI: ", "").trim() };
      }
      return null;
    })
    .filter(Boolean);

  if (messagesToInsert.length > 0) {
    await db.insert(triageMessages).values(messagesToInsert as typeof triageMessages.$inferInsert[]);
  }

  return Response.json({
    sessionId: session.id,
    urgency: session.urgency,
    suggestedSpecialty: session.suggestedSpecialty,
    summary: data.ai_summary,
  });
}
