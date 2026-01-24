// The purpose of this file is to define UI-related constants.
// This includes settings for themes, layout configurations, and other UI elements.
// It stores the status of ui components. e.g., when opening the sidebar, the maps panel should be closed.


import { writable } from "svelte/store";

export const infoOpen = writable(false);