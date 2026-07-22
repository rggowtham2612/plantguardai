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

        const { messages, diseaseContext } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages))
          return new Response("messages required", { status: 400 });

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
          messages: convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
