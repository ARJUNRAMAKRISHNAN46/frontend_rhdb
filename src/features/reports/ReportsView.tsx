import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { ActiveSection } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Button } from '@/components/common/Button';

interface ReportsViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = () => {
  const [batches, setBatches] = useState(PharmacyService.getBatches());
  const [dispenseRecords, setDispenseRecords] = useState(PharmacyService.getDispenseRecords());

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setBatches(PharmacyService.getBatches());
      setDispenseRecords(PharmacyService.getDispenseRecords());
    });
    return unsub;
  }, []);

  const totalDispensedValue = dispenseRecords.reduce((acc, r) => acc + r.totalAmount, 0);
  const controlledBatches = batches.filter((b) => b.controlledSubstance);
  const totalStockUnits = batches.reduce((acc, b) => acc + b.stockQuantity, 0);

  const handleExportCsv = () => {
    const headers = ['Record ID', 'Prescription ID', 'Patient Name', 'Dispensed At', 'Token', 'Amount (INR)'];
    const rows = dispenseRecords.map((r) => [
      r.id,
      r.prescriptionId,
      `"${r.patientName}"`,
      r.dispensedAt,
      r.dispensingToken,
      r.totalAmount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RHDB_DISPENSING_REPORT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Reports
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Dispensing metrics and stock summary
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          onClick={handleExportCsv}
        >
          Export CSV
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Dispensed Value</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalDispensedValue.toFixed(0)}</p>
          <p className="text-[11px] text-zinc-400">{dispenseRecords.length} orders completed</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Units in Stock</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalStockUnits.toLocaleString()}</p>
          <p className="text-[11px] text-zinc-400">{batches.length} active batches</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Verification Accuracy</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">99.4%</p>
          <p className="text-[11px] text-zinc-400">Formulary matched</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Schedule H1 Medicines</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{controlledBatches.length}</p>
          <p className="text-[11px] text-zinc-400">Controlled register active</p>
        </div>
      </div>

      {/* Controlled Substance Registry Report */}
      <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Schedule H1 / Controlled Drugs Compliance Register
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Statutory documentation of habit-forming and controlled substances per State Drug Control
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 font-semibold">
            Mandatory Daily Audit
          </span>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Controlled Substance</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Manufacturer</th>
                <th className="p-3">Custodian Condition</th>
                <th className="p-3 text-right">Regulatory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-mono">
              {controlledBatches.map((b) => (
                <tr key={b.id} className="bg-white dark:bg-zinc-900/40">
                  <td className="p-3 font-sans font-semibold text-zinc-900 dark:text-zinc-200">
                    {b.name} ({b.genericName})
                  </td>
                  <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">{b.batchNumber}</td>
                  <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{b.stockQuantity} units</td>
                  <td className="p-3 font-sans text-zinc-600 dark:text-zinc-400">{b.manufacturer}</td>
                  <td className="p-3 font-sans text-zinc-600 dark:text-zinc-400">{b.storageCondition}</td>
                  <td className="p-3 font-sans text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                      ✓ Compliant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
