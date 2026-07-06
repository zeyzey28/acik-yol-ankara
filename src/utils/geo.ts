import * as turf from '@turf/turf';
import { Coordinates, ClosedRoadFeature, ExcludeZoneFeature, RoadClosureWarning } from './types';

/**
 * Calculates the distance between two coordinates in kilometers.
 */
export function getDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const from = turf.point(coord1);
  const to = turf.point(coord2);
  return turf.distance(from, to, { units: 'kilometers' });
}

/**
 * Gets a representative point (coordinate) for any GeoJSON Feature geometry
 */
export function getFeatureAnchor(feature: ClosedRoadFeature | ExcludeZoneFeature): Coordinates {
  const geom = feature.geometry;
  if (geom.type === 'Point') {
    return geom.coordinates as Coordinates;
  }
  
  try {
    // Use turf.centroid to find the center of the line string or polygon
    const center = turf.centroid(feature as any);
    return center.geometry.coordinates as Coordinates;
  } catch (error) {
    // Fallback if centroid calculation fails
    if (geom.type === 'LineString' && geom.coordinates.length > 0) {
      return geom.coordinates[0] as Coordinates;
    }
    if (geom.type === 'Polygon' && geom.coordinates[0] && geom.coordinates[0].length > 0) {
      return geom.coordinates[0][0] as Coordinates;
    }
    // General fallback Ankara center
    return [32.8597, 39.9334];
  }
}

/**
 * Analyzes closed roads and convoy routes to find warnings within a radius
 */
export function getNearbyWarnings(
  startCoords: Coordinates,
  closedRoads: ClosedRoadFeature[],
  excludeZones: ExcludeZoneFeature[],
  maxRadiusKm: number = 10
): RoadClosureWarning[] {
  const warnings: RoadClosureWarning[] = [];

  // 1. Process closed roads
  closedRoads.forEach((road) => {
    const anchor = getFeatureAnchor(road);
    const distance = getDistanceKm(startCoords, anchor);

    warnings.push({
      id: road.properties.id?.toString() || `road-${Math.random()}`,
      name: road.properties.name || 'İsimsiz Yol Kapatması',
      description: road.properties.desc || road.properties.description || 'Açıklama belirtilmemiş.',
      distanceKm: parseFloat(distance.toFixed(2)),
      type: 'closed',
      coordinates: anchor,
      properties: road.properties
    });
  });

  // 2. Process exclude zones (convoy routes / security areas)
  excludeZones.forEach((zone) => {
    const anchor = getFeatureAnchor(zone);
    const distance = getDistanceKm(startCoords, anchor);

    warnings.push({
      id: zone.properties.id?.toString() || `zone-${Math.random()}`,
      name: zone.properties.name || 'Protokol / Güvenlik Alanı',
      description: zone.properties.desc || zone.properties.description || 'VIP Geçiş Güzergahı.',
      distanceKm: parseFloat(distance.toFixed(2)),
      type: 'exclude',
      coordinates: anchor,
      properties: zone.properties
    });
  });

  // Sort by distance (closest first)
  return warnings.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Fetches route geometry and duration/distance statistics between two points using OSRM/Valhalla (via local proxy)
 * Returns a status object instead of throwing runtime exceptions.
 */
export async function fetchOSRMRoute(
  start: Coordinates,
  end: Coordinates
): Promise<{ ok: true; routes: any[] } | { ok: false; error: string }> {
  try {
    const url = `/api/route?startLon=${start[0]}&startLat=${start[1]}&endLon=${end[0]}&endLat=${end[1]}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, error: 'Ağ bağlantı hatası oluştu.' };
    }
    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: data.error || 'Rota servisi hata döndürdü.' };
    }
    if (!data.routes || data.routes.length === 0) {
      return { ok: false, error: 'Uygun rota bulunamadı.' };
    }
    return { ok: true, routes: data.routes };
  } catch (err: any) {
    console.error('fetchOSRMRoute unexpected error:', err);
    return { ok: false, error: 'Beklenmeyen bir hata oluştu.' };
  }
}

export interface RouteAnalysisResult {
  status: 'clear' | 'near' | 'risky' | 'blocked';
  message: string;
  affectedRoadName?: string;
  riskScore: number;
}

// Distance from point P to line segment AB in kilometers
function distToSegment(p: [number, number], a: [number, number], b: [number, number]): number {
  const x = p[0], y = p[1];
  const x1 = a[0], y1 = a[1];
  const x2 = b[0], y2 = b[1];
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
      
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  // Earth radius in km
  const R = 6371;
  const dLat = (yy - y) * Math.PI / 180;
  const dLon = (xx - x) * Math.PI / 180 * Math.cos((y + yy) / 2 * Math.PI / 180);
  return R * Math.sqrt(dLat * dLat + dLon * dLon);
}

// Distance from point P to LineString coordinates array in kilometers
function distToLineString(p: [number, number], coords: [number, number][]): number {
  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = distToSegment(p, coords[i], coords[i + 1]);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

// Extract line paths from a feature's geometry
function getSegmentsFromFeature(feature: any): [number, number][][] {
  const geom = feature.geometry;
  if (!geom) return [];
  if (geom.type === 'LineString') {
    return [geom.coordinates];
  } else if (geom.type === 'MultiLineString') {
    return geom.coordinates;
  } else if (geom.type === 'Polygon') {
    return geom.coordinates;
  } else if (geom.type === 'MultiPolygon') {
    const paths: [number, number][][] = [];
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        paths.push(ring);
      }
    }
    return paths;
  }
  return [];
}

// Distance from point P to any GeoJSON Feature geometry in kilometers
function distToFeature(p: [number, number], feature: any): number {
  const paths = getSegmentsFromFeature(feature);
  let minDist = Infinity;
  for (const path of paths) {
    if (path.length < 2) continue;
    const dist = distToLineString(p, path as any);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

/**
 * Checks if the computed route intersects with closed roads or exclusion zones/convoy routes.
 * Differentiates between 'clear', 'near', 'risky', and 'blocked' paths using smart segment proximity and returns a risk score.
 */
export function analyzeRouteIntersections(
  routeFeature: any,
  closedRoadFeatures: any[],
  excludeZoneFeatures: any[]
): RouteAnalysisResult {
  const routeCoords: [number, number][] = routeFeature.geometry.coordinates;
  if (!routeCoords || routeCoords.length === 0) {
    return { status: 'clear', message: 'Rota uygun görünüyor.', riskScore: 0 };
  }

  // 1. Generate sample points along the route every ~20 meters
  const samplePoints: [number, number][] = [routeCoords[0]];
  let lastSamplePt = routeCoords[0];
  for (let i = 1; i < routeCoords.length; i++) {
    const pt = routeCoords[i];
    const dist = getDistanceKm(lastSamplePt, pt);
    if (dist >= 0.02) { // 20 meters
      samplePoints.push(pt);
      lastSamplePt = pt;
    }
  }
  // Include final coordinate
  if (getDistanceKm(lastSamplePt, routeCoords[routeCoords.length - 1]) > 0.005) {
    samplePoints.push(routeCoords[routeCoords.length - 1]);
  }

  let hasNear = false;
  let nearRoadName = '';
  let isBlocked = false;
  let blockedRoadName = '';
  
  let totalNearbyPoints = 0;
  let intersectedRoadsCount = 0;

  // 2. Check proximity against all closed roads
  for (const road of closedRoadFeatures) {
    try {
      const closeIndices: number[] = [];
      for (let idx = 0; idx < samplePoints.length; idx++) {
        const dist = distToFeature(samplePoints[idx], road);
        if (dist <= 0.03) { // 30 meters
          closeIndices.push(idx);
        }
      }

      if (closeIndices.length > 0) {
        const roadName = road.properties.name || road.properties.desc || road.properties.description || 'Kapalı Yol Kesimi';
        hasNear = true;
        if (!nearRoadName) nearRoadName = roadName;

        totalNearbyPoints += closeIndices.length;
        intersectedRoadsCount++;

        // Check if close indices form a contiguous segment of at least 80 meters
        let startIdx = 0;
        for (let j = 0; j < closeIndices.length; j++) {
          if (j > 0 && closeIndices[j] - closeIndices[j - 1] > 2) {
            startIdx = j; // gap in contiguity
          }

          let segmentLength = 0;
          for (let k = closeIndices[startIdx]; k < closeIndices[j]; k++) {
            segmentLength += getDistanceKm(samplePoints[k], samplePoints[k + 1]);
          }

          if (segmentLength >= 0.08) { // 80 meters
            isBlocked = true;
            if (!blockedRoadName) blockedRoadName = roadName;
          }
        }
      }
    } catch (e) {
      console.error('Proximity check failed for closed road:', e);
    }
  }

  const riskScore = intersectedRoadsCount + totalNearbyPoints;

  // 3. Check exclude zones/convoy paths (amber/risky status)
  let isRisky = false;
  let riskyZoneName = '';
  for (const zone of excludeZoneFeatures) {
    try {
      const intersections = turf.lineIntersect(routeFeature, zone);
      if (intersections.features.length > 0) {
        isRisky = true;
        const zoneName = zone.properties.name || zone.properties.desc || zone.properties.description || 'Protokol Güzergâhı';
        if (!riskyZoneName) riskyZoneName = zoneName;
      }
    } catch (e) {
      console.error('Turf intersection check failed for exclude zone:', e);
    }
  }

  // 4. Determine final status
  if (isBlocked) {
    return {
      status: 'blocked',
      message: 'Rota kapalı yol kesimiyle çakışıyor.',
      affectedRoadName: blockedRoadName,
      riskScore
    };
  }

  if (hasNear) {
    return {
      status: 'near',
      message: 'Rota kapalı yol kesimlerine yakın geçiyor. Dikkatli olun.',
      affectedRoadName: nearRoadName,
      riskScore
    };
  }

  if (isRisky) {
    return {
      status: 'risky',
      message: 'Bu rota protokol güzergâhına denk geliyor. Gecikme olabilir.',
      affectedRoadName: riskyZoneName,
      riskScore
    };
  }

  return {
    status: 'clear',
    message: 'Rota uygun görünüyor.',
    riskScore: 0
  };
}
