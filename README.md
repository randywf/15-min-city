# 15 Minute City

An interactive web application for analyzing urban accessibility through the lens of the 15-minute city concept.

This tool helps users visualize which amenities and points of interest are reachable within 15 minutes from any location, using different modes of transportation. By generating isochrone maps and analyzing real-time POI data, it provides insights into urban accessibility and walkability.

**Project Wiki:** https://github.com/randywf/15-min-city-wiki/wiki

## Features

- **Interactive Location Selection** - Click anywhere on the map or use your current location to analyze accessibility
- **Multiple Transport Modes** - Analyze reachability by walking and cycling
- **15-Minute Isochrone Visualization** - See the exact area reachable within 15 minutes from your selected location
- **Real-Time POI Discovery** - Automatically find amenities within the reachable area from 22 different categories
- **Amenity Density Heatmap** - Visualize the concentration of amenities across the map
- **Accessibility Scoring** - Evaluate location quality based on amenity availability

### Supported Amenity Types

The application tracks 22 different amenity categories including: restaurants, cafes, bars, pubs, fast food, ice cream shops, schools, libraries, pharmacies, clinics, theatres, cinemas, bicycle parking, regular parking, fuel stations, BBQ areas, biergartens, and public toilets.

## Tech Stack

- **Frontend Framework:** SvelteKit 2 with TypeScript
- **Build Tool:** Vite
- **Mapping Library:** Leaflet.js with leaflet.heat for heatmap visualization
- **Data Visualization:** Chart.js
- **APIs:** Locally hosted routing service (isochrones), Overpass API (POI data)
- **Backend:** Python FastAPI (separate repository) - handles routing calculations and POI queries

## Prerequisites

Before running this application, you need:

- **Node.js** (v18 or higher recommended)
- **Python Backend** - The [15-min-city-api](https://github.com/randywf/15-min-city-api) must be running locally. See the backend repository for setup instructions.

## Setup & Installation

1. **Clone the repository**

```bash
git clone https://github.com/randywf/15-min-city.git
cd 15-min-city
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the backend API**

Follow the setup instructions in the [15-min-city-api](https://github.com/randywf/15-min-city-api) repository to start the Python backend service.

4. **(Optional) Configure backend URL**

If your backend is not running on the default `http://127.0.0.1:8000`, create a `.env` file in the project root:

```bash
VITE_API_BASE_URL=http://your-backend-url:port
```

5. **Run the development server**

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

The application will be available at `http://localhost:5173` (or the next available port).

## Development

### Available Commands

- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally
- `npm run check` - Run TypeScript and Svelte checks
- `npm run check:watch` - Run checks in watch mode

## Architecture

The application follows a component-based architecture:

### Components
- **MapView** - Main container component managing application state
- **MapCanvas** - Handles map rendering, user interactions, and isochrone visualization
- **Sidebar** - Control panel for transport mode selection and location input
- **Heatmap** - Renders amenity density heatmap overlay
- **Score** - Displays accessibility scoring metrics

### Services
- **isochrone-service** - Communicates with backend for isochrone generation
- **poi-service** - Queries Overpass API for POI data within isochrone boundaries
- **heatmap-service** - Fetches pre-computed heatmap data from backend

### Data Flow
1. User selects a location and transport mode
2. Frontend requests isochrone from Python backend
3. Backend calculates reachable area and returns GeoJSON polygon
4. Frontend queries POIs within the isochrone boundary
5. Results are visualized on the map with markers and overlays

## Backend Repository

The backend service is required for this application to function. It handles:
- Isochrone generation using locally hosted routing data
- POI data aggregation and heatmap pre-computation
- Accessibility scoring calculations

**Backend Repository:** https://github.com/randywf/15-min-city-api

## Deployment

To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment. Ensure the backend service is also deployed and accessible from your frontend deployment.

## License

See the [LICENSE](LICENSE) file for details.
