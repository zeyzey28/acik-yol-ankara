'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useGeolocation } from '@/hooks/useGeolocation';
import Header from '@/components/Header';
import SearchPanel, { RouteSummaryCard } from '@/components/SearchPanel';
import InfoPanel from '@/components/InfoPanel';
import { Coordinates, ApiState, ClosedRoadsGeoJSON, ExcludeZonesGeoJSON, RoadClosureWarning } from '@/utils/types';
import { getNearbyWarnings } from '@/utils/geo';
import { AlertCircle, Loader2 } from 'lucide-react';

// Dynamically import Map component (since it accesses window/navigator)
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex-grow flex flex-col items-center justify-center bg-slate-950 text-white min-h-[400px]">
      <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-400">Harita yükleniyor...</p>
    </div>
  ),
});

export default function Home() {
  const { coordinates: geoCoords, loading: geoLoading, error: geoError, retry: retryGeo } = useGeolocation();

  // App States
  const [apiState, setApiState] = useState<ApiState | null>(null);
  const [closedRoads, setClosedRoads] = useState<ClosedRoadsGeoJSON | null>(null);
  const [excludeZones, setExcludeZones] = useState<ExcludeZonesGeoJSON | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // User Route Selection States
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [startAddress, setStartAddress] = useState<string>('');
  const [destAddress, setDestAddress] = useState<string>('');

  const [mapSelectionMode, setMapSelectionMode] = useState<'start' | 'dest' | null>(null);
  const [focusCoords, setFocusCoords] = useState<Coordinates | null>(null);

  // Routing States
  const [route, setRoute] = useState<any | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [routeStatus, setRouteStatus] = useState<'suitable' | 'clear' | 'near' | 'risky' | 'blocked' | 'closed' | 'searching_alt' | 'alt_suggested' | 'alt_suggested_risky' | 'alt_suggested_blocked' | 'alt_not_found' | 'alt_service_failed' | null>(null);
  const [affectedRoad, setAffectedRoad] = useState<string | null>(null);

  // Clear route when coordinates are changed
  useEffect(() => {
    setRoute(null);
    setRouteStats(null);
    setRouteError(null);
    setRouteStatus(null);
    setAffectedRoad(null);
  }, [startCoords, destCoords]);

  // Reverse geocode coords helper using Nominatim
  const reverseGeocode = async (coords: Coordinates): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lon=${coords[0]}&lat=${coords[1]}&format=json`,
        {
          headers: {
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const main = data.display_name.split(',')[0];
        const local = address.suburb || address.town || address.district || '';
        return main + (local ? `, ${local}` : '');
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
    }
    return `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;
  };

  // Fetch government map state and closed roads / convoy routes
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      // 1. Fetch State
      const stateRes = await fetch('/api/state');
      if (!stateRes.ok) throw new Error('State verisi alınamadı.');
      const stateData: ApiState = await stateRes.json();
      setApiState(stateData);

      // 2. Fetch Closed Roads & Exclude Zones in parallel
      const [roadsRes, zonesRes] = await Promise.all([
        fetch(`/api/closed-roads?v=${stateData.rev}`),
        fetch(`/api/exclude-zones?v=${stateData.zrev}`),
      ]);

      if (!roadsRes.ok) throw new Error('Kapalı yollar verisi alınamadı.');
      if (!zonesRes.ok) throw new Error('Protokol güzergahları verisi alınamadı.');

      const roadsData: ClosedRoadsGeoJSON = await roadsRes.json();
      const zonesData: ExcludeZonesGeoJSON = await zonesRes.json();

      setClosedRoads(roadsData);
      setExcludeZones(zonesData);
    } catch (err: any) {
      console.error(err);
      setDataError(err.message || 'Harita verileri yüklenirken bir hata oluştu.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set start coordinates automatically when browser geolocation resolves for the first time
  useEffect(() => {
    if (geoCoords && !startCoords) {
      setStartCoords(geoCoords);
      setStartAddress('Mevcut Konum');
    }
  }, [geoCoords, startCoords]);

  // Handle map interaction
  const handleMapClick = useCallback(
    async (coords: Coordinates) => {
      if (!mapSelectionMode) return;

      if (mapSelectionMode === 'start') {
        setStartCoords(coords);
        setStartAddress('Haritadan Seçilen Nokta...');
        const address = await reverseGeocode(coords);
        setStartAddress(address);
      } else if (mapSelectionMode === 'dest') {
        setDestCoords(coords);
        setDestAddress('Haritadan Seçilen Nokta...');
        const address = await reverseGeocode(coords);
        setDestAddress(address);
      }

      setMapSelectionMode(null);
    },
    [mapSelectionMode]
  );

  const handleDragStartPin = useCallback(async (coords: Coordinates) => {
    setStartCoords(coords);
    setStartAddress('Güncelleniyor...');
    const address = await reverseGeocode(coords);
    setStartAddress(address);
  }, []);

  const handleDragDestPin = useCallback(async (coords: Coordinates) => {
    setDestCoords(coords);
    setDestAddress('Güncelleniyor...');
    const address = await reverseGeocode(coords);
    setDestAddress(address);
  }, []);

  const handleFindRoute = useCallback(async () => {
    if (!startCoords || !destCoords) return;

    setRouteLoading(true);
    setRouteError(null);
    setRoute(null);
    setRouteStats(null);
    setRouteStatus(null);
    setAffectedRoad(null);

    try {
      const { fetchOSRMRoute, analyzeRouteIntersections } = await import('@/utils/geo');
      
      // 1. Calculate OSRM routes with alternatives
      const normalResult = await fetchOSRMRoute(startCoords, destCoords);
      if (!normalResult.ok) {
        setRouteError('Rota hesaplanamadı. Lütfen başlangıç ve varış noktalarını kontrol et.');
        setRouteLoading(false);
        return;
      }

      const routesList = normalResult.routes;
      const roads = closedRoads?.features || [];
      const zones = excludeZones?.features || [];

      // 2. Perform three-level analysis and log metrics for all candidates
      console.log('--- OSRM Routes Analysis ---');
      const analyzedRoutes = routesList.map((r, idx) => {
        const feat = {
          type: 'Feature',
          geometry: r.geometry,
          properties: {},
        };
        const anal = analyzeRouteIntersections(feat, roads, zones);
        console.log(`Route Index ${idx}:`, {
          distanceKm: (r.distance / 1000).toFixed(1),
          durationMin: Math.round(r.duration / 60),
          status: anal.status,
          riskScore: anal.riskScore,
          affectedRoad: anal.affectedRoadName || 'None',
        });
        return { route: r, feature: feat, analysis: anal };
      });
      console.log('----------------------------');

      // 3. Selection Priority Logic
      let chosenCandidate = null;
      let selectionStatus: 'clear' | 'near' | 'risky' | 'alt_suggested_blocked' = 'clear';

      // Priority 1: Clear routes. Check if any route (including index 0) has status 'clear'.
      for (const candidate of analyzedRoutes) {
        if (candidate.analysis.status === 'clear') {
          chosenCandidate = candidate;
          selectionStatus = 'clear';
          break;
        }
      }

      // Priority 2: Near / Risky routes. If no clear route, check if any route has status 'near' or 'risky'.
      if (!chosenCandidate) {
        for (const candidate of analyzedRoutes) {
          if (candidate.analysis.status === 'near') {
            chosenCandidate = candidate;
            selectionStatus = 'near';
            break;
          } else if (candidate.analysis.status === 'risky') {
            chosenCandidate = candidate;
            selectionStatus = 'risky';
            break;
          }
        }
      }

      // Priority 3: Blocked routes. If all routes are blocked, choose the one with the lowest riskScore!
      if (!chosenCandidate) {
        let minRiskCandidate = analyzedRoutes[0];
        for (let i = 1; i < analyzedRoutes.length; i++) {
          if (analyzedRoutes[i].analysis.riskScore < minRiskCandidate.analysis.riskScore) {
            minRiskCandidate = analyzedRoutes[i];
          }
        }
        chosenCandidate = minRiskCandidate;
        selectionStatus = 'alt_suggested_blocked';
      }

      // 4. Apply selected route and statistics
      setRoute(chosenCandidate.feature);
      const distanceKm = parseFloat((chosenCandidate.route.distance / 1000).toFixed(1));
      const durationMin = Math.round(chosenCandidate.route.duration / 60);
      setRouteStats({ distanceKm, durationMin });
      setRouteStatus(selectionStatus);
      setAffectedRoad(chosenCandidate.analysis.affectedRoadName || null);
    } catch (err: any) {
      console.error('OSRM fetch unexpected error:', err);
      setRouteError('Rota hesaplanamadı. Lütfen başlangıç ve varış noktalarını kontrol et.');
    } finally {
      setRouteLoading(false);
    }
  }, [startCoords, destCoords, closedRoads, excludeZones]);

  // Update selection coordinates manually from autocomplete panels
  const handleSetStart = useCallback((coords: Coordinates, address: string) => {
    setStartCoords(coords);
    setStartAddress(address);
    setFocusCoords(coords);
  }, []);

  const handleSetDest = useCallback((coords: Coordinates | null, address: string) => {
    setDestCoords(coords);
    setDestAddress(address);
    if (coords) {
      setFocusCoords(coords);
    }
  }, []);

  // Center/focus map on selected warnings
  const handleFocusWarning = useCallback((coords: Coordinates) => {
    setFocusCoords(coords);
  }, []);

  // Calculate nearby warnings using Turf.js based on starting coords
  const nearbyWarnings = useMemo<RoadClosureWarning[]>(() => {
    const referenceCoords = startCoords || geoCoords || [32.8597, 39.9334];
    const roads = closedRoads?.features || [];
    const zones = excludeZones?.features || [];
    return getNearbyWarnings(referenceCoords, roads, zones);
  }, [startCoords, geoCoords, closedRoads, excludeZones]);

  // Statistics
  const closedRoadsCount = closedRoads?.features?.length || 0;
  const excludeZonesCount = excludeZones?.features?.length || 0;

  return (
    <div className="min-h-screen overflow-y-auto bg-slate-950 font-sans lg:h-screen lg:overflow-hidden">
      {/* Top Banner Header */}
      <Header
        apiState={apiState}
        loading={dataLoading}
        onRefresh={fetchData}
        closedRoadsCount={closedRoadsCount}
        excludeZonesCount={excludeZonesCount}
      />

      {/* Main Panel Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_420px] lg:h-[calc(100vh-96px)]">
        
        {/* Left Side Panel: Settings */}
        <SearchPanel
          startCoords={startCoords}
          destCoords={destCoords}
          startAddress={startAddress}
          destAddress={destAddress}
          onSetStart={handleSetStart}
          onSetDest={handleSetDest}
          geolocationCoords={geoCoords}
          geoLoading={geoLoading}
          onRetryGeo={retryGeo}
          mapSelectionMode={mapSelectionMode}
          onSetMapSelectionMode={setMapSelectionMode}
          routeStats={routeStats}
          routeLoading={routeLoading}
          routeError={routeError}
          onFindRoute={handleFindRoute}
          routeStatus={routeStatus}
          affectedRoad={affectedRoad}
        />

        {/* Center: MapLibre GL Map Viewport */}
        <div className="relative order-2 h-[420px] min-h-[360px] w-full lg:order-none lg:h-full">
          {dataError && (
            <div className="absolute top-4 left-4 right-4 bg-red-950/90 border border-red-500/25 p-4 rounded-xl text-red-200 text-xs flex items-center gap-3 z-20">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Veri Güncelleme Hatası</p>
                <p className="mt-0.5 opacity-80">{dataError}</p>
              </div>
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-red-900 border border-red-700 hover:bg-red-800 rounded font-semibold text-[10px] cursor-pointer"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          <Map
            startCoords={startCoords}
            destCoords={destCoords}
            closedRoads={closedRoads}
            excludeZones={excludeZones}
            route={route}
            routeStatus={routeStatus}
            mapSelectionMode={mapSelectionMode}
            onMapClick={handleMapClick}
            onDragStartPin={handleDragStartPin}
            onDragDestPin={handleDragDestPin}
            geolocationCoords={geoCoords}
            focusCoords={focusCoords}
          />
        </div>

        <RouteSummaryCard
          routeStats={routeStats}
          routeStatus={routeStatus}
          affectedRoad={affectedRoad}
          className="order-3 mx-4 mt-4 lg:hidden"
        />

        {/* Right Side Panel: Warnings Listing */}
        <InfoPanel
          warnings={nearbyWarnings}
          onFocusWarning={handleFocusWarning}
          startCoords={startCoords}
        />
      </div>
    </div>
  );
}
