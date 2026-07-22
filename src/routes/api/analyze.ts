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

        const body = (await request.json()) as {
          image?: string;
          mimeType?: string;
        };
        if (!body.image) return new Response("image required", { status: 400 });

        const mimeType = body.mimeType || "image/jpeg";
        const dataUrl = body.image.startsWith("data:")
          ? body.image
          : `data:${mimeType};base64,${body.image}`;

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const systemPrompt = `You are PlantGuard AI, an expert plant pathologist and agronomist. Analyze the uploaded plant/leaf image and return a strict JSON diagnosis. Be practical, specific, and farmer-friendly. If the image is not a plant, set isPlant=false and fill fields with sensible messages. Always return valid JSON matching the schema. Confidence is 0-100. Severity is one of: Low, Medium, High, None. If plant appears healthy, healthy=true and diseaseName="Healthy".`;

        const schemaDescription = `{
  "isPlant": boolean,
  "diseaseName": string,
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
          const message = err instanceof Error ? err.message : "Analysis failed";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
