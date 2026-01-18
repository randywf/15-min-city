// src/lib/config/amenities.ts

export const AMENITIES = [
  "bar",
  "bbq",
  "bicycle_parking",
  "biergarten",
  "cafe",
  "cinema",
  "clinic",
  "fast_food",
  "fuel",
  "ice_cream",
  "library",
  "parking",
  "pharmacy",
  "pub",
  "restaurant",
  "school",
  "theatre",
  "toilets",
] as const;

export type Amenity = typeof AMENITIES[number];

// Leaflet.heat gradients per amenity
export const AMENITY_GRADIENTS: Record<Amenity, any> = {
  bar: { 
    0.2: "#0011ff", 
    0.6: "#00b7ff", 
    1.0: "#ffffff" 
  },

  bbq: { 
    0.2: "#8b0000", 
    0.6: "#ff4500", 
    1.0: "#ffff00" 
  },

  bicycle_parking: { 
    0.2: "#006400", 
    0.6: "#00ff00", 
    1.0: "#ccff00" 
  },

  biergarten: { 
    0.2: "#556b2f", 
    0.6: "#7fff00", 
    1.0: "#eaff00" 
  },

  cafe: { 
    0.2: "#4b2e1e", 
    0.6: "#ff8c00", 
    1.0: "#fffacd" 
  },

  cinema: { 
    0.2: "#4b0082", 
    0.6: "#ff00ff", 
    1.0: "#ffffff" 
  },

  clinic: { 
    0.2: "#800000", 
    0.6: "#ff0000", 
    1.0: "#ffffff" 
  },

  fast_food: { 
    0.2: "#ff0000", 
    0.6: "#ff7f00", 
    1.0: "#ffff00" 
  },

  fuel: { 
    0.2: "#000000", 
    0.6: "#555555", 
    1.0: "#ffffff" 
  },

  ice_cream: { 
    0.2: "#ff1493", 
    0.6: "#ff69b4", 
    1.0: "#ffffff" 
  },

  library: { 
    0.2: "#000080", 
    0.6: "#1e90ff", 
    1.0: "#ffffff" 
  },

  parking: { 
    0.2: "#2f4f4f", 
    0.6: "#708090", 
    1.0: "#ffffff" 
  },

  pharmacy: { 
    0.2: "#006400", 
    0.6: "#00ff7f", 
    1.0: "#ffffff" 
  },

  pub: { 
    0.2: "#8b4513", 
    0.6: "#ffd700", 
    1.0: "#ffffff" 
  },

  restaurant: { 
    0.2: "#8b0000", 
    0.6: "#ff4500", 
    1.0: "#ffff66" 
  },

  school: { 
    0.2: "#004d00", 
    0.6: "#00ff00", 
    1.0: "#ffffff" 
  },

  theatre: { 
    0.2: "#2e0854", 
    0.6: "#9400d3", 
    1.0: "#ffffff" 
  },

  toilets: { 
    0.2: "#006666", 
    0.6: "#00ffff", 
    1.0: "#ffffff" 
  },
};

