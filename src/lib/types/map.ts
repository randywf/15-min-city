import type { HeatmapPoi } from "$lib/services/heatmap-service";

export type TransportMode = "walk" | "bike" | "car";

export interface Location {
	selected: boolean;
	lat: number | null;
	lng: number | null;
}

export interface HeatmapState {
	L: any;
	map: any;
	pois: HeatmapPoi[];
	loading: boolean;
	error: string | null;
}

export interface UIState {
	sidebarOpen: boolean;
	selectingLocation: boolean;
	isInitialLoading: boolean;
	isIsochroneLoading: boolean;
}

export interface MapState {
	L: any;
	instance: any;
	userMarker: any;
}

export interface POIState {
	markers: any[];
	area: any;
	count: number;
	abortController: AbortController | null;
}
