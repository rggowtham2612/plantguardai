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
  Download,
  Languages,
} from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";
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
  const { image } = data;
  const [analysis, setAnalysis] = useState<PlantAnalysis>(data.analysis);
  const [language, setLanguage] = useState<string>("English");
  const [translating, setTranslating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const healthy = analysis.healthy;
  const [voice, setVoice] = useState<string>("alloy");
  const player = useTtsPlayer();

  const diagnosisScript = useMemo(() => buildDiagnosisScript(analysis), [analysis]);

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    player.stop();
    if (lang === "English") {
      setAnalysis(data.analysis);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, payload: data.analysis }),
      });
      if (!res.ok) throw new Error(await res.text());
      const translated = (await res.json()) as PlantAnalysis;
      setAnalysis({ ...data.analysis, ...translated });
      toast.success(`Translated to ${lang}`);
    } catch (err) {
      console.error(err);
      toast.error("Translation failed. Showing original.");
      setLanguage("English");
      setAnalysis(data.analysis);
    } finally {
      setTranslating(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadAnalysisPdf(analysis, image);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> New scan
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={language} onValueChange={handleLanguageChange} disabled={translating}>
            <SelectTrigger className="glass h-9 w-[150px] text-xs">
              <Languages className="h-3.5 w-3.5 mr-1 opacity-70" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {LANGUAGES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={voice} onValueChange={setVoice}>
            <SelectTrigger className="glass h-9 w-[140px] text-xs">
              <SelectValue placeholder="Voice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alloy">Alloy · Neutral</SelectItem>
              <SelectItem value="nova">Nova · Warm F</SelectItem>
              <SelectItem value="shimmer">Shimmer · Bright F</SelectItem>
              <SelectItem value="coral">Coral · Friendly F</SelectItem>
              <SelectItem value="sage">Sage · Calm</SelectItem>
              <SelectItem value="onyx">Onyx · Deep M</SelectItem>
              <SelectItem value="echo">Echo · Clear M</SelectItem>
              <SelectItem value="ash">Ash · Natural M</SelectItem>
              <SelectItem value="ballad">Ballad · Storyteller</SelectItem>
              <SelectItem value="verse">Verse · Expressive</SelectItem>
              <SelectItem value="fable">Fable · British</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => player.toggle("diagnosis", diagnosisScript, voice)}
            disabled={player.loadingId === "diagnosis" || translating}
            className="gradient-brand text-primary-foreground shadow-glow border-0 h-9"
          >
            {player.loadingId === "diagnosis" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : player.playingId === "diagnosis" ? (
              <>
                <Pause className="h-4 w-4 mr-1" /> Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" /> Read diagnosis
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={downloading || translating}
            className="glass h-9"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" /> PDF
              </>
            )}
          </Button>
          {translating && (
            <Badge variant="secondary" className="glass">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Translating…
            </Badge>
          )}
          <Badge variant="secondary" className="glass hidden sm:inline-flex">
            <Sparkles className="h-3 w-3 mr-1" /> Analysis complete
          </Badge>
        </div>
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
          <ChatPanel analysis={analysis} voice={voice} player={player} />
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

function ChatPanel({
  analysis,
  voice,
  player,
}: {
  analysis: PlantAnalysis;
  voice: string;
  player: TtsPlayer;
}) {

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
    player.toggle(id, text, voice);
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
            speakingId={player.playingId}
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

/* ---------------- TTS ---------------- */

type TtsPlayer = {
  playingId: string | null;
  loadingId: string | null;
  toggle: (id: string, text: string, voice: string) => void;
  stop: () => void;
};

function useTtsPlayer(): TtsPlayer {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const reqRef = useRef(0);

  const stop = () => {
    reqRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setPlayingId(null);
    setLoadingId(null);
  };

  const toggle = async (id: string, text: string, voice: string) => {
    if (playingId === id || loadingId === id) {
      stop();
      return;
    }
    stop();
    const myReq = ++reqRef.current;
    setLoadingId(id);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 7500), voice }),
      });
      if (!res.ok) throw new Error(`TTS ${res.status}`);
      const blob = await res.blob();
      if (myReq !== reqRef.current) return;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        if (myReq === reqRef.current) stop();
      };
      audio.onerror = () => {
        if (myReq === reqRef.current) stop();
      };
      setLoadingId(null);
      setPlayingId(id);
      await audio.play();
    } catch (err) {
      console.error("TTS error", err);
      if (myReq === reqRef.current) {
        setLoadingId(null);
        setPlayingId(null);
      }
    }
  };

  useEffect(() => () => stop(), []);

  return { playingId, loadingId, toggle, stop };
}

function buildDiagnosisScript(a: PlantAnalysis): string {
  const parts: string[] = [];
  if (a.healthy) {
    parts.push(`Good news — your ${a.cropType || "plant"} looks healthy.`);
  } else {
    parts.push(
      `Diagnosis for your ${a.cropType || "plant"}: ${a.diseaseName}${
        a.pestName ? `, pest identified as ${a.pestName}` : ""
      }. Severity is ${a.severity}, with about ${Math.round(a.confidence)} percent confidence.`,
    );
  }
  if (a.description) parts.push(a.description);
  if (a.symptoms?.length) parts.push(`Key symptoms: ${a.symptoms.slice(0, 5).join("; ")}.`);
  if (a.causes?.length) parts.push(`Likely causes: ${a.causes.slice(0, 4).join("; ")}.`);
  if (a.immediateActions?.length)
    parts.push(`Immediate actions: ${a.immediateActions.slice(0, 5).join("; ")}.`);
  if (a.organicTreatments?.length)
    parts.push(`Organic treatments: ${a.organicTreatments.slice(0, 4).join("; ")}.`);
  if (a.chemicalTreatments?.length)
    parts.push(`Chemical treatments if needed: ${a.chemicalTreatments.slice(0, 3).join("; ")}.`);
  if (a.preventionTips?.length)
    parts.push(`Prevention: ${a.preventionTips.slice(0, 4).join("; ")}.`);
  if (a.wateringAdvice) parts.push(`Watering: ${a.wateringAdvice}.`);
  if (a.recoveryTime) parts.push(`Expected recovery time: ${a.recoveryTime}.`);
  return parts.join(" ");
}

const LANGUAGES = [
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
];

async function downloadAnalysisPdf(a: PlantAnalysis, image: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(34, 139, 87);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PlantGuard AI — Diagnosis Report", margin, 38);
  y = 80;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString(), margin, y);
  y += 18;

  // Image
  if (image) {
    try {
      const imgW = 180;
      const imgH = 180;
      ensureSpace(imgH + 10);
      const fmt = image.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(image, fmt, margin, y, imgW, imgH, undefined, "FAST");
      // Side info
      const infoX = margin + imgW + 20;
      let infoY = y + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const title = a.healthy ? "Plant looks healthy" : a.diseaseName || "Diagnosis";
      const titleLines = doc.splitTextToSize(title, maxWidth - imgW - 20);
      doc.text(titleLines, infoX, infoY);
      infoY += titleLines.length * 18 + 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const meta: string[] = [];
      if (a.cropType) meta.push(`Crop: ${a.cropType}`);
      if (a.issueType) meta.push(`Type: ${a.issueType}`);
      if (a.pestName) meta.push(`Pest: ${a.pestName}`);
      if (a.scientificName) meta.push(`Scientific: ${a.scientificName}`);
      meta.push(`Severity: ${a.severity}`);
      meta.push(`Confidence: ${Math.round(a.confidence)}%`);
      for (const line of meta) {
        const wrapped = doc.splitTextToSize(line, maxWidth - imgW - 20);
        doc.text(wrapped, infoX, infoY);
        infoY += wrapped.length * 14;
      }
      y += imgH + 16;
    } catch (err) {
      console.warn("PDF image embed failed", err);
    }
  }

  const writeParagraph = (label: string, text?: string) => {
    if (!text) return;
    ensureSpace(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 12;
    }
    y += 6;
  };

  const writeList = (label: string, items?: string[]) => {
    if (!items?.length) return;
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(label, margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const item of items) {
      const lines = doc.splitTextToSize(`• ${item}`, maxWidth);
      for (const line of lines) {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 12;
      }
    }
    y += 6;
  };

  writeParagraph("Description", a.description);
  writeList("Symptoms", a.symptoms);
  writeList("Causes", a.causes);
  writeList("Immediate actions", a.immediateActions);
  writeList("Organic treatments", a.organicTreatments);
  writeList("Chemical treatments", a.chemicalTreatments);
  writeList("Prevention tips", a.preventionTips);
  writeParagraph("Watering", a.wateringAdvice);
  writeParagraph("Fertilizer", a.fertilizerAdvice);
  writeParagraph("Weather considerations", a.weatherConsiderations);
  writeParagraph("Recovery time", a.recoveryTime);

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `PlantGuard AI • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: "center" },
    );
  }

  const safeName = (a.diseaseName || "diagnosis").replace(/[^\w-]+/g, "_").slice(0, 40);
  doc.save(`plantguard-${safeName}.pdf`);
}
