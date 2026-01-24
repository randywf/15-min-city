export interface GeocodeResult {
  lat: number;
  lng: number;
  name: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&limit=5`
    );
    
    if (!response.ok) throw new Error("Geocoding failed");
    
    const results = await response.json();
    
    return results.map((r: any) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      name: r.display_name,
    }));
  } catch (error) {
    console.error("Geocoding error:", error);
    throw error;
  }
}

// Debounce helper for live search
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}