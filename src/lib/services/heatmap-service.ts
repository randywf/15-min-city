// src/lib/services/heatmap-service.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type HeatmapPoi = {
  lat: number;
  lon: number;
  // optional fields if backend sends them
  amenity: string;
  weight?: number;   // intensity
  count?: number;    // intensity alternative
  // tags?: any;
};

export async function getHeatmapPois(): Promise<HeatmapPoi[]> {
  const res = await fetch(`${API_BASE}/heatmap_pois`, {
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GET /heatmap_pois failed: ${res.status} ${txt}`);
  }

  return res.json();
}
