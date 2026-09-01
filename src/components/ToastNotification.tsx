import React, { useEffect } from 'react';
import { AlertTriangle, Flame, CheckCircle2, X } from 'lucide-react';
import type { HazardLevel } from '../types/database.types';

export interface ToastData {
  id: string;
  hazardLevel: HazardLevel;
  equipmentId: string;
  location: string;
}

interface ToastNotificationProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div
      id="hazvox-toast-container"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        const isCrit = toast.hazardLevel === 'critical';
        const isMed = toast.hazardLevel === 'medium';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-4 border font-mono shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-right-8 ${
              isCrit
                ? 'bg-red-950/95 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse'
                : isMed
                ? 'bg-amber-950/95 border-amber-500 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/95 border-cyan-500 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-1.5 rounded-lg mt-0.5 ${
                    isCrit
                      ? 'bg-red-500 text-white'
                      : isMed
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {isCrit ? (
                    <Flame className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider uppercase">
                      HAZARD LOGGED: {toast.hazardLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-semibold mt-1">
                    Unit: <span className="text-white">{toast.equipmentId}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Zone: {toast.location}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
