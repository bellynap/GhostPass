/**
 * Haversine formula: straight-line distance between two GPS coordinates.
 * Returns distance in meters.
 *
 * NOTE: GPS is a mobile-native proximity gate for the MVP.
 * It is not fraud-proof anti-spoofing — spoofing resistance is a production roadmap item.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  const feet = meters * 3.28084;
  if (feet < 528) return `${Math.round(feet)} ft`;
  return `${(meters / 1609.344).toFixed(1)} mi`;
}
