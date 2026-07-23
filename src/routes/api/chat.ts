import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatBody = {
  messages?: UIMessage[];
  diseaseContext?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const MAX_BYTES = 256 * 1024; // 256KB - chat payloads should be small
        const MAX_MESSAGES = 30;
        const MAX_CONTEXT_CHARS = 8000;

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const raw = await request.text();
        if (raw.length > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        let parsed: ChatBody;
        try {
          parsed = JSON.parse(raw) as ChatBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const { messages, diseaseContext } = parsed;
        if (!Array.isArray(messages))
          return new Response("messages required", { status: 400 });
        if (messages.length === 0 || messages.length > MAX_MESSAGES) {
          return new Response("Invalid messages length", { status: 400 });
        }
        if (diseaseContext && typeof diseaseContext === "string" && diseaseContext.length > MAX_CONTEXT_CHARS) {
          return new Response("diseaseContext too large", { status: 413 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");


        const system = `You are PlantGuard AI, a friendly and expert plant pathologist and farming assistant. You help farmers understand crop diseases and get practical, actionable advice. Be concise, warm, and specific. Use short paragraphs and bullet points where helpful. Prefer organic solutions first, then chemical if needed. Always consider farmer safety.

${
  diseaseContext
    ? `Current diagnosis context (the user's plant was just analyzed):\n${diseaseContext}\n\nAnswer follow-up questions grounded in this diagnosis unless the user changes topic.`
    : "No current diagnosis context is available."
}`;

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
