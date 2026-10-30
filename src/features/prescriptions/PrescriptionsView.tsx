import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  Lock,
  User,
  Stethoscope,
  Info,
  Check,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
  PackageCheck,
} from 'lucide-react';
import { Prescription, ActiveSection } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface PrescriptionsViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
  selectedId?: string;
}

export const PrescriptionsView: React.FC<PrescriptionsViewProps> = ({
  onNavigate,
  selectedId,
}) => {
  const [prescriptions, setPrescriptions] = useState(PharmacyService.getPrescriptions());
  const [patients, setPatients] = useState(PharmacyService.getPatients());
  const [searchQuery, setSearchQuery] = useState(selectedId || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [inspectRx, setInspectRx] = useState<Prescription | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Integrated Patient Verification Modal state
  const [verifyPatientRx, setVerifyPatientRx] = useState<Prescription | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [idVerifiedCheck, setIdVerifiedCheck] = useState(false);
  const [patientVerifySuccess, setPatientVerifySuccess] = useState(false);

  // Integrated Dispensing Modal state
  const [dispenseRx, setDispenseRx] = useState<Prescription | null>(null);
  const [counselingGiven, setCounselingGiven] = useState(true);
  const [controlledSubstanceAck, setControlledSubstanceAck] = useState(false);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [dispenseSuccessRecord, setDispenseSuccessRecord] = useState<any | null>(null);

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setPatients(PharmacyService.getPatients());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedId) {
      setSearchQuery(selectedId);
      const match = prescriptions.find((p) => p.id === selectedId);
      if (match) setInspectRx(match);
    }
  }, [selectedId, prescriptions]);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    const patient = patients.find((p) => p.id === rx.patientId);
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query ||
      rx.id.toLowerCase().includes(query) ||
      rx.patientName.toLowerCase().includes(query) ||
      rx.patientId.toLowerCase().includes(query) ||
      rx.doctorName.toLowerCase().includes(query) ||
      rx.hospital.toLowerCase().includes(query) ||
      rx.items.some((item) => item.name.toLowerCase().includes(query)) ||
      (patient && patient.phone.toLowerCase().includes(query));

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'VERIFIED') {
        matchesStatus =
          rx.status === 'VERIFIED' ||
          rx.status === 'PATIENT_VERIFIED' ||
          rx.status === 'MEDICINE_VERIFIED';
      } else {
        matchesStatus = rx.status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const handleReject = () => {
    if (!inspectRx) return;
    PharmacyService.updatePrescriptionStatus(
      inspectRx.id,
      'REJECTED',
      rejectReason || 'Discrepancy identified by pharmacist'
    );
    setShowRejectModal(false);
    setInspectRx(null);
    setRejectReason('');
  };

  const eligibility = inspectRx ? PharmacyService.validateDispenseEligibility(inspectRx.id) : null;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Prescriptions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Active patient prescriptions and verification queue
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Rx ID, patient, doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 ml-1.5 shrink-0" />
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'VERIFIED', label: 'Verified' },
              { id: 'DISPENSED', label: 'Dispensed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescription List Table */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-2.5 px-3.5">Rx ID</th>
                <th className="py-2.5 px-3.5">Patient</th>
                <th className="py-2.5 px-3.5">Doctor</th>
                <th className="py-2.5 px-3.5">Prescribed Medicines</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                    No prescriptions found.
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((rx) => (
                  <tr
                    key={rx.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    onClick={() => setInspectRx(rx)}
                  >
                    <td className="py-2.5 px-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {rx.id}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {rx.patientName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {rx.patientGender}, {rx.patientAge}y
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 text-zinc-600 dark:text-zinc-300">
                      <div>{rx.doctorName}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">{rx.hospital}</div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                        {rx.items.length} item{rx.items.length === 1 ? '' : 's'}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                        {rx.items.map((i) => i.name).join(', ')}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <StatusBadge status={rx.status} size="sm" />
                    </td>

                    <td className="py-2.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInspectRx(rx)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {inspectRx && (
        <Modal
          isOpen={!!inspectRx}
          onClose={() => setInspectRx(null)}
          title={`Prescription: ${inspectRx.id}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Dr. {inspectRx.doctorName} ({inspectRx.doctorLicense}) &bull; {inspectRx.hospital}
                </span>
              </div>
              <StatusBadge status={inspectRx.status} size="sm" />
            </div>

            {/* Validation alerts if any */}
            {eligibility && (eligibility.errors.length > 0 || eligibility.warnings.length > 0) && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 space-y-1">
                {eligibility.errors.map((err, idx) => (
                  <p key={idx} className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    {err}
                  </p>
                ))}
                {eligibility.warnings.map((warn, idx) => (
                  <p key={idx} className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {warn}
                  </p>
                ))}
              </div>
            )}

            {/* Patient Details */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Patient</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{inspectRx.patientName}</p>
                <p className="text-zinc-500">{inspectRx.patientGender}, {inspectRx.patientAge} years old</p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-semibold">Diagnosis</span>
                <p className="text-zinc-800 dark:text-zinc-200">{inspectRx.diagnosis}</p>
                <p className="text-zinc-500">Date: {inspectRx.dateIssued}</p>
              </div>
            </div>

            {/* Prescribed Items */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-semibold">
                  <tr>
                    <th className="p-2.5">Medicine</th>
                    <th className="p-2.5">Dosage</th>
                    <th className="p-2.5">Duration</th>
                    <th className="p-2.5">Qty</th>
                    <th className="p-2.5">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {inspectRx.items.map((item, idx) => (
                    <tr key={idx} className="bg-white dark:bg-zinc-900">
                      <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-200">
                        {item.name}
                        {item.isControlled && (
                          <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                            Schedule H1
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-zinc-600 dark:text-zinc-300">{item.dosage}</td>
                      <td className="p-2.5 text-zinc-600 dark:text-zinc-300">{item.duration}</td>
                      <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">{item.quantity}</td>
                      <td className="p-2.5 text-zinc-500">{item.instructions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                disabled={inspectRx.status === 'DISPENSED' || inspectRx.status === 'REJECTED'}
              >
                Reject
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setInspectRx(null)}>
                  Close
                </Button>

                {inspectRx.status === 'PENDING' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const rxToVerify = inspectRx;
                      setInspectRx(null);
                      setVerifyPatientRx(rxToVerify);
                      setOtpCode('4821');
                      setOtpError(null);
                      setIdVerifiedCheck(true);
                      setPatientVerifySuccess(false);
                    }}
                  >
                    Verify Patient
                  </Button>
                )}

                {(inspectRx.status === 'PATIENT_VERIFIED' || inspectRx.status === 'VERIFIED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const id = inspectRx.id;
                      setInspectRx(null);
                      onNavigate('medicine-verification', id);
                    }}
                  >
                    Scan Medicines
                  </Button>
                )}

                {inspectRx.status === 'MEDICINE_VERIFIED' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const rxToDispense = inspectRx;
                      setInspectRx(null);
                      setDispenseRx(rxToDispense);
                      setCounselingGiven(true);
                      setControlledSubstanceAck(false);
                      setDispenseNotes('');
                      setDispenseError(null);
                      setDispenseSuccessRecord(null);
                    }}
                  >
                    Dispense
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject Prescription"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Reason
              </label>
              <textarea
                rows={3}
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Integrated Modal: Patient Verification */}
      {verifyPatientRx && (
        <Modal
          isOpen={!!verifyPatientRx}
          onClose={() => setVerifyPatientRx(null)}
          title={`Verify Patient: ${verifyPatientRx.patientName}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Age / Gender</span>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {verifyPatientRx.patientAge}y, {verifyPatientRx.patientGender}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 uppercase">Prescription</span>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {verifyPatientRx.id}
                </p>
              </div>
            </div>

            {!patientVerifySuccess ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Verification OTP
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-3 py-1.5 font-mono text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {otpError && <p className="text-[10px] text-rose-600 mt-1">{otpError}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="idVerifiedCheck"
                    checked={idVerifiedCheck}
                    onChange={(e) => setIdVerifiedCheck(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="idVerifiedCheck" className="text-xs text-zinc-700 dark:text-zinc-300">
                    Patient ID inspected and confirmed
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => setVerifyPatientRx(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      PharmacyService.verifyPatient(
                        verifyPatientRx.patientId,
                        verifyPatientRx.id,
                        'OTP'
                      );
                      setPatientVerifySuccess(true);
                      setTimeout(() => {
                        const id = verifyPatientRx.id;
                        setVerifyPatientRx(null);
                        onNavigate('medicine-verification', id);
                      }, 600);
                    }}
                  >
                    Confirm & Proceed
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-emerald-600 dark:text-emerald-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="font-semibold text-sm">Patient Verified</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Integrated Modal: Dispensing Order */}
      {dispenseRx && (
        <Modal
          isOpen={!!dispenseRx}
          onClose={() => setDispenseRx(null)}
          title={`Dispense Order: ${dispenseRx.id}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {!dispenseSuccessRecord ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Patient:</span>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{dispenseRx.patientName}</p>
                  <p className="text-zinc-500 mt-1">{dispenseRx.items.length} item(s) to dispense</p>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={counselingGiven}
                      onChange={(e) => setCounselingGiven(e.target.checked)}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300">Patient counseling completed</span>
                  </label>

                  {dispenseRx.items.some((i) => i.isControlled) && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={controlledSubstanceAck}
                        onChange={(e) => setControlledSubstanceAck(e.target.checked)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">Schedule H1 register entry confirmed</span>
                    </label>
                  )}
                </div>

                {dispenseError && <p className="text-[11px] text-rose-600">{dispenseError}</p>}

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => setDispenseRx(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      const res = PharmacyService.dispensePrescription(
                        dispenseRx.id,
                        counselingGiven,
                        'PHARM-STATION-BLR-01',
                        dispenseNotes || 'Dispensed'
                      );
                      if (res.success && res.record) {
                        setDispenseSuccessRecord(res.record);
                      } else {
                        setDispenseError(res.error || 'Dispense failed');
                      }
                    }}
                  >
                    Confirm Dispense
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white">Order Dispensed</h4>
                  <p className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-xs mt-1">
                    Token: {dispenseSuccessRecord.dispensingToken}
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const id = dispenseRx.id;
                      setDispenseRx(null);
                      onNavigate('dispensing-history', id);
                    }}
                  >
                    View in History
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setDispenseRx(null)}>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
