import { createFileRoute } from "@tanstack/react-router";

type TtsBody = {
  text?: string;
  voice?: string;
};

const ALLOWED_VOICES = new Set([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "nova",
  "onyx",
  "fable",
]);

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const MAX_BYTES = 32 * 1024;
        const MAX_TEXT = 8000;

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const raw = await request.text();
        if (raw.length > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        let parsed: TtsBody;
        try {
          parsed = JSON.parse(raw) as TtsBody;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
        if (!text) return new Response("text required", { status: 400 });
        if (text.length > MAX_TEXT) {
          return new Response("text too long", { status: 413 });
        }
        const voice =
          parsed.voice && ALLOWED_VOICES.has(parsed.voice) ? parsed.voice : "alloy";

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            response_format: "mp3",
            instructions:
              "Speak like a warm, natural human expert — calm, clear, and friendly. Use gentle pacing and natural inflection, as if explaining to a farmer in person.",
          }),
        });

        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          if (upstream.status === 402) console.warn("[PaymentRequired][server] /api/tts upstream 402", errText.slice(0, 300));
          return new Response(errText || "TTS failed", { status: upstream.status });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
