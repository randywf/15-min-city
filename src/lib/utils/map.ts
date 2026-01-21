/**
 * Convert amenity names from snake_case to Sentence Case
 * @param text - The text to convert (e.g., "fast_food")
 * @returns Sentence cased text (e.g., "Fast Food")
 */
export function toSentenceCase(text: string): string {
	return text
		.split('_')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}

/**
 * Select appropriate icon for a POI based on its amenity tags
 * @param poi - The POI object with tags
 * @param icons - Available icon set
 * @returns The appropriate icon for the POI
 */
export function getIconForAmenity(poi: any, icons: { food: any; education: any }): any {
	// Check if educational institute
	if (poi.tags?.amenity === 'school' ||
		poi.tags?.amenity === 'university' ||
		poi.tags?.amenity === 'college' ||
		poi.tags?.amenity === 'kindergarten'
	) {
		return icons.education;
	}

	// Default to food icon
	return icons.food;
}
