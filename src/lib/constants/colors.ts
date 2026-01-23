export const CATEGORY_COLORS: Record<string, string> = {
    "Mobility & Parking": "#3b82f6",
    "Healthcare": "#dc2626",
    "Education": "#22c55e",
    "Entertainment": "#a855f7",
    "Food & Beverage": "#f97316",
    "Other": "#6b7280"
};

export const CATEGORY_COLORS_WITH_ALPHA: Record<string, { background: string; border: string; hex: string }> = {
    "Mobility & Parking": { background: "rgba(59, 130, 246, 0.3)", border: "rgb(59, 130, 246)", hex: "#3b82f6" },
    "Healthcare": { background: "rgba(220, 38, 38, 0.3)", border: "rgb(220, 38, 38)", hex: "#dc2626" },
    "Education": { background: "rgba(34, 197, 94, 0.3)", border: "rgb(34, 197, 94)", hex: "#22c55e" },
    "Entertainment": { background: "rgba(168, 85, 247, 0.3)", border: "rgb(168, 85, 247)", hex: "#a855f7" },
    "Food & Beverage": { background: "rgba(249, 115, 22, 0.3)", border: "rgb(249, 115, 22)", hex: "#f97316" },
    "Other": { background: "rgba(107, 114, 128, 0.3)", border: "rgb(107, 114, 128)", hex: "#6b7280" }
};

export const ISOCHRONE_COLORS = {
    fill: "#de6e12",  
    stroke: "#c66702",
};