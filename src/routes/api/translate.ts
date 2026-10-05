import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const ALLOWED_LANGS = new Set([
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Italian",
  "Hindi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Kannada",
  "Malayalam",
  "Urdu",
  "Arabic",
  "Chinese",
  "Japanese",
  "Korean",
  "Indonesian",
  "Vietnamese",
  "Swahili",
  "Turkish",
  "Russian",
]);

const MAX_BYTES = 128 * 1024;

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }
        const raw = await request.text();
        if (raw.length > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        let body: { payload?: unknown; language?: string };
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const language = typeof body.language === "string" ? body.language : "";
        if (!ALLOWED_LANGS.has(language)) {
          return new Response("Unsupported language", { status: 400 });
        }
        if (!body.payload || typeof body.payload !== "object") {
          return new Response("payload required", { status: 400 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");

        try {
          const { text } = await generateText({
            model,
            system: `You are a professional translator. Translate all string values of the given JSON into ${language}. Preserve the exact JSON shape and keys. Do not translate keys, booleans, numbers, enum-like values ("Low"|"Medium"|"High"|"None", "disease"|"pest"|"healthy"|"unknown"), or scientific names. Output ONLY valid JSON, no markdown, no commentary.`,
            messages: [
              {
                role: "user",
                content: JSON.stringify(body.payload),
              },
            ],
          });

          const cleaned = text
            .trim()
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();

          let parsed: unknown;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (!m) throw new Error("Model did not return JSON");
            parsed = JSON.parse(m[0]);
          }

          return Response.json(parsed);
        } catch (err) {
          console.error("translate error", err);
          const st = (err as { statusCode?: number })?.statusCode;
          if (st === 402 || /payment required/i.test(String(err))) console.warn("[PaymentRequired][server] /api/translate upstream status", st);
          if (st === 402) return new Response("Payment Required: AI credits exhausted", { status: 402 });
          const message = err instanceof Error ? err.message : "Translation failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
