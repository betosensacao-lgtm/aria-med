import { GoogleGenAI } from "@google/genai";

const apiKey =
  process.env.MEDBOOK_GEMINI_API_KEY?.trim() ||
  process.env.GEMINI_API_KEY?.trim() ||
  process.env.GOOGLE_API_KEY?.trim();

export const genai = new GoogleGenAI({ apiKey });

export const CHAT_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
export const EXTRACTION_MODEL =
  process.env.GEMINI_EXTRACTION_MODEL?.trim() || CHAT_MODEL;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function toGeminiContents(history: ChatTurn[], nextUserMessage: string) {
  const contents = history.map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));
  contents.push({ role: "user", parts: [{ text: nextUserMessage }] });
  return contents;
}
