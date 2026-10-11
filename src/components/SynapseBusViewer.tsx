import React from 'react';
import { Network, Zap } from 'lucide-react';

interface Props {
  busState: Record<string, number | string>;
}

export const SynapseBusViewer: React.FC<Props> = ({ busState }) => {
  const keys = Object.keys(busState);
  if (keys.length === 0) return null;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <Network className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span className="font-mono text-[11px] text-indigo-300">[SYNAPSE DATA BUS]</span>
        <span className="text-slate-400 hidden sm:inline">動的モジュール間 データ連動パイプ:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        {keys.map((k) => {
          const val = busState[k];
          return (
            <div
              key={k}
              className="flex items-center gap-1.5 text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-indigo-900/40 text-slate-200"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-slate-400 font-mono text-[10px]">{k}:</span>
              <span className="font-mono font-bold text-indigo-300">
                {typeof val === 'number' ? val.toLocaleString('ja-JP') : String(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
