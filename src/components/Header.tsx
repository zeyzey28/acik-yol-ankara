import React from 'react';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import { ApiState } from '@/utils/types';

interface HeaderProps {
  apiState: ApiState | null;
  loading: boolean;
  onRefresh: () => void;
  closedRoadsCount: number;
  excludeZonesCount: number;
}

export default function Header({
  apiState,
  loading,
  onRefresh,
  closedRoadsCount,
  excludeZonesCount,
}: HeaderProps) {
  return (
    <header className="bg-slate-950 border-b border-slate-900 px-4 md:px-6 py-2.5 md:py-3 flex flex-row items-center justify-between gap-3 text-white">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Image
          src="/logo.png"
          alt="Açık Yol Ankara"
          width={36}
          height={36}
          className="object-contain shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-base md:text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-tight">
            Açık Yol Ankara
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 truncate hidden sm:block">
            Kapalı yollar ve rota yardım aracı
          </p>
        </div>
      </div>

      {/* Right: Stats + Refresh */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Live dot — always visible */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          <span className="text-[10px] md:text-xs text-slate-400 font-medium hidden sm:block">Güncel</span>
        </div>

        {/* Stats — hidden on xs, visible sm+ */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[11px] text-slate-300 font-semibold">{closedRoadsCount} kapalı</span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-[11px] text-slate-300 font-semibold">{excludeZonesCount} protokol</span>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
