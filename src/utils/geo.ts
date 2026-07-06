/**
 * Geo helpers: Google Maps URL coordinate extraction (P5) and distance (P4).
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

const inLatRange = (lat: number) => lat >= -90 && lat <= 90;
const inLngRange = (lng: number) => lng >= -180 && lng <= 180;

/**
 * Best-effort extraction of coordinates from a Google Maps URL.
 *
 * Handles the common shapes:
 *   - .../@-7.2575,112.7521,17z
 *   - ...?q=-7.2575,112.7521
 *   - ...?query=-7.2575,112.7521          (Maps API "search" links)
 *   - ...!3d-7.2575!4d112.7521            (place links)
 *   - ...&ll=-7.2575,112.7521
 *
 * Returns null when no valid coordinate pair is found. Short links
 * (maps.app.goo.gl/...) are not resolved (would require a network hop).
 */
export const parseGoogleMapsUrl = (url?: string | null): LatLng | null => {
  if (!url || typeof url !== 'string') return null;

  // Ordered by precision: an explicit query/ll param and the !3d!4d place
  // marker point at the actual location, whereas @lat,lng is only the map
  // viewport centre — so it is the last-resort fallback.
  const patterns: RegExp[] = [
    /[?&](?:q|query|ll|center|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i, // q=lat,lng
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // !3dlat!4dlng
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // @lat,lng (viewport)
  ];

  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const latitude = parseFloat(m[1]);
      const longitude = parseFloat(m[2]);
      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        inLatRange(latitude) &&
        inLngRange(longitude)
      ) {
        return { latitude, longitude };
      }
    }
  }

  return null;
};

/**
 * Haversine distance in metres between two coordinates.
 */
export const distanceMeters = (a: LatLng, b: LatLng): number => {
  const R = 6371000; // earth radius, metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};
