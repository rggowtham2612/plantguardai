import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ScanLine,
  Sparkles,
  Volume2,
  Languages,
  FileDown,
  LineChart,
  ShieldCheck,
  ArrowRight,
  Leaf,
} from "lucide-react";
import heroImage from "@/assets/hero-plant.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  {
    icon: ScanLine,
    title: "Disease Detection",
    desc: "Upload a plant image for instant AI-powered diagnosis with confidence scores.",
  },
  {
    icon: Sparkles,
    title: "AI Treatment Advisor",
    desc: "Receive tailored treatment and prevention recommendations grounded in agronomy.",
  },
  {
    icon: Volume2,
    title: "Voice Assistant",
    desc: "Listen to recommendations hands-free while you're in the field.",
  },
  {
    icon: Languages,
    title: "Multi-Language",
    desc: "Localized guidance so every farmer understands the plan.",
  },
  {
    icon: FileDown,
    title: "Download Reports",
    desc: "Generate professional PDF diagnosis reports to share and archive.",
  },
  {
    icon: LineChart,
    title: "Crop Health Analytics",
    desc: "Track scans and disease history over time to spot patterns early.",
  },
];

const stats = [
  { value: "50+", label: "Supported Diseases" },
  { value: "98%", label: "Detection Accuracy" },
  { value: "5+", label: "Languages Supported" },
  { value: "AI", label: "Treatment Recommendations" },
];

function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Powered by Gemini AI
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05]">
              Protect Your Crops with{" "}
              <span className="text-gradient-brand">AI-Powered</span> Disease Detection
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Upload a leaf image and receive instant disease diagnosis, treatment
              recommendations, prevention tips, and farming insights — in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/detect">
                <Button
                  size="lg"
                  className="gradient-brand text-primary-foreground shadow-glow hover:scale-105 transition-transform border-0"
                >
                  <ScanLine className="mr-2 h-5 w-5" />
                  Detect Disease
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-primary/30">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> No account needed
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" /> 50+ crops supported
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 gradient-brand opacity-20 blur-3xl rounded-full" />
            <div className="relative glass rounded-3xl overflow-hidden shadow-glow">
              <img
                src={heroImage}
                alt="AI scanning a tomato leaf for disease"
                width={1408}
                height={1024}
                className="w-full h-auto"
              />
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "100%" }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent pointer-events-none"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="glass rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold text-gradient-brand font-display">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Everything a modern farmer needs
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete AI toolkit built for real-world agriculture — from field to phone.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:shadow-glow transition-shadow group"
            >
              <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="relative rounded-3xl overflow-hidden gradient-brand p-10 sm:p-16 text-center shadow-glow">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
              Ready to diagnose your first plant?
            </h2>
            <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
              It takes about 10 seconds. Just snap a photo of a leaf.
            </p>
            <Link to="/detect">
              <Button
                size="lg"
                className="mt-8 bg-background text-foreground hover:bg-background/90"
              >
                <ScanLine className="mr-2 h-5 w-5" />
                Start Detection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        Built with care · PlantGuard AI © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
