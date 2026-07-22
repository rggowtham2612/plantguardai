import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload, Camera, X, ScanLine, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { PlantAnalysis } from "./api/analyze";

export const Route = createFileRoute("/detect")({
  head: () => ({
    meta: [
      { title: "Detect Plant Disease — PlantGuard AI" },
      {
        name: "description",
        content:
          "Upload a leaf image and let PlantGuard AI diagnose diseases instantly.",
      },
    ],
  }),
  component: DetectPage,
});

const STEPS = [
  "Image Processing",
  "Leaf Feature Extraction",
  "Disease Classification",
  "Treatment Generation",
  "Final Results",
] as const;

function DetectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const handleFile = (f: File) => {
    if (!/image\/(jpeg|jpg|png)/i.test(f.type)) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB.");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setStepIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file || !preview) return;
    setAnalyzing(true);
    setStepIndex(0);

    const stepTimer = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 900);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview, mimeType: file.type }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Analysis failed");
      }
      const data = (await res.json()) as PlantAnalysis;
      if (!data.isPlant) {
        clearInterval(stepTimer);
        setAnalyzing(false);
        setStepIndex(0);
        toast.error("That doesn't look like a plant", {
          description:
            "Please upload a clear photo of a plant leaf, stem, or fruit so PlantGuard AI can diagnose it.",
        });
        return;
      }
      clearInterval(stepTimer);
      setStepIndex(STEPS.length - 1);
      sessionStorage.setItem(
        "plantguard:analysis",
        JSON.stringify({ analysis: data, image: preview }),
      );
      setTimeout(() => navigate({ to: "/result" }), 500);
    } catch (err) {
      clearInterval(stepTimer);
      setAnalyzing(false);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-bold">
          Diagnose your plant in <span className="text-gradient-brand">seconds</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Upload a clear photo of the affected leaf. JPG or PNG, up to 8MB.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!analyzing ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-3xl p-6 sm:p-10"
          >
            {!preview ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center transition-all ${
                  dragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-primary/30 hover:border-primary/60 hover:bg-primary/5"
                }`}
              >
                <div className="mx-auto h-16 w-16 rounded-2xl gradient-brand flex items-center justify-center shadow-glow mb-4">
                  <Upload className="h-8 w-8 text-primary-foreground" />
                </div>
                <p className="text-lg font-semibold">Drop your leaf image here</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse — JPG, JPEG, PNG
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" /> Browse files
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Use camera
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={onSelect}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onSelect}
                />
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="relative rounded-2xl overflow-hidden bg-muted aspect-square">
                  <img
                    src={preview}
                    alt="Uploaded leaf preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Ready to analyze</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Our AI will inspect the leaf and generate a full diagnosis with
                    treatment recommendations.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={analyze}
                      className="gradient-brand text-primary-foreground shadow-glow hover:scale-105 transition-transform border-0"
                    >
                      <ScanLine className="mr-2 h-5 w-5" /> Analyze Plant
                    </Button>
                    <Button size="lg" variant="outline" onClick={reset}>
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-3xl p-8 sm:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-2xl overflow-hidden aspect-square">
                {preview && (
                  <img
                    src={preview}
                    alt="Analyzing"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-primary/10" />
                <motion.div
                  initial={{ y: "-100%" }}
                  animate={{ y: "100%" }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-primary/60 to-transparent"
                />
                <div className="absolute inset-0 border-2 border-primary/60 rounded-2xl animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your plant
                </div>
                <h3 className="mt-2 text-2xl font-bold">Working the AI magic…</h3>
                <ol className="mt-6 space-y-3">
                  {STEPS.map((s, i) => {
                    const done = i < stepIndex;
                    const active = i === stepIndex;
                    return (
                      <li key={s} className="flex items-center gap-3">
                        <div
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                            done
                              ? "gradient-brand text-primary-foreground"
                              : active
                                ? "bg-primary/20 text-primary ring-2 ring-primary animate-pulse"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? "✓" : i + 1}
                        </div>
                        <span
                          className={`text-sm ${
                            active
                              ? "font-semibold text-foreground"
                              : done
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {s}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
