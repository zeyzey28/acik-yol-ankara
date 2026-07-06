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
    <header className="bg-slate-950 border-b border-slate-900 px-4 py-3 sm:px-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-white">
      <div className="flex min-w-0 items-center gap-3">
        <Image
          src="/logo.png"
          alt="Açık Yol Ankara"
          width={44}
          height={44}
          className="object-contain shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Açık Yol Ankara
          </h1>
          <p className="text-xs text-slate-400 leading-snug">
            Kapalı yolları ve alternatif geçişleri daha anlaşılır gösteren rota yardım aracı
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
        {/* Live Status indicator */}
        <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Veri güncel
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-900 px-3 sm:px-4 py-2 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-300 font-semibold">{closedRoadsCount} kapalı yol</span>
          </div>
          <div className="hidden h-4 w-px bg-slate-700 sm:block"></div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span className="text-xs text-slate-300 font-semibold">{excludeZonesCount} protokol güzergâhı</span>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 border border-slate-800 hover:border-slate-700 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Verileri Yenile"
        >
          <RefreshCw className={`w-4 h-4 text-slate-300 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
