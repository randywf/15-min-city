function getIsochrone(lat: number, lon: number) {
  return fetch(`https://api.openrouteservice.org/v2/isochrones/driving-car?api_key=${process.env.OPENROUTESERVICE_API_KEY}&point=${lat},${lon}&profile=driving-car&range=15&units=km`);
}

export default getIsochrone;