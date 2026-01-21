import walk from "$lib/assets/walk.svg?raw";
import bicycle from "$lib/assets/bicycle.svg?raw";
import car from "$lib/assets/car.svg?raw";
import bus from "$lib/assets/bus.svg?raw";

export const MARKER_STYLES = {
	radius: 8,
	color: "red",
	weight: 2,
	fillColor: "red",
	fillOpacity: 0.9,
};

export const ICON_CONFIG = {
	iconSize: [38, 57] as [number, number],
	iconAnchor: [22, 94] as [number, number],
	popupAnchor: [-3, -76] as [number, number],
};

export const TRANSPORT_MODES = [
	{ name: "walk", value: "walk", icon: walk },
	{ name: "bike", value: "bike", icon: bicycle },
	{ name: "car", value: "car", icon: car },
	{ name: "Public Transport", value: "public", icon: bus },
];
