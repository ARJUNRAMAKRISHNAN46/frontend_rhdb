import React, { useState, useEffect } from 'react';
import {
  FileText,
  UserCheck,
  PackageCheck,
  ArrowRight,
  Boxes,
  CalendarClock,
  Printer,
  RefreshCw,
  AlertOctagon,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { ActiveSection, MedicineBatch, Prescription, DispenseRecord, SystemAlert } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface DashboardViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [dispenseRecords, setDispenseRecords] = useState<DispenseRecord[]>([]);
  const [inspectReceipt, setInspectReceipt] = useState<DispenseRecord | null>(null);

  const loadDashboardData = () => {
    try {
      setLoading(true);
      setError(null);
      setPrescriptions(PharmacyService.getPrescriptions());
      setBatches(PharmacyService.getBatches());
      setAlerts(PharmacyService.getAlerts());
      setDispenseRecords(PharmacyService.getDispenseRecords());
    } catch {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsub = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setBatches(PharmacyService.getBatches());
      setAlerts(PharmacyService.getAlerts());
      setDispenseRecords(PharmacyService.getDispenseRecords());
    });
    return unsub;
  }, []);

  const nearExpiryBatches = batches.filter((b) => {
    const exp = new Date(b.expiryDate).getTime();
    const now = new Date('2026-10-26').getTime();
    const diffDays = (exp - now) / (1000 * 3600 * 24);
    return diffDays <= 60;
  });

  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING').length;
  const completedCount = dispenseRecords.filter((r) => r.status === 'COMPLETED').length;
  const lowStockBatches = batches.filter((b) => b.stockQuantity <= b.reorderThreshold);
  const activeAlerts = alerts.filter((a) => !a.resolved);
  const totalDispensedAmount = dispenseRecords.reduce((acc, r) => acc + r.totalAmount, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 rounded-xl bg-zinc-200 dark:bg-zinc-900" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-zinc-200 dark:bg-zinc-900" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-center space-y-3">
        <AlertOctagon className="w-8 h-8 text-rose-500 mx-auto" />
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{error}</h2>
        <Button variant="primary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={loadDashboardData}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dashboard</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Prescription queue, inventory levels, and dispensing activity
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<UserCheck className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('prescriptions')}
          >
            Prescriptions
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<QrCode className="w-3.5 h-3.5" />}
            onClick={() => onNavigate('medicine-verification')}
          >
            Scan Medicine
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Prescriptions */}
        <div
          onClick={() => onNavigate('prescriptions')}
          className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pending Prescriptions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{pendingCount}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending Review</span>
          </div>
        </div>

        {/* Completed Dispensings */}
        <div
          onClick={() => onNavigate('dispensing-history')}
          className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Dispensed Orders</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{completedCount}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-medium">
              ₹{totalDispensedAmount.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Low Stock */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-orange-400 dark:hover:border-orange-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{lowStockBatches.length}</span>
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Batches Low</span>
          </div>
        </div>

        {/* Near Expiry */}
        <div
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs hover:border-rose-400 dark:hover:border-rose-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Near Expiry</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">{nearExpiryBatches.length}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Within 60 Days</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Table 1: Prescriptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Prescriptions</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('prescriptions')}
              >
                View all ({prescriptions.length})
              </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Rx ID</th>
                    <th className="py-2.5 px-3.5">Patient</th>
                    <th className="py-2.5 px-3.5">Doctor</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {prescriptions.slice(0, 4).map((rx) => (
                    <tr
                      key={rx.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                      onClick={() => onNavigate('prescriptions', rx.id)}
                    >
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {rx.id}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{rx.patientName}</div>
                        <div className="text-[11px] text-zinc-400">{rx.patientGender}, {rx.patientAge}y</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-300">
                        {rx.doctorName}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <StatusBadge status={rx.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onNavigate('prescriptions', rx.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Recent Dispensing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Dispensing</h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('dispensing-history')}
              >
                View all ({dispenseRecords.length})
              </Button>
            </div>

            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3.5">Record</th>
                    <th className="py-2.5 px-3.5">Patient</th>
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5">Amount</th>
                    <th className="py-2.5 px-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {dispenseRecords.slice(0, 3).map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-zinc-700 dark:text-zinc-300">
                        {record.prescriptionId}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {record.patientName}
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-500">
                        {record.dispensedAt}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        ₹{record.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Printer className="w-3.5 h-3.5" />}
                          onClick={() => setInspectReceipt(record)}
                        >
                          Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Inventory Alerts */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Alerts
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Inventory ({alerts.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                      : alert.severity === 'HIGH'
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{alert.title}</span>
                    <StatusBadge status={alert.severity} size="sm" />
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-400">
                    <span>{alert.timestamp}</span>
                    <button
                      onClick={() => PharmacyService.resolveAlert(alert.id)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {inspectReceipt && (
        <Modal
          isOpen={!!inspectReceipt}
          onClose={() => setInspectReceipt(null)}
          title={`Receipt: ${inspectReceipt.prescriptionId}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="text-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="font-bold text-sm text-zinc-900 dark:text-white font-sans">
                Pharmacy Dispensary Receipt
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                Token: {inspectReceipt.dispensingToken}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300 text-[11px]">
              <div>Patient: {inspectReceipt.patientName}</div>
              <div>Rx: {inspectReceipt.prescriptionId}</div>
              <div>Date: {inspectReceipt.dispensedAt}</div>
              <div>Total: ₹{inspectReceipt.totalAmount.toFixed(2)}</div>
            </div>

            <div className="py-2 border-t border-b border-zinc-200 dark:border-zinc-800 space-y-1">
              {inspectReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-zinc-800 dark:text-zinc-200">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold text-sm text-zinc-900 dark:text-white">
              <span>Total Paid:</span>
              <span className="text-emerald-600 dark:text-emerald-400">₹{inspectReceipt.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectReceipt(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
