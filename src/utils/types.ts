export interface LatLng {
  lat: number;
  lng: number;
}

export type Coordinates = [number, number]; // [longitude, latitude]

export interface ClosedRoadProperties {
  id?: string | number;
  name?: string;
  desc?: string;
  description?: string;
  title?: string;
  type?: string;
  [key: string]: any;
}

export interface ClosedRoadFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'Point';
    coordinates: any;
  };
  properties: ClosedRoadProperties;
}

export interface ClosedRoadsGeoJSON {
  type: 'FeatureCollection';
  features: ClosedRoadFeature[];
}

export interface ExcludeZoneProperties {
  id?: string | number;
  name?: string;
  type?: string;
  [key: string]: any;
}

export interface ExcludeZoneFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString';
    coordinates: any;
  };
  properties: ExcludeZoneProperties;
}

export interface ExcludeZonesGeoJSON {
  type: 'FeatureCollection';
  features: ExcludeZoneFeature[];
}

export interface ApiState {
  rev: string | number;
  zrev: string | number;
}

export interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
  permissionStatus: PermissionState | null;
}

export interface RoadClosureWarning {
  id: string;
  name: string;
  description: string;
  distanceKm: number; // calculated using turf
  type: 'closed' | 'exclude'; // closed road or convoy route
  coordinates: Coordinates; // anchor point for navigation
  properties?: any;
}
