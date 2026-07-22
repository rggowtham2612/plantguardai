import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Bug, Leaf, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Disease & Pest Library — PlantGuard AI" },
      {
        name: "description",
        content:
          "Browse common crop diseases and pest infestations with symptoms, causes, organic and chemical remedies, and prevention tips.",
      },
      { property: "og:title", content: "Disease & Pest Library — PlantGuard AI" },
      {
        property: "og:description",
        content:
          "A practical reference of plant diseases and pests with proven remedies for farmers and gardeners.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

type Entry = {
  id: string;
  name: string;
  scientific?: string;
  type: "disease" | "pest";
  category: string;
  crops: string[];
  symptoms: string[];
  causes: string[];
  organic: string[];
  chemical: string[];
  prevention: string[];
};

const ENTRIES: Entry[] = [
  {
    id: "late-blight",
    name: "Late Blight",
    scientific: "Phytophthora infestans",
    type: "disease",
    category: "Fungal (Oomycete)",
    crops: ["Tomato", "Potato"],
    symptoms: [
      "Water-soaked dark lesions on leaves and stems",
      "White fuzzy growth on leaf undersides in humid weather",
      "Brown, greasy patches on fruit that spread rapidly",
    ],
    causes: ["Cool wet weather (10–20°C)", "Overhead irrigation", "Infected seed tubers"],
    organic: [
      "Copper-based fungicide sprays every 5–7 days",
      "Remove and burn infected plants immediately",
      "Improve airflow by pruning and wider spacing",
    ],
    chemical: [
      "Mancozeb or chlorothalonil preventively",
      "Metalaxyl or dimethomorph for curative action",
    ],
    prevention: [
      "Plant certified disease-free seed",
      "Rotate crops (avoid solanaceous plants for 3 years)",
      "Water at the base early in the day",
      "Use resistant varieties when available",
    ],
  },
  {
    id: "powdery-mildew",
    name: "Powdery Mildew",
    scientific: "Erysiphales spp.",
    type: "disease",
    category: "Fungal",
    crops: ["Cucurbits", "Grapes", "Roses", "Wheat"],
    symptoms: [
      "White powdery patches on upper leaf surfaces",
      "Yellowing and curling of infected leaves",
      "Stunted growth and reduced yield",
    ],
    causes: ["Warm days, cool nights, high humidity", "Poor air circulation", "Dense canopy"],
    organic: [
      "Potassium bicarbonate spray weekly",
      "Neem oil or diluted milk spray (1:9 with water)",
      "Sulfur dust in early morning",
    ],
    chemical: ["Myclobutanil", "Trifloxystrobin", "Tebuconazole"],
    prevention: [
      "Space plants for good airflow",
      "Avoid overhead watering late in the day",
      "Choose mildew-resistant cultivars",
    ],
  },
  {
    id: "leaf-rust",
    name: "Leaf Rust",
    scientific: "Puccinia spp.",
    type: "disease",
    category: "Fungal",
    crops: ["Wheat", "Coffee", "Beans"],
    symptoms: [
      "Orange, yellow, or brown pustules on leaves",
      "Premature leaf drop",
      "Reduced grain fill and yield loss",
    ],
    causes: ["High humidity and moderate temperatures", "Wind-borne spores", "Susceptible varieties"],
    organic: ["Sulfur sprays", "Remove volunteer plants and alternate hosts"],
    chemical: ["Propiconazole", "Tebuconazole", "Azoxystrobin"],
    prevention: [
      "Plant rust-resistant varieties",
      "Time planting to avoid peak spore periods",
      "Rotate crops",
    ],
  },
  {
    id: "bacterial-blight",
    name: "Bacterial Leaf Blight",
    scientific: "Xanthomonas oryzae",
    type: "disease",
    category: "Bacterial",
    crops: ["Rice", "Cotton"],
    symptoms: [
      "Water-soaked yellow stripes along leaf edges",
      "Leaves turn grayish-white and wilt",
      "Bacterial ooze visible in humid mornings",
    ],
    causes: ["Warm humid conditions", "Wounds from wind or insects", "Contaminated seed"],
    organic: [
      "Copper hydroxide sprays",
      "Remove and destroy infected debris",
      "Balanced fertilization (avoid excess nitrogen)",
    ],
    chemical: ["Streptomycin (where permitted)", "Copper oxychloride"],
    prevention: [
      "Use certified clean seed",
      "Field sanitation after harvest",
      "Plant resistant varieties",
    ],
  },
  {
    id: "mosaic-virus",
    name: "Mosaic Virus",
    type: "disease",
    category: "Viral",
    crops: ["Tomato", "Tobacco", "Cucumber", "Pepper"],
    symptoms: [
      "Mottled light and dark green patches on leaves",
      "Leaf distortion and curling",
      "Stunted plants with mottled fruit",
    ],
    causes: ["Aphid or whitefly transmission", "Infected tools and hands", "Contaminated seed"],
    organic: [
      "Remove and destroy infected plants immediately",
      "Wash hands and disinfect tools with 10% bleach",
      "Control aphid vectors with neem oil",
    ],
    chemical: ["No cure — manage vectors with imidacloprid or pymetrozine"],
    prevention: [
      "Use virus-free seed and resistant varieties",
      "Reflective mulches to deter vectors",
      "Weed control around fields",
    ],
  },
  {
    id: "anthracnose",
    name: "Anthracnose",
    scientific: "Colletotrichum spp.",
    type: "disease",
    category: "Fungal",
    crops: ["Mango", "Beans", "Pepper", "Banana"],
    symptoms: [
      "Sunken dark lesions on fruit and stems",
      "Pinkish spore masses in humid conditions",
      "Leaf spots with concentric rings",
    ],
    causes: ["Warm wet weather", "Splashing rain spreading spores", "Overripe fruit left in field"],
    organic: ["Copper fungicide", "Prune and destroy infected parts", "Bacillus subtilis biofungicide"],
    chemical: ["Azoxystrobin", "Chlorothalonil", "Mancozeb"],
    prevention: [
      "Harvest fruit promptly",
      "Prune for airflow",
      "Rotate with non-host crops",
    ],
  },
  {
    id: "aphids",
    name: "Aphid Infestation",
    scientific: "Aphidoidea",
    type: "pest",
    category: "Sap-sucking insect",
    crops: ["Most vegetables and ornamentals"],
    symptoms: [
      "Clusters of tiny green, black, or gray insects on new growth",
      "Curled, yellowing leaves and sticky honeydew",
      "Sooty mold growing on honeydew",
    ],
    causes: ["Warm dry weather", "Excess nitrogen fertilization", "Absence of natural predators"],
    organic: [
      "Strong water spray to dislodge colonies",
      "Insecticidal soap or neem oil every 5–7 days",
      "Release ladybugs or lacewings",
    ],
    chemical: ["Imidacloprid", "Pymetrozine", "Acetamiprid"],
    prevention: [
      "Encourage beneficial insects with flowering borders",
      "Avoid over-fertilizing with nitrogen",
      "Use reflective mulches",
    ],
  },
  {
    id: "whiteflies",
    name: "Whiteflies",
    scientific: "Bemisia tabaci / Trialeurodes vaporariorum",
    type: "pest",
    category: "Sap-sucking insect",
    crops: ["Tomato", "Cotton", "Cassava", "Ornamentals"],
    symptoms: [
      "Clouds of tiny white insects fly up when plants are disturbed",
      "Yellowing leaves and honeydew deposits",
      "Transmission of viral diseases",
    ],
    causes: ["Warm greenhouse conditions", "Continuous cropping", "Lack of predators"],
    organic: [
      "Yellow sticky traps",
      "Neem oil or insecticidal soap on leaf undersides",
      "Release Encarsia formosa parasitoid wasps",
    ],
    chemical: ["Spiromesifen", "Pyriproxyfen", "Buprofezin"],
    prevention: [
      "Screen greenhouse vents",
      "Remove crop residue between plantings",
      "Rotate insecticide modes of action",
    ],
  },
  {
    id: "spider-mites",
    name: "Spider Mites",
    scientific: "Tetranychus urticae",
    type: "pest",
    category: "Mite",
    crops: ["Beans", "Tomato", "Cucumber", "Strawberry"],
    symptoms: [
      "Fine stippling / tiny yellow dots on leaves",
      "Fine webbing between leaves and stems",
      "Bronzed, dry leaves that drop early",
    ],
    causes: ["Hot dry conditions", "Dusty foliage", "Broad-spectrum insecticide overuse"],
    organic: [
      "Blast plants with water to knock down populations",
      "Release predatory mites (Phytoseiulus persimilis)",
      "Horticultural oil or sulfur",
    ],
    chemical: ["Abamectin", "Bifenazate", "Etoxazole"],
    prevention: [
      "Maintain humidity and avoid drought stress",
      "Rinse dusty leaves periodically",
      "Preserve natural predators",
    ],
  },
  {
    id: "leaf-miner",
    name: "Leaf Miners",
    scientific: "Liriomyza spp.",
    type: "pest",
    category: "Fly larva",
    crops: ["Tomato", "Beans", "Chrysanthemum", "Citrus"],
    symptoms: [
      "Winding, silvery tunnels inside leaves",
      "Blotches and premature leaf drop",
      "Reduced photosynthesis and vigor",
    ],
    causes: ["Warm season adults laying eggs in leaves", "Nearby infested weeds"],
    organic: [
      "Remove and destroy mined leaves",
      "Yellow sticky traps for adults",
      "Release parasitoid wasps (Diglyphus isaea)",
    ],
    chemical: ["Abamectin", "Cyromazine", "Spinosad"],
    prevention: [
      "Weed control around fields",
      "Row covers on young plants",
      "Rotate crops",
    ],
  },
  {
    id: "caterpillars",
    name: "Caterpillars & Armyworms",
    scientific: "Spodoptera / Helicoverpa spp.",
    type: "pest",
    category: "Chewing insect",
    crops: ["Maize", "Cotton", "Tomato", "Cabbage"],
    symptoms: [
      "Irregular holes chewed in leaves and fruit",
      "Frass (dark droppings) on foliage",
      "Skeletonized or defoliated plants",
    ],
    causes: ["Egg masses laid by night-flying moths", "Warm humid seasons"],
    organic: [
      "Handpick caterpillars in small plantings",
      "Bacillus thuringiensis (Bt) sprays at dusk",
      "Pheromone traps to monitor and mass-trap moths",
    ],
    chemical: ["Spinosad", "Emamectin benzoate", "Chlorantraniliprole"],
    prevention: [
      "Scout fields weekly during moth flights",
      "Encourage birds and parasitoid wasps",
      "Destroy crop residue after harvest",
    ],
  },
  {
    id: "thrips",
    name: "Thrips",
    scientific: "Thysanoptera",
    type: "pest",
    category: "Rasping insect",
    crops: ["Onion", "Cotton", "Beans", "Ornamentals"],
    symptoms: [
      "Silvery streaks and black specks on leaves",
      "Distorted new growth and flower buds",
      "Transmission of tospoviruses",
    ],
    causes: ["Hot dry weather", "Weedy field edges", "Continuous host crops"],
    organic: [
      "Blue sticky traps",
      "Spinosad or neem oil sprays",
      "Release predatory mites (Amblyseius swirskii)",
    ],
    chemical: ["Spinetoram", "Abamectin", "Methomyl"],
    prevention: [
      "Reflective mulch to disorient adults",
      "Remove weed hosts",
      "Rotate chemical modes of action",
    ],
  },
];

function LibraryPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "disease" | "pest">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return ENTRIES.filter((e) => {
      if (filter !== "all" && e.type !== filter) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        e.scientific?.toLowerCase().includes(needle) ||
        e.crops.some((c) => c.toLowerCase().includes(needle)) ||
        e.symptoms.some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [q, filter]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
        <Badge variant="secondary" className="glass mb-4">
          <Sparkles className="h-3 w-3 mr-1" /> Reference library
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Diseases, <span className="text-gradient-brand">pests</span> & remedies
        </h1>
        <p className="mt-4 text-muted-foreground">
          A quick-reference guide to the most common crop threats — with symptoms, causes, and
          organic and chemical treatment options.
        </p>
      </motion.div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, crop, or symptom…"
            className="w-full rounded-xl bg-background border border-input pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "disease", "pest"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors capitalize ${
                filter === f
                  ? "gradient-brand text-primary-foreground border-transparent shadow-glow"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {f === "all" ? "All" : f + "s"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-5">
        {filtered.map((e, i) => (
          <motion.article
            key={e.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
            className="glass rounded-2xl p-6 flex flex-col"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    e.type === "pest"
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {e.type === "pest" ? <Bug className="h-5 w-5" /> : <Leaf className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="font-semibold leading-tight">{e.name}</h2>
                  {e.scientific && (
                    <p className="text-xs italic text-muted-foreground">{e.scientific}</p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="capitalize shrink-0">
                {e.type}
              </Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">{e.category}</Badge>
              {e.crops.slice(0, 3).map((c) => (
                <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
              ))}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <MiniList title="Symptoms" items={e.symptoms} />
              <MiniList title="Causes" items={e.causes} />
              <MiniList title="Organic remedies" items={e.organic} tone="success" />
              <MiniList title="Chemical remedies" items={e.chemical} />
              <MiniList title="Prevention" items={e.prevention} tone="success" />
            </div>
          </motion.article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground mt-16">
          No entries match "{q}". Try a different search.
        </div>
      )}

      <div className="mt-14 glass rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center shadow-glow shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Not sure what's wrong with your plant?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload a photo and PlantGuard AI will identify the disease or pest and suggest
              tailored remedies.
            </p>
          </div>
        </div>
        <Link
          to="/detect"
          className="inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:scale-105 transition-transform"
        >
          Scan a plant <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}

function MiniList({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "success";
}) {
  const dot = tone === "success" ? "bg-primary" : "bg-foreground/50";
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {title}
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
            <span className="text-muted-foreground leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
