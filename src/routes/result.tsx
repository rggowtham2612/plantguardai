import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Leaf,
  Droplets,
  Sprout,
  CloudSun,
  Clock,
  Send,
  Volume2,
  VolumeX,
  Bot,
  User,
  Loader2,
  Play,
  Pause,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlantAnalysis } from "./api/analyze";
import { getHistoryEntry } from "@/lib/history";
import { z } from "zod";

const searchSchema = z.object({ id: z.string().optional() });

export const Route = createFileRoute("/result")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Diagnosis Result — PlantGuard AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

type Stored = { analysis: PlantAnalysis; image: string };

function ResultPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    if (id) {
      const entry = getHistoryEntry(id);
      if (entry) {
        setData({ analysis: entry.analysis, image: entry.image });
        return;
      }
    }
    const raw = sessionStorage.getItem("plantguard:analysis");
    if (!raw) {
      navigate({ to: "/detect" });
      return;
    }
    try {
      setData(JSON.parse(raw) as Stored);
    } catch {
      navigate({ to: "/detect" });
    }
  }, [navigate, id]);

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ResultView data={data} />;
}

function severityStyles(sev: PlantAnalysis["severity"]) {
  switch (sev) {
    case "High":
      return "bg-destructive/15 text-destructive border-destructive/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400";
    case "Low":
      return "bg-primary/15 text-primary border-primary/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function ResultView({ data }: { data: Stored }) {
  const { analysis, image } = data;
  const healthy = analysis.healthy;
  const [voice, setVoice] = useState<string>("alloy");
  const player = useTtsPlayer();

  const diagnosisScript = useMemo(() => buildDiagnosisScript(analysis), [analysis]);


  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> New scan
        </Link>
        <Badge variant="secondary" className="glass">
          <Sparkles className="h-3 w-3 mr-1" /> Analysis complete
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: image + summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="glass rounded-2xl overflow-hidden">
            <img src={image} alt="Analyzed plant" className="w-full aspect-square object-cover" />
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Leaf className="h-4 w-4" /> {analysis.cropType || "Unknown crop"}
              {analysis.issueType && analysis.issueType !== "unknown" && (
                <Badge variant="outline" className="ml-auto capitalize">
                  {analysis.issueType}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold">
              {healthy ? (
                <span className="text-gradient-brand">Plant looks healthy</span>
              ) : (
                analysis.diseaseName
              )}
            </h1>
            {analysis.pestName && (
              <p className="text-sm text-muted-foreground mt-1">
                Pest: <span className="font-medium text-foreground">{analysis.pestName}</span>
              </p>
            )}
            {analysis.scientificName && (
              <p className="text-sm italic text-muted-foreground">
                {analysis.scientificName}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className={`border ${severityStyles(analysis.severity)}`} variant="outline">
                {healthy ? (
                  <ShieldCheck className="h-3 w-3 mr-1" />
                ) : (
                  <ShieldAlert className="h-3 w-3 mr-1" />
                )}
                Severity: {analysis.severity}
              </Badge>
              <Badge variant="outline" className="glass">
                Confidence: {Math.round(analysis.confidence)}%
              </Badge>
            </div>

            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, Math.round(analysis.confidence))}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full gradient-brand"
              />
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {analysis.description}
            </p>
          </div>

          <QuickFacts analysis={analysis} />
        </motion.div>

        {/* Right: details + chat */}
        <div className="lg:col-span-2 space-y-6">
          <Recommendations analysis={analysis} />
          <ChatPanel analysis={analysis} />
        </div>
      </div>
    </main>
  );
}

function QuickFacts({ analysis }: { analysis: PlantAnalysis }) {
  const facts = [
    { icon: Clock, label: "Recovery time", value: analysis.recoveryTime },
    { icon: Droplets, label: "Watering", value: analysis.wateringAdvice },
    { icon: Sprout, label: "Fertilizer", value: analysis.fertilizerAdvice },
    { icon: CloudSun, label: "Weather", value: analysis.weatherConsiderations },
  ];
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold">Quick facts</h3>
      {facts.map((f) => (
        <div key={f.label} className="flex gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <f.icon className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              {f.label}
            </div>
            <div className="text-sm">{f.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "danger" | "success";
}) {
  if (!items?.length) return null;
  const dot =
    tone === "danger"
      ? "bg-destructive"
      : tone === "success"
        ? "bg-primary"
        : "bg-foreground/60";
  return (
    <div>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
            <span className="text-muted-foreground leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Recommendations({ analysis }: { analysis: PlantAnalysis }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass rounded-2xl p-6 sm:p-8"
    >
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        <Section title="Symptoms" items={analysis.symptoms} />
        <Section title="Causes" items={analysis.causes} />
        <Section title="Immediate actions" items={analysis.immediateActions} tone="danger" />
        <Section title="Prevention tips" items={analysis.preventionTips} tone="success" />
        <Section title="Organic treatments" items={analysis.organicTreatments} tone="success" />
        <Section title="Chemical treatments" items={analysis.chemicalTreatments} />
      </div>
    </motion.div>
  );
}

/* ---------------- Chat ---------------- */

function ChatPanel({ analysis }: { analysis: PlantAnalysis }) {
  const diseaseContext = useMemo(
    () =>
      `Disease: ${analysis.diseaseName}\nCrop: ${analysis.cropType}\nSeverity: ${analysis.severity}\nConfidence: ${analysis.confidence}%\nDescription: ${analysis.description}\nSymptoms: ${analysis.symptoms.join("; ")}\nCauses: ${analysis.causes.join("; ")}\nOrganic treatments: ${analysis.organicTreatments.join("; ")}\nChemical treatments: ${analysis.chemicalTreatments.join("; ")}\nPrevention: ${analysis.preventionTips.join("; ")}`,
    [analysis],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { diseaseContext },
      }),
    [diseaseContext],
  );

  const { messages, sendMessage, status } = useChat({
    id: `chat:${analysis.diseaseName}`,
    transport,
  });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const suggestions = [
    "How do I treat this?",
    "Can this spread to nearby plants?",
    "What organic treatment can I use?",
    "How often should I water?",
  ];

  const speak = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.onend = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="p-5 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">Ask PlantGuard AI</h3>
            <p className="text-xs text-muted-foreground">
              Grounded in your current diagnosis
            </p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Ask follow-up questions about your diagnosis.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            message={m}
            speak={speak}
            speakingId={speakingId}
          />
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
            Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border/60 p-3 flex items-end gap-2 bg-background/60"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about treatment, spread, watering…"
          className="flex-1 resize-none rounded-xl bg-background border border-input px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
          disabled={busy}
        />
        <Button
          type="submit"
          disabled={busy || !input.trim()}
          className="gradient-brand text-primary-foreground shadow-glow border-0 h-10 w-10 p-0 shrink-0"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </motion.div>
  );
}

function ChatMessage({
  message,
  speak,
  speakingId,
}: {
  message: UIMessage;
  speak: (id: string, text: string) => void;
  speakingId: string | null;
}) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  const isUser = message.role === "user";
  const speaking = speakingId === message.id;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center ${
          isUser ? "bg-primary text-primary-foreground" : "gradient-brand text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{text}</span>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown>{text || "…"}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && text && (
          <div className="mt-1">
            <button
              onClick={() => speak(message.id, text)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {speaking ? (
                <>
                  <VolumeX className="h-3 w-3" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-3 w-3" /> Listen
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
