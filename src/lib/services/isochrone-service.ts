export async function getPointToPoi(
  longitude: number,
  latitude: number,
  mode: "walk" | "bike" | "car",
  time: number = 600,
  amenity_ordered_by_relevance: any,     // whatever your build_default_amenity_state() shape is
  signal?: AbortSignal
) {
  const url =
    `http://127.0.0.1:8000/point_to_poi` +
    `?longitude=${encodeURIComponent(longitude)}` +
    `&latitude=${encodeURIComponent(latitude)}` +
    `&mode=${encodeURIComponent(mode)}` +
    `&time=${encodeURIComponent(time)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(amenity_ordered_by_relevance),
    signal
  });

  console.log(url)

  const text = await res.text(); // useful for debugging 422
  if (!res.ok) throw new Error(`Request failed ${res.status}: ${text}`);

  return JSON.parse(text);
}




/// --- Amenity Configuration Types and Fetching ---
export type AmenityEnabled = { enabled: boolean };

export type AmenityGroup = {
	rank: number;
	enabled: boolean;
	amenities: Record<string, AmenityEnabled>;
};

export type AmenitiesResponse = Record<string, AmenityGroup>;

const API_BASE = "http://localhost:8000"; // later: move to env (VITE_API_BASE_URL)

/**
 * Fetch amenity configuration from backend.
 */
export async function getAmenities(signal?: AbortSignal): Promise<AmenitiesResponse> {
	const res = await fetch(`${API_BASE}/amenities`, {
		method: "GET",
		signal
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`GET /amenities failed: ${res.status} ${res.statusText} ${text}`);
	}

	return (await res.json()) as AmenitiesResponse;
}