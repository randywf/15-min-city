/**
 * Fetches POIs within a specific isochrone from the local service.
 * * @param latitude - The latitude of the starting point.
 * @param longitude - The longitude of the starting point.
 * @param mode - The mode of transport (e.g., 'walk', 'car').
 * @param time - The max travel time in seconds.
 */
export function getPointToPoi(
    latitude: number | null,
    longitude: number | null,
    mode: string,
    time: number
): Promise<Response> {

  // Construct the URL with query parameters
  const baseUrl = 'http://localhost:8000/point_to_poi';
  const queryParams = `longitude=${longitude}&latitude=${latitude}&mode=${mode}&time=${time}`;
  const url = `${baseUrl}?${queryParams}`;

  return fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
}