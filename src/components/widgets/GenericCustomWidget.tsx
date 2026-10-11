import React from 'react';
import type { MorphicWidget } from '../../types/morphic';
import { soundEngine } from '../../lib/soundEngine';

interface Props {
  widget: MorphicWidget;
  onUpdate: (updated: MorphicWidget) => void;
}

export const GenericCustomWidget: React.FC<Props> = ({ widget, onUpdate }) => {
  const fields = widget.data.customFields || [];

  const handleFieldChange = (fieldId: string, val: any) => {
    soundEngine.playClick();
    const updatedFields = fields.map((f) => (f.id === fieldId ? { ...f, value: val } : f));
    onUpdate({
      ...widget,
      data: { ...widget.data, customFields: updatedFields },
    });
  };

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.id} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <label className="text-xs text-slate-300 font-medium block mb-1">{f.label}</label>
          {f.type === 'toggle' ? (
            <button
              onClick={() => handleFieldChange(f.id, !f.value)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                f.value ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.value ? '有効 (Active)' : '無効 (Inactive)'}
            </button>
          ) : f.type === 'number' ? (
            <input
              type="number"
              value={f.value}
              onChange={(e) => handleFieldChange(f.id, parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
            />
          ) : (
            <input
              type="text"
              value={f.value}
              onChange={(e) => handleFieldChange(f.id, e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
            />
          )}
        </div>
      ))}
      {fields.length === 0 && (
        <div className="text-xs text-slate-500 py-3 text-center">カスタムフィールドがありません</div>
      )}
    </div>
  );
};
