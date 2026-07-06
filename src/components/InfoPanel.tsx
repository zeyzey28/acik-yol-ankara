import React, { useState, useMemo, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, Eye, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { RoadClosureWarning, Coordinates } from '@/utils/types';

interface InfoPanelProps {
  warnings: RoadClosureWarning[];
  onFocusWarning: (coords: Coordinates) => void;
  startCoords: Coordinates | null;
}

interface GroupedWarning {
  id: string;
  name: string;
  description: string;
  distanceKm: number;
  type: 'closed' | 'exclude';
  coordinates: Coordinates;
  count: number;
  properties?: any;
}

export default function InfoPanel({ warnings, onFocusWarning, startCoords }: InfoPanelProps) {
  const [distanceFilter, setDistanceFilter] = useState<number>(10); // default 10km
  const [isOpen, setIsOpen] = useState<boolean>(true); // default open on desktop

  useEffect(() => {
    const first = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    const second = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 320);

    return () => {
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, [isOpen]);

  // Group warnings by name to avoid duplicates
  const groupedWarnings = useMemo(() => {
    const groupsMap = new Map<string, GroupedWarning>();

    warnings.forEach((w) => {
      // Normalize road name for better grouping matching
      const roadName = w.name.trim();
      const existing = groupsMap.get(roadName);

      if (existing) {
        existing.count += 1;
        // Keep the closest coordinate/distance
        if (w.distanceKm < existing.distanceKm) {
          existing.distanceKm = w.distanceKm;
          existing.coordinates = w.coordinates;
          existing.description = w.description;
          existing.properties = w.properties;
        }
      } else {
        groupsMap.set(roadName, {
          id: w.id,
          name: roadName,
          description: w.description,
          distanceKm: w.distanceKm,
          type: w.type,
          coordinates: w.coordinates,
          count: 1,
          properties: w.properties,
        });
      }
    });

    const groups = Array.from(groupsMap.values());

    // Sort by distance if start coordinates are available
    if (startCoords) {
      groups.sort((a, b) => a.distanceKm - b.distanceKm);
    }

    return groups;
  }, [warnings, startCoords]);

  // Filter based on distance from start point
  const filteredWarnings = useMemo(() => {
    return groupedWarnings.filter((w) => {
      // If startCoords is null, distance filter is ignored/displays all for first 8
      if (!startCoords) return true;
      if (distanceFilter === -1) return true;
      return w.distanceKm <= distanceFilter;
    });
  }, [groupedWarnings, startCoords, distanceFilter]);

  // Display only the first 8 warnings
  const displayedWarnings = useMemo(() => {
    return filteredWarnings.slice(0, 8);
  }, [filteredWarnings]);

  return (
    <div className="relative order-4 flex w-full shrink-0 lg:order-none lg:w-auto">
      {/* Collapsed tab button – always visible */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="m-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-slate-300 shadow-lg transition-colors hover:bg-slate-800 lg:fixed lg:right-0 lg:top-1/2 lg:z-30 lg:m-0 lg:w-auto lg:-translate-y-1/2 lg:rounded-l-lg lg:border-r-0 lg:px-2 lg:py-3 cursor-pointer"
          title="Kapalı Yolları Göster"
        >
          <ChevronLeft className="hidden w-4 h-4 lg:block" />
          <span className="text-xs font-semibold lg:text-[11px] lg:[writing-mode:vertical-rl] lg:[transform:rotate(180deg)]">Kapalı Yolları Göster</span>
        </button>
      )}

      {/* Panel itself */}
      <div
        className={`bg-slate-950 border-t border-slate-900 text-white flex flex-col gap-4 shrink-0 lg:border-t-0 lg:border-l lg:overflow-y-auto transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-full p-5 opacity-100 lg:h-full'
            : 'hidden p-0 opacity-0 pointer-events-none lg:flex lg:w-0 lg:overflow-hidden'
        }`}
      >
        {/* Title & Toggle */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Kapalı Yollar</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Yakınındaki yol uyarıları</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1.5 shrink-0 transition-colors cursor-pointer"
            title="Paneli Kapat"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Kapat
          </button>
        </div>
        
        {startCoords && (
          <div className="flex flex-col gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 mb-2">
            <label className="text-xs text-slate-400 flex justify-between font-medium">
              <span>Mesafe Filtresi:</span>
              <span className="font-semibold text-blue-400">
                {distanceFilter === -1 ? 'Tüm Ankara' : `${distanceFilter} km`}
              </span>
            </label>
            <div className="flex gap-1.5">
              {[5, 10, 20, -1].map((val) => (
                <button
                  key={val}
                  onClick={() => setDistanceFilter(val)}
                  className={`flex-1 py-1 px-2 text-[11px] rounded font-semibold border transition cursor-pointer ${
                    distanceFilter === val
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {val === -1 ? 'Hepsi' : `${val}k`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Warnings List */}
      <div className="flex-1 overflow-y-auto min-h-[250px] lg:min-h-0 flex flex-col gap-3">
        {displayedWarnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-900/40 rounded-xl border border-slate-800 border-dashed h-full">
            <Compass className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">Engel Bulunamadı</p>
            <p className="text-xs text-slate-600 mt-1">
              Aktif kapalı yol veya VIP güzergâh bulunmuyor.
            </p>
          </div>
        ) : (
          displayedWarnings.map((warning) => {
            const props = warning.properties || {};
            const startName = props.start_name || props.start || props.from || props.source;
            const endName = props.end_name || props.end || props.to || props.target;
            const hasStartEnd = !!(startName && endName && String(startName).trim() && String(endName).trim());

            const desc = warning.description;
            const showDesc = desc && 
              desc !== 'Açıklama belirtilmemiş.' && 
              desc !== 'VIP Geçiş Güzergahı.' &&
              desc !== 'VIP Konvoy Geçişi Güzergahı. Belirtilen saatlerde kesintili kapatmalar uygulanabilir.';

            return (
              <div
                key={warning.id}
                className="p-4 rounded-xl border bg-slate-900 border-slate-850 hover:border-slate-800 transition flex flex-col gap-2.5"
              >
                {/* Yol adı & Icon */}
                <div className="flex items-start gap-2">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    warning.type === 'closed' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {warning.type === 'closed' ? (
                      <AlertOctagon className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold leading-snug text-slate-200">
                      {warning.name}
                    </h3>
                    {/* Kategori */}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {warning.type === 'closed' ? 'Kapalı yol' : 'Protokol güzergâhı'}
                    </span>
                  </div>
                </div>

                {/* Kapalı kesim bilgisi */}
                <div className="pl-8 text-xs">
                  {hasStartEnd ? (
                    <div className="flex flex-col gap-0.5 text-slate-350">
                      <p><strong>Başlangıç:</strong> {String(startName)}</p>
                      <p><strong>Bitiş:</strong> {String(endName)}</p>
                    </div>
                  ) : (
                    <p className="text-slate-350">
                      {warning.type === 'closed' 
                        ? 'Bu yol üzerinde kapalı kesim bulunuyor.' 
                        : 'Bu yol protokol geçiş güzergâhı olarak işaretlenmiş.'}
                    </p>
                  )}
                </div>

                {/* Açıklama (Optional) */}
                {showDesc && (
                  <p className="text-xs text-slate-450 leading-relaxed pl-8 border-l border-slate-800 ml-8">
                    {desc}
                  </p>
                )}

                {/* Mesafe & Action */}
                <div className="pl-8 flex items-center justify-between border-t border-slate-800/40 pt-2.5 mt-1">
                  <span className="text-[11px] text-slate-400">
                    {startCoords ? (
                      `Mesafe: ${warning.distanceKm} km`
                    ) : (
                      <span className="text-slate-500 italic">Mesafe başlangıç seçilince hesaplanacak</span>
                    )}
                  </span>
                  
                  <button
                    onClick={() => onFocusWarning(warning.coordinates)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Haritada Göster
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-400 leading-relaxed text-center">
        <p>Başlangıç noktası seçildiğinde sana en yakın yol uyarıları listelenir.</p>
      </div>
    </div>
    </div>
  );
}
