import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { runChatGraph } from "@/lib/langgraph/graph";
import { getOrCreateSession, getChatMessages, saveChatMessage } from "@/lib/chat/session";

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId: incomingId } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Mensagem obrigatoria" }, { status: 400 });
    }

    const clinicId = process.env.CLINIC_ID || "default";
    const sessionId = incomingId || crypto.randomUUID();

    await getOrCreateSession(sessionId, clinicId);

    const history = await getChatMessages(sessionId);

    const historyMessages = history.map((m) =>
      m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    );

    const result = await runChatGraph({
      messages: [...historyMessages, new HumanMessage(message)],
      sessionId,
      clinicId,
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const reply =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : "Desculpe, ocorreu um erro ao processar sua mensagem.";

    await saveChatMessage(sessionId, "user", message);
    await saveChatMessage(sessionId, "assistant", reply);

    return NextResponse.json({ reply, sessionId });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
