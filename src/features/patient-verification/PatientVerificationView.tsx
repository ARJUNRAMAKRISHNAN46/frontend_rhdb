import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Shield,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ArrowRight,
  HeartPulse,
  Info,
  Clock,
  IdCard,
  RotateCcw,
  Check,
  Building,
  User,
  Lock,
} from 'lucide-react';
import { ActiveSection, Patient, Prescription } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';

interface PatientVerificationViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
  selectedId?: string;
}

export const PatientVerificationView: React.FC<PatientVerificationViewProps> = ({
  onNavigate,
  selectedId,
}) => {
  const [prescriptions, setPrescriptions] = useState(PharmacyService.getPrescriptions());
  const [patients, setPatients] = useState(PharmacyService.getPatients());
  const [searchQuery, setSearchQuery] = useState(selectedId || 'RX-94821');

  const [activeRx, setActiveRx] = useState<Prescription | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  // Verification method simulation state
  const [method, setMethod] = useState<'OTP' | 'MANUAL_ID'>('OTP');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [idDocChecked, setIdDocChecked] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<{
    method: string;
    timestamp: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setPatients(PharmacyService.getPatients());
    });
    return unsub;
  }, []);

  // Sync active prescription and patient
  useEffect(() => {
    const clean = searchQuery.trim().toUpperCase();
    const rx = prescriptions.find(
      (p) =>
        p.id.toUpperCase() === clean ||
        p.patientId.toUpperCase() === clean ||
        p.patientName.toUpperCase().includes(clean)
    );

    if (rx) {
      setActiveRx(rx);
      const pat = patients.find((p) => p.id === rx.patientId);
      setActivePatient(pat || null);

      const isVerified =
        rx.status === 'PATIENT_VERIFIED' ||
        rx.status === 'VERIFIED' ||
        rx.status === 'MEDICINE_VERIFIED' ||
        rx.status === 'DISPENSED' ||
        Boolean(rx.verifiedPatientAt);

      setVerificationSuccess(isVerified);
      if (isVerified) {
        setVerificationDetails({
          method: 'Simulated National Health Registry OTP',
          timestamp: rx.verifiedPatientAt || '2026-10-26 10:14:22',
          token: `SIM-AUTH-${rx.patientId.slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        });
      } else {
        setVerificationDetails(null);
      }
    } else {
      const pat = patients.find(
        (p) =>
          p.id.toUpperCase() === clean ||
          p.nationalHealthId.toUpperCase().includes(clean) ||
          p.name.toUpperCase().includes(clean)
      );
      setActivePatient(pat || null);
      if (pat) {
        const matchingRx = prescriptions.find((p) => p.patientId === pat.id);
        setActiveRx(matchingRx || null);
      }
    }
  }, [searchQuery, prescriptions, patients]);

  // Allergy cross-reference engine
  const allergyConflicts = React.useMemo(() => {
    if (!activePatient || !activeRx) return [];
    const conflicts: string[] = [];

    activePatient.allergies.forEach((allergy) => {
      activeRx.items.forEach((item) => {
        const itemLower = item.name.toLowerCase();
        const allergyLower = allergy.toLowerCase();
        if (
          itemLower.includes(allergyLower) ||
          (allergyLower === 'penicillin' &&
            (itemLower.includes('amoxicillin') || itemLower.includes('augmentin'))) ||
          (allergyLower === 'nsaid' &&
            (itemLower.includes('ibuprofen') || itemLower.includes('aspirin')))
        ) {
          conflicts.push(`Documented Allergy "${allergy}" conflicts with prescribed "${item.name}"`);
        }
      });
    });

    return conflicts;
  }, [activePatient, activeRx]);

  const handleSendSimulatedOtp = () => {
    setOtpSent(true);
    setOtpCode('4821'); // Seeded demo OTP
  };

  const handleVerifyOtp = () => {
    if (otpCode !== '4821') {
      alert('Invalid OTP code. In prototype simulation mode, please enter seeded demo code 4821.');
      return;
    }
    executeVerification('Simulated ABHA Mobile OTP (Demo Token #4821)');
  };

  const handleVerifyManualId = () => {
    if (!idDocChecked) {
      alert('Please check the confirmation box indicating physical ID verification before proceeding.');
      return;
    }
    executeVerification('Pharmacist In-Person Government Photo ID Confirmation');
  };

  const executeVerification = (authMethodStr: string) => {
    if (!activeRx || !activePatient) return;
    PharmacyService.verifyPatient(activePatient.id, activeRx.id, authMethodStr);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setVerificationSuccess(true);
    setVerificationDetails({
      method: authMethodStr,
      timestamp: now,
      token: `SIM-AUTH-${activePatient.id.slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    });
  };

  const handleResetVerification = () => {
    if (!activeRx) return;
    PharmacyService.updatePrescriptionStatus(activeRx.id, 'PENDING', 'Verification reset for demo re-testing');
    setVerificationSuccess(false);
    setVerificationDetails(null);
    setOtpSent(false);
    setOtpCode('');
    setIdDocChecked(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Search Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Patient Identity Verification
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Mandatory verification step before medication dispensing per RHDB safety protocols
          </p>
        </div>

        {/* Prescription Selection Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Select Rx in Queue:</label>
          <select
            value={activeRx?.id || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Explicit Prototype Simulation Notice */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 dark:text-amber-400">
            Prototype Simulation Mode
          </span>
          <p className="text-[11px] leading-relaxed">
            Patient identity verification is simulated using seeded demographic profiles and simulated OTP confirmation.
            This prototype does not perform real-world queries against UIDAI Aadhaar biometrics or live ABHA government servers.
          </p>
        </div>
      </div>

      {!activeRx && !activePatient ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs shadow-xs">
          <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          No prescription selected. Select an Rx from the dropdown above to verify patient identity.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Patient Profile & Health Card */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                    {activePatient?.id}
                  </span>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    {activePatient?.name}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {activePatient?.gender}, {activePatient?.age} years • DOB: {activePatient?.dob}
                  </p>
                </div>

                {verificationSuccess ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Unverified
                  </span>
                )}
              </div>

              {/* National Health ID Card */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                  <span>NATIONAL HEALTH ID (ABHA)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    REGISTRY REF
                  </span>
                </div>
                <p className="text-zinc-900 dark:text-zinc-200 font-bold tracking-wider">
                  {activePatient?.nationalHealthId}
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans">
                  Phone: {activePatient?.phone}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-sans truncate">
                  Address: {activePatient?.address}
                </p>
              </div>

              {/* Documented Allergies & Chronic Conditions */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  Documented Allergies
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient?.allergies.length === 0 ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      No known drug allergies reported.
                    </span>
                  ) : (
                    activePatient?.allergies.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-medium"
                      >
                        ⚠️ {allergy}
                      </span>
                    ))
                  )}
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    Chronic Conditions:
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {activePatient?.chronicConditions.join(', ') || 'None recorded'}
                  </p>
                </div>
              </div>
            </div>

            {/* Allergy Cross-Reference Alert Banner */}
            {allergyConflicts.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 space-y-2 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Severe Clinical Conflict Detected
                </div>
                {allergyConflicts.map((conflict, idx) => (
                  <p key={idx} className="text-xs font-medium leading-relaxed">
                    • {conflict}
                  </p>
                ))}
                <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80">
                  Pharmacist clinical review mandated before allowing dispensing.
                </p>
              </div>
            )}
          </div>

          {/* Right 2 Columns: Verification Console */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Prescription Link Box */}
            {activeRx && (
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      Prescription Ref: {activeRx.id}
                    </span>
                    <StatusBadge status={activeRx.status} size="sm" />
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Doctor: {activeRx.doctorName} ({activeRx.hospital}) • Issued: {activeRx.dateIssued}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('prescriptions', activeRx.id)}
                >
                  View Details
                </Button>
              </div>
            )}

            {/* Verification Station Container */}
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    Patient Identity Verification Step
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Verify patient recipient identity before granting dispensing authorization.
                  </p>
                </div>

                {verificationSuccess && (
                  <button
                    onClick={handleResetVerification}
                    title="Reset verification for testing"
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-test
                  </button>
                )}
              </div>

              {/* Status Indicator Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  verificationSuccess
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {verificationSuccess ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {verificationSuccess
                        ? 'Patient Identity Authenticated'
                        : 'Patient Identity Unverified'}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                      {verificationSuccess
                        ? `Verified via ${verificationDetails?.method || 'OTP Token'} • Auth Ref: ${verificationDetails?.token}`
                        : 'Dispensing blocked until identity confirmation action is executed.'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {verificationSuccess ? 'STATUS: VERIFIED' : 'STATUS: UNVERIFIED'}
                  </span>
                </div>
              </div>

              {/* Simulation Action Box */}
              {!verificationSuccess && (
                <div className="space-y-4">
                  {/* Mode Selector Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => setMethod('OTP')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                        method === 'OTP'
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      Option A: Simulated Mobile OTP
                    </button>
                    <button
                      onClick={() => setMethod('MANUAL_ID')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all ${
                        method === 'MANUAL_ID'
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <IdCard className="w-4 h-4" />
                      Option B: In-Person Photo ID
                    </button>
                  </div>

                  {/* Option A: Simulated Mobile OTP */}
                  {method === 'OTP' && (
                    <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                            Simulated SMS Verification Code
                          </h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Simulates sending a 4-digit token to patient linked mobile ({activePatient?.phone}).
                          </p>
                        </div>
                        {!otpSent && (
                          <Button size="sm" variant="outline" onClick={handleSendSimulatedOtp}>
                            Generate Simulated OTP
                          </Button>
                        )}
                      </div>

                      {otpSent && (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              maxLength={4}
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              placeholder="4821"
                              className="w-32 px-4 py-2 text-center font-mono text-lg font-bold tracking-widest bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                            />
                            <Button size="md" variant="primary" onClick={handleVerifyOtp}>
                              Confirm Verification
                            </Button>
                          </div>
                          <p className="text-[11px] text-zinc-500">
                            Seeded demo code is{' '}
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              4821
                            </span>
                            . Click Confirm Verification to simulate authenticating the patient.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Option B: In-Person Photo ID Confirmation */}
                  {method === 'MANUAL_ID' && (
                    <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                          Pharmacist In-Person Physical Inspection
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Inspect Government photo identification (Aadhaar, Passport, or Driver's License)
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 text-xs space-y-2 border border-zinc-200 dark:border-zinc-800">
                        <label className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={idDocChecked}
                            onChange={(e) => setIdDocChecked(e.target.checked)}
                            className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium">
                            I confirm physical inspection of patient ID matching {activePatient?.name} (DOB: {activePatient?.dob})
                          </span>
                        </label>
                      </div>

                      <Button
                        variant="primary"
                        size="md"
                        disabled={!idDocChecked}
                        onClick={handleVerifyManualId}
                      >
                        Confirm In-Person Verification
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Once Verified: Next Actions */}
              {verificationSuccess && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Patient is Verified & Approved for Dispensing
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Prescription status updated to Verified in registry.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('prescriptions')}
                    >
                      Back to Queue
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => activeRx && onNavigate('medicine-verification', activeRx.id)}
                    >
                      Advance to Medicine Verification
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
