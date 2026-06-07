import { genai, CHAT_MODEL, toGeminiContents } from "@/lib/gemini";
import { chatRequestSchema } from "@/lib/triage-validation";
import { getSystemPrompt } from "@/lib/triage-prompt";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = chatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { message, history, locale } = parsed.data;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const geminiStream = await genai.models.generateContentStream({
          model: CHAT_MODEL,
          config: {
            systemInstruction: getSystemPrompt(locale),
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
          contents: toGeminiContents(history, message),
        });

        let fullText = "";

        for await (const chunk of geminiStream) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        const hasJson = /```json[\s\S]*?```/.test(fullText);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, hasJson, model: CHAT_MODEL })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
