import polyline from "@mapbox/polyline";

const toRad = (d) => (d * Math.PI) / 180;

function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const cache = new Map();

function getRoute(trip) {
  const cached = cache.get(trip.id);
  if (cached) return cached;
  const coords = polyline
    .decode(trip.routePolyline)
    .map(([latitude, longitude]) => ({ latitude, longitude }));
  const cum = [0];
  for (let k = 1; k < coords.length; k++) {
    cum.push(cum[k - 1] + haversineKm(coords[k - 1], coords[k]));
  }
  const route = { coords, cum };
  cache.set(trip.id, route);
  return route;
}

// Closest point on the route: distance to the route and position along it (km)
function projectOnRoute(p, { coords, cum }) {
  let best = { distKm: Infinity, alongKm: 0 };
  for (let k = 0; k < coords.length - 1; k++) {
    const a = coords[k];
    const b = coords[k + 1];
    const cosLat = Math.cos(toRad(a.latitude));
    const bx = (b.longitude - a.longitude) * cosLat * 111.32;
    const by = (b.latitude - a.latitude) * 110.574;
    const px = (p.longitude - a.longitude) * cosLat * 111.32;
    const py = (p.latitude - a.latitude) * 110.574;
    const len2 = bx * bx + by * by;
    let t = len2 === 0 ? 0 : (px * bx + py * by) / len2;
    t = Math.max(0, Math.min(1, t));
    const dx = px - t * bx;
    const dy = py - t * by;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < best.distKm) {
      best = { distKm: d, alongKm: cum[k] + t * (cum[k + 1] - cum[k]) };
    }
  }
  return best;
}

// Returns null if the trip does not fit, otherwise details about the fit.
export function matchTrip(trip, pickup, dropoff, maxKm = 5) {
  const route = getRoute(trip);
  if (route.coords.length < 2) return null;

  const a = projectOnRoute(pickup, route);
  const b = projectOnRoute(dropoff, route);

  if (a.distKm > maxKm || b.distKm > maxKm) return null; // too far from route
  if (b.alongKm - a.alongKm < 1) return null; // wrong direction or too short

  return {
    coords: route.coords,
    pickupOffKm: a.distKm,
    dropoffOffKm: b.distKm,
    rideKm: b.alongKm - a.alongKm,
  };
}
