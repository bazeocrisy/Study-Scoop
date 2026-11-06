// A tiny hand-off between a page that holds unsaved work (the Reading Coach) and the router in app.js.
// The page registers a function that returns a warning when leaving would discard work, or null when it is safe to leave.
// Nothing is stored: this lives in memory for the current page visit only.

let guard = null;

/** Register (or clear, with null) the function that says whether leaving now would lose work. */
export function setLeaveGuard(fn) { guard = typeof fn === 'function' ? fn : null; }

/** The warning to show before leaving, or null when nothing would be lost. */
export function leaveWarning() { return guard ? guard() : null; }
