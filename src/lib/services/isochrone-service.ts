

export async function getPointToPoi(
	longitude: number,
	latitude: number,
	mode: "walk" | "bike" | "car" = "walk",
	time: number = 600
) {
	const url = `http://127.0.0.1:8000/point_to_poi?longitude=${longitude}&latitude=${latitude}&mode=${mode}&time=${time}`;

	const res = await fetch(url);

	if (!res.ok) {
		throw new Error(`Request failed with status ${res.status}`);
	}

	return await res.json();  // Returns: { amenities, score, polygon }
}

// call isochrone API
// function getIsochrone(lat: number, lon: number) {
//   return fetch(`https://api.openrouteservice.org/v2/isochrones/driving-car?api_key=${process.env.OPENROUTESERVICE_API_KEY}&point=${lat},${lon}&profile=driving-car&range=15&units=km`);
// }

// export default getIsochrone;