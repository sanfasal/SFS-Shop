// Hand-off between the login page's "doors open" exit and the dashboard's
// entrance. Module state survives client-side navigation, so the dashboard
// only plays its entrance right after a login, not on refresh or direct visits.

/** How long the login page's split doors take to open or close, in ms. */
export const DOOR_OPEN_MS = 800;

let entrancePending = false;

export function markDashboardEntrance() {
  entrancePending = true;
}

export function isDashboardEntrancePending() {
  return entrancePending;
}

export function clearDashboardEntrance() {
  entrancePending = false;
}

// Logout plays it in reverse: the dashboard sinks into the center, then the
// login page starts with its doors open and slides them shut.
let doorsClosePending = false;

export function markLoginDoorsClose() {
  doorsClosePending = true;
}

export function isLoginDoorsClosePending() {
  return doorsClosePending;
}

export function clearLoginDoorsClose() {
  doorsClosePending = false;
}
