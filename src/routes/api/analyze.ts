import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const AnalysisSchema = z.object({
  isPlant: z.boolean(),
  issueType: z.enum(["disease", "pest", "healthy", "unknown"]).default("unknown"),
  diseaseName: z.string(),
  pestName: z.string().nullable().default(null),
  scientificName: z.string().nullable(),
  confidence: z.number(),
  severity: z.enum(["Low", "Medium", "High", "None"]),
  cropType: z.string(),
  healthy: z.boolean(),
  description: z.string(),
  symptoms: z.array(z.string()),
  causes: z.array(z.string()),
  organicTreatments: z.array(z.string()),
  chemicalTreatments: z.array(z.string()),
  preventionTips: z.array(z.string()),
  recoveryTime: z.string(),
  weatherConsiderations: z.string(),
  immediateActions: z.array(z.string()),
  wateringAdvice: z.string(),
  fertilizerAdvice: z.string(),
});

export type PlantAnalysis = z.infer<typeof AnalysisSchema>;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const MAX_BYTES = 11 * 1024 * 1024; // ~8MB image + base64 overhead
        const contentLength = Number(request.headers.get("content-length") ?? 0);
        if (contentLength && contentLength > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const raw = await request.text();
        if (raw.length > MAX_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        let body: { image?: string; mimeType?: string };
        try {
          body = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        if (!body.image || typeof body.image !== "string") {
          return new Response("image required", { status: 400 });
        }
        if (body.image.length > MAX_BYTES) {
          return new Response("Image too large", { status: 413 });
        }

        const allowedMime = ["image/jpeg", "image/jpg", "image/png"];
        const mimeType =
          body.mimeType && allowedMime.includes(body.mimeType) ? body.mimeType : "image/jpeg";
        const dataUrl = body.image.startsWith("data:")
          ? body.image
          : `data:${mimeType};base64,${body.image}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const systemPrompt = `You are PlantGuard AI, an expert plant pathologist, entomologist, and agronomist. Analyze the uploaded plant/leaf image and return a strict JSON diagnosis.

Detect BOTH plant diseases (fungal, bacterial, viral, nutrient deficiency) AND pest damage (insects, mites, caterpillars, aphids, whiteflies, borers, leaf miners, etc.). If damage is caused by a pest, set issueType="pest", put the pest common name in pestName, and use diseaseName to describe the damage (e.g. "Aphid infestation"). If it's a disease, set issueType="disease" and pestName=null. If healthy, issueType="healthy", diseaseName="Healthy", pestName=null. If not a plant, isPlant=false and issueType="unknown".

Treatments arrays MUST fit the issue type — for pests include insecticidal soap, neem oil, beneficial insects, traps, targeted insecticides; for diseases include fungicides/bactericides and cultural controls. Be practical, specific, and farmer-friendly. Confidence is 0-100.`;

        const schemaDescription = `{
  "isPlant": boolean,
  "issueType": "disease" | "pest" | "healthy" | "unknown",
  "diseaseName": string,
  "pestName": string | null,
  "scientificName": string | null,
  "confidence": number (0-100),
  "severity": "Low" | "Medium" | "High" | "None",
  "cropType": string,
  "healthy": boolean,
  "description": string (2-3 sentences),
  "symptoms": string[] (3-5 items),
  "causes": string[] (3-5 items),
  "organicTreatments": string[] (3-5 items),
  "chemicalTreatments": string[] (2-4 items),
  "preventionTips": string[] (4-6 items),
  "recoveryTime": string (e.g. "2-3 weeks"),
  "weatherConsiderations": string,
  "immediateActions": string[] (3-4 items),
  "wateringAdvice": string,
  "fertilizerAdvice": string
}`;

        try {
          const { text } = await generateText({
            model,
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analyze this plant image and respond ONLY with valid JSON matching this schema (no markdown, no code fences):\n${schemaDescription}`,
                  },
                  { type: "image", image: dataUrl },
                ],
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
            const match = cleaned.match(/\{[\s\S]*\}/);
            if (!match) throw new Error("Model did not return JSON");
            parsed = JSON.parse(match[0]);
          }

          const analysis = AnalysisSchema.parse(parsed);
          return Response.json(analysis);
        } catch (err) {
          console.error("analyze error", err);
          const st = (err as { statusCode?: number })?.statusCode;
          if (st === 402 || /payment required/i.test(String(err))) console.warn("[PaymentRequired][server] /api/analyze upstream status", st);
          if (st === 402) return new Response("Payment Required: AI credits exhausted", { status: 402 });
          const message = err instanceof Error ? err.message : "Analysis failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
