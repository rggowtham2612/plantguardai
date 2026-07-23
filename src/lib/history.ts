import type { PlantAnalysis } from "@/routes/api/analyze";

export type HistoryEntry = {
  id: string;
  timestamp: number;
  analysis: PlantAnalysis;
  image: string;
};

const KEY = "plantguard:history";
const MAX = 30;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addHistory(analysis: PlantAnalysis, image: string): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    analysis,
    image,
  };
  const list = [entry, ...getHistory()].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage full — drop oldest and retry
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
    } catch {
      /* ignore */
    }
  }
  return entry;
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  return getHistory().find((e) => e.id === id) ?? null;
}

export function deleteHistoryEntry(id: string) {
  const list = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
