export const CATEGORY_COLORS: Record<string, string> = {
    "Mobility & Parking": "#fc0f0f",
    "Healthcare": "#0e9f18",
    "Education": "#0859c4",
    "Entertainment": "#fa9a0a",
    "Food & Beverage": "#b90bb0",
    "Other": "#f7e098"
};

export const CATEGORY_COLORS_WITH_ALPHA: Record<string, { background: string; border: string; hex: string }> = {
    "Mobility & Parking": { background: "#fc0f0f", border: "#b10808", hex: "#fc0f0f" },
    "Healthcare": { background: "#0e9f18", border: "#036b0a", hex: "#0e9f18" },
    "Education": { background: "#0859c4", border: "#084088", hex: "#0859c4" },
    "Entertainment": { background: "#fa9a0a", border: "#ad6a05", hex: "#fa9a0a" },
    "Food & Beverage": { background: "#b90bb0", border: "#73086e", hex: "#b90bb0" },
    "Other": { background: "#f7e098", border: "#b9a25b", hex: "#f7e098"}
};

export const ISOCHRONE_COLORS = {
    fill: "#ffffff",  
    stroke: "#d7d7d7",
};