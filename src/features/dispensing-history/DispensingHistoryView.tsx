import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
} from 'lucide-react';
import { ActiveSection, DispenseRecord } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface DispensingHistoryViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
  selectedId?: string;
}

export const DispensingHistoryView: React.FC<DispensingHistoryViewProps> = ({
  selectedId,
}) => {
  const [records, setRecords] = useState(PharmacyService.getDispenseRecords());
  const [searchQuery, setSearchQuery] = useState(selectedId || '');
  const [inspectRecord, setInspectRecord] = useState<DispenseRecord | null>(null);

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setRecords(PharmacyService.getDispenseRecords());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedId) {
      setSearchQuery(selectedId);
    }
  }, [selectedId]);

  const filteredRecords = records.filter((rec) => {
    return (
      rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.prescriptionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.dispensingToken.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Dispensing History</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Fulfilled prescriptions and verification tokens
          </p>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Record ID, Rx ID, Token, or Patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* History Records Table */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/90 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Prescription & Patient</th>
                <th className="py-3 px-4">Items Dispensed</th>
                <th className="py-3 px-4">Verification Token</th>
                <th className="py-3 px-4">Dispensed At</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                    No dispensing history records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    onClick={() => setInspectRecord(rec)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                      {rec.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {rec.prescriptionId}
                      </div>
                      <div className="text-[11px] text-zinc-700 dark:text-zinc-300">{rec.patientName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-zinc-900 dark:text-zinc-200 font-medium">
                        {rec.items.length} item(s)
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                        {rec.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {rec.dispensingToken}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {rec.dispensedAt}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                      ₹{rec.totalAmount.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Printer className="w-3.5 h-3.5" />}
                        onClick={() => setInspectRecord(rec)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {inspectRecord && (
        <Modal
          isOpen={!!inspectRecord}
          onClose={() => setInspectRecord(null)}
          title={`Dispensing Receipt: ${inspectRecord.id}`}
          description={`Prescription ${inspectRecord.prescriptionId} • ${inspectRecord.dispensedAt}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs font-mono">
            {/* Header */}
            <div className="text-center pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-1">
              <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-sans">
                RHDB CERTIFIED PHARMACY DISPENSARY
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-sans">
                Station BLR-01 • Reg License KMC-88291
              </p>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                TOKEN: {inspectRecord.dispensingToken}
              </div>
            </div>

            {/* Patient & Prescription Info */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-700 dark:text-zinc-300">
              <div>Patient: {inspectRecord.patientName}</div>
              <div>Patient ID: {inspectRecord.patientId}</div>
              <div>Rx Ref: {inspectRecord.prescriptionId}</div>
              <div>Date: {inspectRecord.dispensedAt}</div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-t border-b border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-500 dark:text-zinc-400 text-[10px] uppercase">
                <span>Description</span>
                <span>Total (INR)</span>
              </div>
              {inspectRecord.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-zinc-800 dark:text-zinc-200">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[10px] text-zinc-500">Batch: {item.batchNumber} • Qty: {item.quantity}</p>
                  </div>
                  <span>₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400 pt-1">
              <span>TOTAL PAID:</span>
              <span>₹{inspectRecord.totalAmount.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 space-y-1 font-sans">
              <p>✓ Patient verification confirmed via National Health Registry (ABHA)</p>
              <p>✓ Medicine barcodes verified authentic on blockchain registry</p>
              <p>✓ Pharmacist counseling provided: Yes</p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setInspectRecord(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
