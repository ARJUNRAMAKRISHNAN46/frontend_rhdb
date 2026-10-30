import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  Check,
} from 'lucide-react';
import { ActiveSection } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';

interface AlertsViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState(PharmacyService.getAlerts());
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setAlerts(PharmacyService.getAlerts());
    });
    return unsub;
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && !alert.resolved) ||
      (statusFilter === 'RESOLVED' && alert.resolved);

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleResolve = (alertId: string) => {
    PharmacyService.resolveAlert(alertId, 'Pharm. Rajesh Kumar (Reg #88291)');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Security & Clinical Alerts</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Automated notifications for counterfeit detections, contraindications, and stock alerts
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 text-xs shadow-2xs">
            {(['ACTIVE', 'RESOLVED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {st === 'ACTIVE' ? 'Unresolved' : st === 'RESOLVED' ? 'Resolved' : 'All'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 text-xs shadow-2xs">
            {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  severityFilter === sev
                    ? 'bg-zinc-800 dark:bg-zinc-700 text-white font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs shadow-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
            No alerts found matching current filter criteria.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition-all shadow-xs ${
                alert.resolved
                  ? 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/80 opacity-70'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/40'
                  : alert.severity === 'HIGH'
                  ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-500/30'
                  : 'bg-white dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      {alert.id}
                    </span>
                    <StatusBadge status={alert.severity} size="sm" />
                    <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
                      {alert.type}
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {alert.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{alert.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-4xl">
                    {alert.message}
                  </p>

                  {alert.resolved && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                      ✓ Resolved by {alert.resolvedBy} at {alert.resolvedAt}
                    </p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  {!alert.resolved && (
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check className="w-3.5 h-3.5" />}
                      onClick={() => handleResolve(alert.id)}
                    >
                      Acknowledge & Resolve
                    </Button>
                  )}
                  {alert.type === 'COUNTERFEIT_DETECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate('inventory')}
                    >
                      View Quarantine
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
