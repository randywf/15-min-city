<a id="readme-top"></a>

<div align="center">
 <h1>Welcome to the frontend repository for the 15-Minute City application</h1>
</div>

<br />
<div align="center">
  <p align="center">
    <img src="src/lib/assets/logo_15min.png" alt="15-min-city" width="300"/>
  </p>

  

  <p align="center">
    An application to explore the city of Münster and find your ideal location!
    <br />
    <a href="https://github.com/othneildrew/Best-README-Template"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/othneildrew/Best-README-Template">View Demo</a>
    &middot;
    <a href="https://github.com/othneildrew/Best-README-Template/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/othneildrew/Best-README-Template/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

## Contributors

<p align="center">
  <a href="https://github.com/Hex-commits">
    <img src="https://avatars.githubusercontent.com/Hex-commits?s=120" width="80" alt="Jan-Philipp Wegmeyer"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/randywf">
    <img src="https://avatars.githubusercontent.com/randywf?s=120" width="80" alt="Randy Flores"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/pmunding">
    <img src="https://avatars.githubusercontent.com/pmunding?s=120" width="80" alt="Philipp Mundinger"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/nimesh7814">
    <img src="https://avatars.githubusercontent.com/nimesh7814?s=120" width="80" alt="Nimesh Akalanka"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/laurenfissel11-ux">
    <img src="https://avatars.githubusercontent.com/laurenfissel11-ux?s=120" width="80" alt="Lauren"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/Aadilwaris">
     <img src="https://avatars.githubusercontent.com/Aadilwaris?s=120" width="80" alt="Adil Waris"/>
  </a>
</p>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

### Built With

![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![HTML](https://img.shields.io/badge/HTML-5-orange)
![Svelte](https://img.shields.io/badge/Svelte-Frontend-orange)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-Utility--First-blueviolet)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-purple)
![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-Data-green)
-

## Description of the application

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

| Category | Amenity |   | Category | Amenity |
|---------|---------|---|----------|---------|
| Food & Drinks | Restaurant |   | Culture & Entertainment | Cinema |
| Food & Drinks | Café |   | Mobility | Bicycle Parking |
| Food & Drinks | Bar |   | Mobility | Parking |
| Food & Drinks | Pub |   | Mobility | Fuel Station |
| Food & Drinks | Fast Food |   | Leisure | BBQ Area |
| Food & Drinks | Ice Cream Shop |   | Leisure | Biergarten |
| Education & Culture | School |   | Public Services | Public Toilets |
| Education & Culture | Library |   | Health | Clinic |
| Health | Pharmacy |   | Culture & Entertainment | Theatre |

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

<div align="center" style="font-size: 0.85em; color: #666; line-height: 1.6;">

© 2026 <strong>15-min-city</strong><br>
<strong>Course:</strong> Geoinformation in Society<br>
<strong>Responsible:</strong> Contact contributors<br>
<strong>Date:</strong> 02.02.2026<br>
<strong>University of Münster</strong>

</div>
