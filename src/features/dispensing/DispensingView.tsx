import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Printer,
  Shield,
} from 'lucide-react';
import { ActiveSection, DispenseRecord } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface DispensingViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
  selectedId?: string;
}

export const DispensingView: React.FC<DispensingViewProps> = ({
  onNavigate,
  selectedId,
}) => {
  const [prescriptions, setPrescriptions] = useState(PharmacyService.getPrescriptions());
  const [batches, setBatches] = useState(PharmacyService.getBatches());
  const [activeRxId, setActiveRxId] = useState<string>(selectedId || '');

  const [counselingGiven, setCounselingGiven] = useState(true);
  const [controlledSubstanceAcknowledged, setControlledSubstanceAcknowledged] = useState(false);
  const [dispenseNotes, setDispenseNotes] = useState('');

  const [completedRecord, setCompletedRecord] = useState<DispenseRecord | null>(null);

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setBatches(PharmacyService.getBatches());
    });
    return unsub;
  }, []);

  const activeRx = prescriptions.find((p) => p.id === activeRxId) || prescriptions[0];
  const hasControlledSubstance = activeRx?.items.some((i) => i.isControlled);

  const handleDispense = () => {
    if (!activeRx) return;
    if (hasControlledSubstance && !controlledSubstanceAcknowledged) {
      alert('Mandatory: Please acknowledge Schedule H1 regulatory requirements before dispensing.');
      return;
    }

    const result = PharmacyService.dispensePrescription(
      activeRx.id,
      counselingGiven,
      'PHARM-STATION-BLR-01',
      dispenseNotes
    );

    if (result.success && result.record) {
      setCompletedRecord(result.record);
    } else {
      alert(result.error || 'Failed to dispense prescription.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Dispensing Terminal</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Final stage authorization, inventory deduction, and cryptographic token issuance
          </p>
        </div>

        {/* Prescription Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Select Rx in Queue:</label>
          <select
            value={activeRx?.id || ''}
            onChange={(e) => setActiveRxId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          >
            {prescriptions.map((rx) => (
              <option key={rx.id} value={rx.id}>
                {rx.id} - {rx.patientName} ({rx.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!activeRx ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs shadow-xs">
          No prescription available for dispensing.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Dispensing Console */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
              {/* Prescription Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {activeRx.id}
                    </span>
                    <StatusBadge status={activeRx.status} />
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                    Patient: <span className="font-semibold text-zinc-900 dark:text-white">{activeRx.patientName}</span> ({activeRx.patientAge}y, {activeRx.patientGender}) • ID: {activeRx.patientId}
                  </p>
                </div>

                <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{activeRx.doctorName}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{activeRx.hospital}</p>
                </div>
              </div>

              {/* Multi-Point Safety Gate Checklist */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  RHDB Pre-Dispensing Security Checklist
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Gate 1 */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">1. Patient ID</span>
                      {activeRx.status === 'PATIENT_VERIFIED' ||
                      activeRx.status === 'MEDICINE_VERIFIED' ||
                      activeRx.status === 'DISPENSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                      {activeRx.status === 'PENDING' ? 'Unverified' : 'Authenticated'}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">ABHA National ID token</p>
                  </div>

                  {/* Gate 2 */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">2. Doctor Signature</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Valid Key Match</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Medical Council verified</p>
                  </div>

                  {/* Gate 3 */}
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">3. Medicine Batches</span>
                      {activeRx.status === 'MEDICINE_VERIFIED' || activeRx.status === 'DISPENSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                      {activeRx.status === 'MEDICINE_VERIFIED' || activeRx.status === 'DISPENSED'
                        ? '100% Genuine'
                        : 'Review Required'}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">No counterfeit flags</p>
                  </div>
                </div>
              </div>

              {/* Items to Dispense & Inventory Impact Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Medicines to Dispense & Stock Allocation
                </h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3">Allocated Batch</th>
                        <th className="p-3 text-center">Dispensing Qty</th>
                        <th className="p-3">Current Stock</th>
                        <th className="p-3 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      {activeRx.items.map((item, idx) => {
                        const matchingBatch = batches.find((b) => b.medicineId === item.medicineId);
                        const currentStock = matchingBatch ? matchingBatch.stockQuantity : 0;
                        const remainingAfter = Math.max(0, currentStock - item.quantity);
                        return (
                          <tr key={idx} className="bg-white dark:bg-zinc-900/40">
                            <td className="p-3">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-200">{item.name}</p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{item.dosage} • {item.frequency}</p>
                            </td>
                            <td className="p-3 font-mono text-zinc-700 dark:text-zinc-300">
                              {matchingBatch?.batchNumber || 'AUTO-SELECT'}
                            </td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {item.quantity}
                            </td>
                            <td className="p-3">
                              <span className="text-zinc-800 dark:text-zinc-300">{currentStock}</span>
                              <span className="text-zinc-400 dark:text-zinc-500 text-[10px] ml-1">
                                &rarr; {remainingAfter} left
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-zinc-800 dark:text-zinc-300">
                              ₹{matchingBatch?.unitPrice ? (matchingBatch.unitPrice * item.quantity).toFixed(2) : '--'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Controlled Substance Warning & Acknowledgment */}
              {hasControlledSubstance && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Schedule H1 Controlled Substance Notice
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    This prescription contains high-risk / controlled medications. Regulatory register log must be countersigned.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={controlledSubstanceAcknowledged}
                      onChange={(e) => setControlledSubstanceAcknowledged(e.target.checked)}
                      className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>I verify doctor prescription authenticity and confirm Schedule H1 ledger recording.</span>
                  </label>
                </div>
              )}

              {/* Pharmacist Counseling Checkbox & Notes */}
              <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="flex items-center gap-2 text-xs text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={counselingGiven}
                    onChange={(e) => setCounselingGiven(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Mandatory Patient Counseling Provided (dosage timing, food instructions, potential side effects disclosed)
                  </span>
                </label>

                <div>
                  <label className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    Pharmacist Session Notes (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Advised patient regarding morning administration..."
                    value={dispenseNotes}
                    onChange={(e) => setDispenseNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Final Action Button */}
              <div className="pt-2">
                <Button
                  variant="success"
                  size="lg"
                  className="w-full"
                  disabled={activeRx.status === 'DISPENSED' || activeRx.status === 'REJECTED'}
                  onClick={handleDispense}
                >
                  {activeRx.status === 'DISPENSED'
                    ? 'Already Dispensed'
                    : 'Authorize & Complete Dispensing'}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Station & Regulatory Info */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs text-xs">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Dispensing Authorization
              </h3>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 space-y-2 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">DISPENSARY:</span>
                  <span className="text-zinc-800 dark:text-zinc-300">Station BLR-01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PHARMACIST:</span>
                  <span className="text-zinc-800 dark:text-zinc-300">Rajesh Kumar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">REGISTRATION:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">KMC-88291</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">NODE STATUS:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">RHDB SECURE SYNC</span>
                </div>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                Dispensing this prescription creates an immutable record on the RHDB network,
                burns the prescription authorization token, and prevents duplicate dispensing across
                any national pharmacy network.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dispensing Completed Token & Receipt Modal */}
      {completedRecord && (
        <Modal
          isOpen={!!completedRecord}
          onClose={() => setCompletedRecord(null)}
          title="Dispensing Complete & Verified"
          description={`Cryptographic Verification Token Issued • ${completedRecord.dispensedAt}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Prescription Successfully Dispensed</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Stock has been deducted from inventory and audit trail recorded.
              </p>
            </div>

            {/* Token Certificate */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 text-[11px]">
                <span className="text-zinc-500 dark:text-zinc-400">RHDB DISPENSING TOKEN:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{completedRecord.dispensingToken}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-700 dark:text-zinc-300">
                <div>Patient: {completedRecord.patientName}</div>
                <div>Rx ID: {completedRecord.prescriptionId}</div>
                <div>Record ID: {completedRecord.id}</div>
                <div>Timestamp: {completedRecord.dispensedAt}</div>
              </div>

              {/* Items List */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase">Items Dispensed:</span>
                <ul className="mt-1 space-y-1 text-zinc-800 dark:text-zinc-200">
                  {completedRecord.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>• {i.name} (Batch {i.batchNumber})</span>
                      <span className="font-bold">x{i.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print Patient Receipt
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setCompletedRecord(null);
                  onNavigate('dispensing-history');
                }}
              >
                View in Dispensing History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
