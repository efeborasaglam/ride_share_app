const KEY = process.env.EXPO_PUBLIC_GOOGLE_KEY;

export async function fetchRoute(origin, destination) {
  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask":
          "routes.polyline.encodedPolyline,routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        travelMode: "DRIVE",
        polylineQuality: "OVERVIEW",
      }),
    },
  );
  const json = await res.json();
  const route = json.routes?.[0];
  if (!res.ok || !route) {
    throw new Error(json.error?.message ?? "No route found");
  }
  return {
    encoded: route.polyline.encodedPolyline,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: parseInt(route.duration, 10) || 0,
  };
}
