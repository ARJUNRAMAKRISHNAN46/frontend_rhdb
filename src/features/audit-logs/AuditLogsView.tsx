import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { ActiveSection } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Button } from '@/components/common/Button';

interface AuditLogsViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = () => {
  const [logs, setLogs] = useState(PharmacyService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setLogs(PharmacyService.getAuditLogs());
    });
    return unsub;
  }, []);

  const actions = ['ALL', ...Array.from(new Set(logs.map((l) => l.action)))];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.pharmacistId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.integrityHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.station.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `RHDB_AUDIT_TRAIL_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Regulatory Audit Trail</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Tamper-evident chronological log of every clinical and verification action performed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={handleExportJson}
          >
            Export Signed JSON
          </Button>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit details, hash, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        {actions.map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all ${
              actionFilter === act
                ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shadow-2xs'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800 font-sans">
              <tr>
                <th className="py-3 px-4">Timestamp & ID</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Details & Target Entity</th>
                <th className="py-3 px-4">Pharmacist & Station</th>
                <th className="py-3 px-4">Cryptographic Checksum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredLogs.map((log) => {
                const isSecurityAction =
                  log.action === 'MEDICINE_SCAN_COUNTERFEIT' || log.action === 'RX_VERIFY_ATTEMPT';
                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors ${
                      isSecurityAction ? 'bg-rose-50 dark:bg-rose-950/15' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-zinc-800 dark:text-zinc-300 font-bold">{log.timestamp}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{log.id}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                          isSecurityAction
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                            : log.action === 'MEDICINE_DISPENSED'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-xs text-zinc-800 dark:text-zinc-200 max-w-md">
                      {log.details}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-zinc-800 dark:text-zinc-300 font-sans text-xs">{log.pharmacistId}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500">{log.station} ({log.ipAddress})</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate max-w-[180px] bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 font-semibold">
                        {log.integrityHash}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
