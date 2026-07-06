import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { Coordinates } from '@/utils/types';

interface SearchPanelProps {
  startCoords: Coordinates | null;
  destCoords: Coordinates | null;
  startAddress: string;
  destAddress: string;
  onSetStart: (coords: Coordinates, address: string) => void;
  onSetDest: (coords: Coordinates | null, address: string) => void;
  geolocationCoords: Coordinates | null;
  geoLoading: boolean;
  onRetryGeo: () => void;
  mapSelectionMode: 'start' | 'dest' | null;
  onSetMapSelectionMode: (mode: 'start' | 'dest' | null) => void;
  routeStats: { distanceKm: number; durationMin: number } | null;
  routeLoading: boolean;
  routeError: string | null;
  onFindRoute: () => void;
  routeStatus: 'suitable' | 'clear' | 'near' | 'risky' | 'blocked' | 'closed' | 'searching_alt' | 'alt_suggested' | 'alt_suggested_risky' | 'alt_suggested_blocked' | 'alt_not_found' | 'alt_service_failed' | null;
  affectedRoad: string | null;
}

interface RouteSummaryCardProps {
  routeStats: { distanceKm: number; durationMin: number } | null;
  routeStatus: SearchPanelProps['routeStatus'];
  affectedRoad: string | null;
  className?: string;
}

export function RouteSummaryCard({
  routeStats,
  routeStatus,
  affectedRoad,
  className = '',
}: RouteSummaryCardProps) {
  if (!routeStats && routeStatus !== 'searching_alt') return null;

  return (
    <div className={`p-4 rounded-xl flex flex-col gap-2 border ${
      routeStatus === 'alt_suggested_blocked' || routeStatus === 'closed' || routeStatus === 'blocked' || routeStatus === 'alt_not_found'
        ? 'bg-red-950/40 border-red-900/30 text-red-200'
        : routeStatus === 'near' || routeStatus === 'risky' || routeStatus === 'alt_suggested_risky' || routeStatus === 'alt_suggested'
        ? 'bg-amber-950/40 border-amber-900/30 text-amber-200'
        : 'bg-blue-950/20 border-blue-900/30 text-blue-200'
    } ${className}`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-85">Rota Özeti</p>

      {routeStats && (
        <>
          <div className="flex justify-between text-xs border-b border-slate-900/30 pb-1.5 mb-0.5">
            <span className="opacity-80">Mesafe:</span>
            <span className="font-semibold text-white">{routeStats.distanceKm} km</span>
          </div>
          <div className="flex flex-col text-xs border-b border-slate-900/30 pb-1.5 mb-0.5 gap-0.5">
            <div className="flex justify-between">
              <span className="opacity-80">Tahmini süre:</span>
              <span className="font-semibold text-white">{routeStats.durationMin} dk</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium self-end">Not: Canlı trafik dahil değildir.</span>
          </div>
        </>
      )}

      {/* Status Information */}
      <div className="flex flex-col gap-1 text-[11px] mt-0.5">
        <div className="flex justify-between gap-3">
          <span className="opacity-80">Durum:</span>
          <span className={`font-bold text-right ${
            routeStatus === 'alt_suggested_blocked' || routeStatus === 'closed' || routeStatus === 'blocked' || routeStatus === 'alt_not_found'
              ? 'text-red-400'
              : routeStatus === 'near' || routeStatus === 'risky' || routeStatus === 'alt_suggested_risky' || routeStatus === 'alt_suggested'
              ? 'text-amber-400'
              : 'text-blue-400'
          }`}>
            {routeStatus === 'alt_not_found' && 'Alternatif rota bulunamadı'}
            {routeStatus === 'alt_suggested_blocked' && 'Uyarılı rota'}
            {(routeStatus === 'near' || routeStatus === 'risky' || routeStatus === 'alt_suggested_risky' || routeStatus === 'alt_suggested') && 'Daha uygun rota önerildi'}
            {(routeStatus === 'suitable' || routeStatus === 'clear') && 'Rota uygun görünüyor'}
            {routeStatus === 'searching_alt' && 'Alternatif rota aranıyor'}
          </span>
        </div>

        <p className="opacity-90 leading-relaxed font-medium mt-1">
          {routeStatus === 'alt_not_found' && 'Rota hesaplanamadı. Lütfen başlangıç ve varış noktalarını kontrol et.'}
          {routeStatus === 'alt_suggested_blocked' && 'Bu güzergâh kapalı yol kesimlerine yakın veya kesişen bölgelerden geçebilir. Yola çıkmadan önce resmi yönlendirmeleri kontrol edin.'}
          {(routeStatus === 'near' || routeStatus === 'risky' || routeStatus === 'alt_suggested_risky' || routeStatus === 'alt_suggested') && 'İlk rota kapalı yol kesimlerine denk geldiği için sistem daha uygun görünen bir rota seçti. Yine de yol üzerindeki resmi yönlendirmeleri takip edin.'}
          {(routeStatus === 'suitable' || routeStatus === 'clear') && 'Bu rota mevcut kapalı yol verileriyle belirgin şekilde çakışmıyor.'}
          {routeStatus === 'searching_alt' && 'İlk rota kapalı yol ile çakışıyor. Alternatif rota aranıyor...'}
        </p>

        {affectedRoad && routeStatus !== 'searching_alt' && (
          <p className="font-semibold mt-0.5 flex gap-1">
            <span className="opacity-80 font-normal">Etkilenen yol:</span>
            <span className={
              routeStatus === 'alt_suggested_blocked' || routeStatus === 'closed' || routeStatus === 'blocked' || routeStatus === 'alt_not_found'
                ? 'text-red-300'
                : 'text-amber-300'
            }>{affectedRoad}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPanel({
  startCoords,
  destCoords,
  startAddress,
  destAddress,
  onSetStart,
  onSetDest,
  geolocationCoords,
  geoLoading,
  onRetryGeo,
  mapSelectionMode,
  onSetMapSelectionMode,
  routeStats,
  routeLoading,
  routeError,
  onFindRoute,
  routeStatus,
  affectedRoad,
}: SearchPanelProps) {
  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
  const [searchingStart, setSearchingStart] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const destTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync inputs with addresses passed from parent
  useEffect(() => {
    setStartQuery(startAddress);
  }, [startAddress]);

  useEffect(() => {
    setDestQuery(destAddress);
  }, [destAddress]);

  // Autocomplete for address using Nominatim (simple for now)
  const searchAddress = async (query: string, isStart: boolean) => {
    setSearchError(null);
    if (query.length < 3) {
      if (isStart) setStartSuggestions([]);
      else setDestSuggestions([]);
      return;
    }

    if (isStart) setSearchingStart(true);
    else setSearchingDest(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Ankara, Turkey')}&format=json&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (isStart) {
          setStartSuggestions(data);
          if (data.length === 0) setSearchError('Adres bulunamadı.');
        } else {
          setDestSuggestions(data);
          if (data.length === 0) setSearchError('Adres bulunamadı.');
        }
      } else {
        setSearchError('Adres araması yapılamadı.');
      }
    } catch (e) {
      console.error('Nominatim autocomplete error:', e);
      setSearchError('Adres araması yapılamadı.');
      if (isStart) setStartSuggestions([]);
      else setDestSuggestions([]);
    } finally {
      if (isStart) setSearchingStart(false);
      else setSearchingDest(false);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartQuery(val);

    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    startTimeoutRef.current = setTimeout(() => {
      searchAddress(val, true);
    }, 500);
  };

  const handleDestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDestQuery(val);

    if (destTimeoutRef.current) clearTimeout(destTimeoutRef.current);
    destTimeoutRef.current = setTimeout(() => {
      searchAddress(val, false);
    }, 500);
  };

  const selectSuggestion = (item: any, isStart: boolean) => {
    const coords: Coordinates = [parseFloat(item.lon), parseFloat(item.lat)];
    const displayName = item.display_name.split(',')[0] + ', ' + (item.address.suburb || item.address.town || 'Ankara');

    if (isStart) {
      onSetStart(coords, displayName);
      setStartSuggestions([]);
    } else {
      onSetDest(coords, displayName);
      setDestSuggestions([]);
    }
    setSearchError(null);
    onSetMapSelectionMode(null);
  };

  const handleUseMyLocation = () => {
    if (geolocationCoords) {
      onSetStart(geolocationCoords, 'Mevcut Konum');
      onSetMapSelectionMode(null);
    } else {
      onRetryGeo();
    }
  };

  return (
    <div className="order-1 bg-slate-950 border-b border-slate-900 p-4 sm:p-5 lg:order-none lg:border-b-0 lg:border-r border-slate-900 text-white flex flex-col gap-5 w-full shrink-0 lg:h-full lg:overflow-y-auto">
      {/* Title Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Rota Planla</h2>
        
        {/* Start Point Input */}
        <div className="relative mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <span>Başlangıç Noktası</span>
            <button
              onClick={handleUseMyLocation}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer font-medium"
              title="Konumumu Kullan"
            >
              <Navigation className="w-3 h-3 fill-current" />
              Konumumu Kullan
            </button>
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={startQuery}
                onChange={handleStartChange}
                placeholder="Başlangıç adresi girin..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-850 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
              />
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-blue-500" />
              {searchingStart && (
                <RefreshCw className="absolute right-3 top-3 w-3 h-3 text-slate-500 animate-spin" />
              )}
            </div>
            <button
              onClick={() => onSetMapSelectionMode(mapSelectionMode === 'start' ? null : 'start')}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer shrink-0 ${
                mapSelectionMode === 'start'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-850 text-slate-350 hover:bg-slate-800'
              }`}
            >
              Haritadan Seç
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {startSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
              {startSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(item, true)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 border-b border-slate-950 last:border-b-0 text-slate-300 flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-slate-200">
                    {item.display_name.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchError && startQuery.length >= 3 && startSuggestions.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-red-900/20 rounded-lg p-2.5 text-xs text-red-400 shadow-2xl">
              {searchError}
            </div>
          )}
        </div>

        {/* Destination Point Input */}
        <div className="relative mb-5">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Varış Noktası
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={destQuery}
                onChange={handleDestChange}
                placeholder="Varış adresi girin..."
                className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-850 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-500"
              />
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-orange-500" />
              {searchingDest && (
                <RefreshCw className="absolute right-3 top-3 w-3 h-3 text-slate-500 animate-spin" />
              )}
            </div>
            <button
              onClick={() => onSetMapSelectionMode(mapSelectionMode === 'dest' ? null : 'dest')}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition cursor-pointer shrink-0 ${
                mapSelectionMode === 'dest'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                  : 'bg-slate-900 border-slate-850 text-slate-350 hover:bg-slate-800'
              }`}
            >
              Haritadan Seç
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {destSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
              {destSuggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => selectSuggestion(item, false)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 border-b border-slate-950 last:border-b-0 text-slate-300 flex flex-col gap-0.5"
                >
                  <span className="font-semibold text-slate-200">
                    {item.display_name.split(',')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchError && destQuery.length >= 3 && destSuggestions.length === 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-red-900/20 rounded-lg p-2.5 text-xs text-red-400 shadow-2xl">
              {searchError}
            </div>
          )}
        </div>
      </div>

      {/* Geolocation status warning (Turkish localized as requested) */}
      {!geolocationCoords && !geoLoading && (
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-850 flex flex-col gap-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Konum alınamadı. Başlangıç noktasını adres arayarak veya haritadan seçerek belirleyebilirsin.
          </p>
        </div>
      )}

      {/* Route Analysis / Routing button at the bottom */}
      <div className="mt-auto pt-4 flex flex-col gap-3">
        {routeError && (
          <div className="bg-red-950/60 border border-red-900/30 p-3 rounded-lg text-xs text-red-400 leading-normal">
            Rota hesaplanamadı. Lütfen başlangıç ve varış noktalarını kontrol et.
          </div>
        )}

        <RouteSummaryCard
          routeStats={routeStats}
          routeStatus={routeStatus}
          affectedRoad={affectedRoad}
          className="hidden lg:flex"
        />

        <button
          onClick={onFindRoute}
          disabled={!startCoords || !destCoords || routeLoading}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 active:bg-blue-750 disabled:bg-blue-600/20 disabled:text-blue-400/50 disabled:border disabled:border-blue-900/30 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
        >
          {routeStatus === 'searching_alt'
            ? 'Alternatif rota aranıyor...'
            : routeLoading
            ? 'Rota hesaplanıyor...'
            : 'Rota Bul'}
        </button>

        <div className="border-t border-slate-900 pt-3 text-[11px] text-slate-550 flex flex-col gap-1.5">
          <div className="flex justify-between gap-2">
            <span>Başlangıç:</span>
            <span className="min-w-0 max-w-[60vw] truncate text-right font-mono text-slate-400 lg:max-w-[200px]" title={startAddress || 'Belirlenmedi'}>
              {startAddress || 'Belirlenmedi'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Varış:</span>
            <span className="min-w-0 max-w-[60vw] truncate text-right font-mono text-slate-400 lg:max-w-[200px]" title={destAddress || 'Belirlenmedi'}>
              {destAddress || 'Belirlenmedi'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
