import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Trash2, ImageOff, ShieldAlert, ShieldCheck, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getHistory, deleteHistoryEntry, clearHistory, type HistoryEntry } from "@/lib/history";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Detection History — PlantGuard AI" },
      {
        name: "description",
        content: "Revisit your past PlantGuard AI plant diagnoses with timestamps and full results.",
      },
      { property: "og:title", content: "Detection History — PlantGuard AI" },
      {
        property: "og:description",
        content: "Revisit your past PlantGuard AI plant diagnoses with timestamps and full results.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HistoryPage,
});

function formatTime(ts: number) {
  const d = new Date(ts);
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function severityStyles(sev: HistoryEntry["analysis"]["severity"]) {
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

function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setLoaded(true);
  }, []);

  const remove = (id: string) => {
    deleteHistoryEntry(id);
    setEntries(getHistory());
  };

  const clearAll = () => {
    if (!confirm("Clear all detection history?")) return;
    clearHistory();
    setEntries([]);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">
            Detection <span className="text-gradient-brand">history</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your recent scans — stored privately on this device.
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear all
          </Button>
        )}
      </div>

      {loaded && entries.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ImageOff className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your future diagnoses will appear here.
          </p>
          <div className="mt-6">
            <Link
              to="/detect"
              className="inline-flex items-center rounded-lg gradient-brand px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow hover:scale-105 transition-transform"
            >
              Start a scan
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="glass rounded-2xl overflow-hidden group flex flex-col"
            >
              <Link
                to="/result"
                search={{ id: e.id }}
                className="block relative aspect-video overflow-hidden bg-muted"
              >
                <img
                  src={e.image}
                  alt={e.analysis.diseaseName}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-background/80 backdrop-blur">
                  <Clock className="h-3 w-3" /> {formatTime(e.timestamp)}
                </div>
              </Link>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Leaf className="h-3 w-3" />
                  <span className="truncate">{e.analysis.cropType || "Unknown"}</span>
                </div>
                <h3 className="mt-1 font-semibold leading-tight line-clamp-2">
                  {e.analysis.healthy ? "Healthy plant" : e.analysis.diseaseName}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className={`border text-[10px] ${severityStyles(e.analysis.severity)}`}
                  >
                    {e.analysis.healthy ? (
                      <ShieldCheck className="h-3 w-3 mr-1" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 mr-1" />
                    )}
                    {e.analysis.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(e.analysis.confidence)}%
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/60">
                  <Link
                    to="/result"
                    search={{ id: e.id }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View details →
                  </Link>
                  <button
                    onClick={() => remove(e.id)}
                    className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
