// --- TypeScript Interfaces for Overpass Data ---
// Define the structure of the data tags
interface OverpassTags {
    name?: string;
    amenity?: string;
    cuisine?: string;
    [key: string]: string | undefined; // Allow other tags
}

// Define the structure of a single element (Node, Way, or Relation)
interface OverpassElement {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    // 'center' is present if using 'out center' for ways/relations
    center?: { lat: number; lon: number; };
    tags: OverpassTags;
}

// Define the structure of the full API response
interface OverpassResponse {
    version: number;
    generator: string;
    elements: OverpassElement[];
}


/**
 * Queries the Overpass API with a custom Overpass QL string.
 *
 * @param query The complete Overpass QL query string.
 * @returns A promise that resolves to an array of OverpassElements.
 */
export async function fetchOverpassData(query: string): Promise<OverpassElement[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';

    try {
        // NOTE: The query must be properly encoded for the HTTP request body.
        const response = await fetch(overpassUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // The Overpass API expects the query data to be sent with the 'data=' prefix
            body: `data=${encodeURIComponent(query)}`
        });

        if (!response.ok) {
            // Log the error and throw an exception to be caught by the caller
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}. Body: ${errorText}`);
        }

        const data: OverpassResponse = await response.json();

        return data.elements;

    } catch (error) {
        console.error("Error fetching OSM data:", error);
        // Return an empty array on error to allow the calling component to handle failure gracefully
        return [];
    }
}

// --- Example Usage ---

// A complex polygon definition for a hypothetical park boundary
// (lat lon pairs, ensuring a closed shape)
const parkPolygonCoords = "51.968 7.625 51.970 7.635 51.965 7.638 51.963 7.628 51.968 7.625";


/**
 * Example function showing how to call the service with a Polygon Query
 * This query is now explicitly defined to fetch ONLY nodes.
 */
export async function getCafesInParkPolygon() {
    const cafeQuery = `
        [out:json][timeout:25];
        
        // Find ONLY nodes (points) with the tag amenity=cafe
        // inside the defined polygon area.
        node
            ["amenity"="cafe"]
            (poly:"${parkPolygonCoords}");
        
        // Output all results. Since we only requested nodes, they will all
        // have direct 'lat' and 'lon' properties.
        out geom;
    `;

    console.log("Running Query for Cafes within Polygon...");

    const cafes = await fetchOverpassData(cafeQuery);

    console.log(`Found ${cafes.length} cafes in the polygon area.`);

    // Log details for the first few cafes
    cafes.slice(0, 5).forEach(cafe => {
        const name = cafe.tags.name || 'Unnamed Cafe';
        // For nodes, lat/lon are direct properties
        const lat = cafe.lat;
        const lon = cafe.lon;
        console.log(`  - ${name} (Node) at ${lat}, ${lon}`);
    });

    return cafes;
}

// Optional: Run the example function to test
getCafesInParkPolygon();
export type { OverpassElement };
