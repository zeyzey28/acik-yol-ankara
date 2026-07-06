'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { Coordinates, ClosedRoadsGeoJSON, ExcludeZonesGeoJSON } from '@/utils/types';
import { Layers, Locate, ZoomIn, ZoomOut } from 'lucide-react';

interface MapProps {
  startCoords: Coordinates | null;
  destCoords: Coordinates | null;
  closedRoads: ClosedRoadsGeoJSON | null;
  excludeZones: ExcludeZonesGeoJSON | null;
  route: any | null;
  routeStatus: 'suitable' | 'clear' | 'near' | 'risky' | 'blocked' | 'closed' | 'searching_alt' | 'alt_suggested' | 'alt_suggested_risky' | 'alt_suggested_blocked' | 'alt_not_found' | 'alt_service_failed' | null;
  mapSelectionMode: 'start' | 'dest' | null;
  onMapClick: (coords: Coordinates) => void;
  onDragStartPin: (coords: Coordinates) => void;
  onDragDestPin: (coords: Coordinates) => void;
  geolocationCoords: Coordinates | null;
  focusCoords: Coordinates | null;
}

export default function Map({
  startCoords,
  destCoords,
  closedRoads,
  excludeZones,
  route,
  routeStatus,
  mapSelectionMode,
  onMapClick,
  onDragStartPin,
  onDragDestPin,
  geolocationCoords,
  focusCoords,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  // Markers
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [mapStyle, setMapStyle] = useState<'dark' | 'positron'>('dark');

  const styleUrls = {
    dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrls[mapStyle],
      center: [32.8597, 39.9334], // Ankara Center
      zoom: 11.5,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = mapInstance;
    setMap(mapInstance);

    mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    mapInstance.on('load', () => {
      addGeoJsonLayers(mapInstance);
    });

    return () => {
      mapInstance.remove();
      mapRef.current = null;
      setMap(null);
    };
  }, []);

  // Update map click handler to access latest mapSelectionMode
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (mapSelectionMode) {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      }
    };

    map.off('click', handleClick);
    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, mapSelectionMode, onMapClick]);

  // Handle map style changes
  useEffect(() => {
    if (!map) return;

    map.setStyle(styleUrls[mapStyle]);

    map.once('style.load', () => {
      addGeoJsonLayers(map);
    });
  }, [map, mapStyle]);

  // Helper to add sources and layers safely
  const addGeoJsonLayers = (mapInstance: maplibregl.Map) => {
    if (!mapInstance.isStyleLoaded()) {
      mapInstance.once('style.load', () => addGeoJsonLayers(mapInstance));
      return;
    }

    const style = mapInstance.getStyle();
    const styleLayers = style?.layers ?? [];
    let firstSymbolId: string | undefined = undefined;
    for (const layer of styleLayers) {
      if (layer.type === 'symbol') {
        firstSymbolId = layer.id;
        break;
      }
    }

    // Cursor helpers
    const setPointerCursor = () => { mapInstance.getCanvas().style.cursor = 'pointer'; };
    const resetCursor = () => { mapInstance.getCanvas().style.cursor = ''; };

    // A. Roads Source (contains closed roads and convoy lines)
    if (!mapInstance.getSource('roads')) {
      mapInstance.addSource('roads', {
        type: 'geojson',
        data: closedRoads || { type: 'FeatureCollection', features: [] },
      });
    }

    // B. Exclude Zones Source & Layer
    if (!mapInstance.getSource('exclude-zones')) {
      mapInstance.addSource('exclude-zones', {
        type: 'geojson',
        data: excludeZones || { type: 'FeatureCollection', features: [] },
      });
    }

    // C. Route Source & Layer
    if (!mapInstance.getSource('route')) {
      mapInstance.addSource('route', {
        type: 'geojson',
        data: route || { type: 'FeatureCollection', features: [] },
      });
    }

    // Add layers in specific order (bottom to top):
    // 1a. route-line-casing (glow/shadow underneath the route)
    if (!mapInstance.getLayer('route-line-casing')) {
      mapInstance.addLayer({
        id: 'route-line-casing',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#1e3a8a',
          'line-width': 9,
          'line-opacity': 0.35,
          'line-blur': 2,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);
    }

    // 1b. route-line (main blue route)
    if (!mapInstance.getLayer('route-line')) {
      const routeColor = '#3b82f6'; // clear blue

      mapInstance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': routeColor,
          'line-width': 5,
          'line-opacity': 0.92,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);
    }

    // 2. exclude-zones-outline (VIP / security boundary)
    if (!mapInstance.getLayer('exclude-zones-outline')) {
      mapInstance.addLayer({
        id: 'exclude-zones-outline',
        type: 'line',
        source: 'exclude-zones',
        paint: {
          'line-color': '#d97706', // amber
          'line-width': 2,
          'line-dasharray': [4, 3],
          'line-opacity': 0.75,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);

      mapInstance.on('click', 'exclude-zones-outline', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        const name = props.name || 'Protokol Alanı';
        const desc = props.desc || props.description || 'VIP Geçiş Güzergâhı.';

        new maplibregl.Popup({ className: 'custom-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-1.5 text-slate-100">
              <h4 class="font-bold text-xs border-b border-slate-800 pb-1 mb-1 text-amber-400">${name}</h4>
              <p class="text-[11px] text-slate-350 leading-relaxed">${desc}</p>
            </div>
          `)
          .addTo(mapInstance);
      });

      mapInstance.on('mouseenter', 'exclude-zones-outline', setPointerCursor);
      mapInstance.on('mouseleave', 'exclude-zones-outline', resetCursor);
    }

    // 3. convoy-line (from roads source, orange/amber dash for convoy routes)
    if (!mapInstance.getLayer('convoy-line')) {
      mapInstance.addLayer({
        id: 'convoy-line',
        type: 'line',
        source: 'roads',
        filter: ['==', ['get', 'category'], 'convoy'],
        paint: {
          'line-color': '#f97316', // orange/amber
          'line-width': 3,
          'line-dasharray': [5, 4],
          'line-opacity': 0.85,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);

      mapInstance.on('click', 'convoy-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        const name = props.name || 'Protokol Yolu';
        const desc = props.desc || props.description || 'Protokol/Konvoy Geçiş Güzergâhı.';

        new maplibregl.Popup({ className: 'custom-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-1.5 text-slate-100">
              <h4 class="font-bold text-xs border-b border-slate-800 pb-1 mb-1 text-orange-400">${name}</h4>
              <p class="text-[11px] text-slate-350 leading-relaxed">${desc}</p>
            </div>
          `)
          .addTo(mapInstance);
      });

      mapInstance.on('mouseenter', 'convoy-line', setPointerCursor);
      mapInstance.on('mouseleave', 'convoy-line', resetCursor);
    }

    // 4a. closed-line-casing (dark outer border for closed roads for definition)
    if (!mapInstance.getLayer('closed-line-casing')) {
      mapInstance.addLayer({
        id: 'closed-line-casing',
        type: 'line',
        source: 'roads',
        filter: ['==', ['get', 'category'], 'closed'],
        paint: {
          'line-color': '#7f1d1d',
          'line-width': 6.5,
          'line-opacity': 0.5,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);
    }

    // 4b. closed-line (from roads source, solid red for closed roads)
    if (!mapInstance.getLayer('closed-line')) {
      mapInstance.addLayer({
        id: 'closed-line',
        type: 'line',
        source: 'roads',
        filter: ['==', ['get', 'category'], 'closed'],
        paint: {
          'line-color': '#ef4444', // red
          'line-width': 3.5,
          'line-opacity': 0.95,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      }, firstSymbolId);

      mapInstance.on('click', 'closed-line', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        const name = props.name || 'Kapalı Yol Kesimi';
        const desc = props.desc || props.description || 'Yol trafiğe kapalıdır.';

        new maplibregl.Popup({ className: 'custom-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-1.5 text-slate-100">
              <h4 class="font-bold text-xs border-b border-slate-800 pb-1 mb-1 text-red-400">${name}</h4>
              <p class="text-[11px] text-slate-350 leading-relaxed">${desc}</p>
            </div>
          `)
          .addTo(mapInstance);
      });

      mapInstance.on('mouseenter', 'closed-line', setPointerCursor);
      mapInstance.on('mouseleave', 'closed-line', resetCursor);
    }
  };

  // Sync data sources when props change
  useEffect(() => {
    if (!map) return;

    const roadSource = map.getSource('roads') as maplibregl.GeoJSONSource;
    if (roadSource && closedRoads) {
      roadSource.setData(closedRoads);
    }
  }, [map, closedRoads]);

  useEffect(() => {
    if (!map) return;

    const zoneSource = map.getSource('exclude-zones') as maplibregl.GeoJSONSource;
    if (zoneSource && excludeZones) {
      zoneSource.setData(excludeZones);
    }
  }, [map, excludeZones]);

  // Sync route source and zoom to fit bounds
  useEffect(() => {
    if (!map) return;

    const routeSource = map.getSource('route') as maplibregl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData(route || { type: 'FeatureCollection', features: [] });
    } else {
      addGeoJsonLayers(map);
    }

    if (route && route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 0) {
      try {
        const bbox = turf.bbox(route);
        map.fitBounds([bbox[0], bbox[1], bbox[2], bbox[3]], {
          padding: 60,
          maxZoom: 15,
          essential: true,
        });
      } catch (err) {
        console.error('Fit bounds error:', err);
      }
    }
  }, [map, route]);

  // Update route line color dynamically when status changes
  useEffect(() => {
    if (!map) return;

    if (map.getLayer('route-line')) {
      const routeColor = '#2563eb'; // Her durumda mavi çizilsin

      map.setPaintProperty('route-line', 'line-color', routeColor);
    }
  }, [map, routeStatus]);

  // Sync Start Pin (Sky Blue to reduce green)
  useEffect(() => {
    if (!map) return;

    const isAtUserLocation = startCoords && geolocationCoords &&
      Math.abs(startCoords[0] - geolocationCoords[0]) < 0.00001 &&
      Math.abs(startCoords[1] - geolocationCoords[1]) < 0.00001;

    if (!startCoords || isAtUserLocation) {
      if (startMarkerRef.current) {
        startMarkerRef.current.remove();
        startMarkerRef.current = null;
      }
      return;
    }

    if (startMarkerRef.current) {
      startMarkerRef.current.setLngLat(startCoords);
    } else {
      const el = document.createElement('div');
      el.className = 'w-5 h-5 bg-sky-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg cursor-pointer transform -translate-y-1/2 transition';
      el.innerHTML = `<span class="w-1.5 h-1.5 bg-white rounded-full"></span>`;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat(startCoords)
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onDragStartPin([lngLat.lng, lngLat.lat]);
      });

      startMarkerRef.current = marker;
    }
  }, [map, startCoords, geolocationCoords, onDragStartPin]);

  // Sync Destination Pin (Red)
  useEffect(() => {
    if (!map) return;

    if (!destCoords) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      return;
    }

    if (destMarkerRef.current) {
      destMarkerRef.current.setLngLat(destCoords);
    } else {
      const el = document.createElement('div');
      el.className = 'w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg cursor-pointer transform -translate-y-1/2 transition';
      el.innerHTML = `<span class="w-1.5 h-1.5 bg-white rounded-full"></span>`;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat(destCoords)
        .addTo(map);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onDragDestPin([lngLat.lng, lngLat.lat]);
      });

      destMarkerRef.current = marker;
    }
  }, [map, destCoords, onDragDestPin]);

  // Sync User Location Marker (Blue Dot)
  useEffect(() => {
    if (!map) return;

    if (!geolocationCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(geolocationCoords);
    } else {
      const el = document.createElement('div');
      el.className = 'relative flex h-5 w-5 items-center justify-center';
      el.innerHTML = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow-md"></span>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        draggable: false,
      })
        .setLngLat(geolocationCoords)
        .addTo(map);

      userMarkerRef.current = marker;
    }
  }, [map, geolocationCoords]);

  // Center/Pan Map on Focus Target
  useEffect(() => {
    if (!map || !focusCoords) return;

    map.flyTo({
      center: focusCoords,
      zoom: 14.5,
      essential: true,
      speed: 1.2,
    });
  }, [map, focusCoords]);

  const handleRecenter = () => {
    if (!map) return;
    
    const center = geolocationCoords || [32.8597, 39.9334];
    map.flyTo({
      center: center,
      zoom: 12.5,
      essential: true,
    });
  };

  const handleZoomIn = () => {
    map?.zoomIn();
  };

  const handleZoomOut = () => {
    map?.zoomOut();
  };

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950">
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        {/* Style Toggle */}
        <button
          onClick={() => setMapStyle((prev) => (prev === 'dark' ? 'positron' : 'dark'))}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl shadow-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Harita Teması Değiştir"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl shadow-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Yakınlaştır"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl shadow-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Uzaklaştır"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* My Location / Recenter */}
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl shadow-xl hover:bg-slate-800 hover:text-white transition cursor-pointer"
          title="Mevcut Konuma Odaklan"
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* Selection Active Banner */}
      {mapSelectionMode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 bg-slate-900 border border-slate-850 px-4 py-2.5 rounded-xl shadow-2xl flex items-center justify-between gap-5 text-white z-10 max-w-sm w-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">
              Haritadan {mapSelectionMode === 'start' ? 'Başlangıç' : 'Varış'} seçin
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Tıklayın</span>
        </div>
      )}
    </div>
  );
}
