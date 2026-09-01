import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { HazardLevel, InsertIncident } from '../types/database.types';

interface ManualReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertIncident) => Promise<void>;
}

export const ManualReportModal: React.FC<ManualReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [hazardLevel, setHazardLevel] = useState<HazardLevel>('medium');
  const [equipmentId, setEquipmentId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId.trim() || !location.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        hazard_level: hazardLevel,
        equipment_id: equipmentId.trim().toUpperCase(),
        location: location.trim(),
        description: description.trim(),
        status: 'open',
        reported_by: 'Manual Dispatch Console',
      });
      // Reset
      setEquipmentId('');
      setLocation('');
      setDescription('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                Manual Incident Entry
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Log hazard report directly to incidents database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 font-mono text-xs text-slate-300">
          {/* Hazard Level Selector */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold uppercase text-[10px] tracking-wider">
              HAZARD LEVEL
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'critical'] as const).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setHazardLevel(lvl)}
                  className={`py-2 rounded font-black uppercase transition-colors border text-[11px] ${
                    hazardLevel === lvl
                      ? lvl === 'critical'
                        ? 'bg-red-600 text-white border-red-500 shadow-md'
                        : lvl === 'medium'
                        ? 'bg-yellow-400 text-black border-yellow-300 shadow-md'
                        : 'bg-slate-300 text-black border-slate-200 shadow-md'
                      : 'bg-black/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment ID */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">
              EQUIPMENT IDENTIFIER
            </label>
            <input
              type="text"
              required
              placeholder="e.g. TURBINE-04, CONVEYOR-CV12, PUMP-P09"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full bg-black/50 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">
              FACILITY LOCATION / ZONE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sector 9 - Power Hall, Warehouse B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-black/50 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">
              HAZARD DESCRIPTION
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the safety threat, anomalous readings, or physical defects observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/50 border border-slate-800 rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 text-xs font-bold uppercase transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'DISPATCHING...' : 'DISPATCH HAZARD'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
