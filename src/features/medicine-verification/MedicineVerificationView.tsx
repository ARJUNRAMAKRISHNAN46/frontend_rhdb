import React, { useState, useEffect, useRef } from 'react';
import {
  ScanLine,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  QrCode,
  ArrowRight,
  Boxes,
  FileCheck,
  Camera,
  Search,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  PackageCheck,
  Layers,
  Factory,
  Pill,
  Sparkles,
} from 'lucide-react';
import {
  ActiveSection,
  MedicineBatch,
  MedicineProduct,
  Prescription,
  PrescriptionItem,
  MedicineVerificationDetail,
} from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { MedicineCatalogService } from '@/services/medicineCatalogService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface MedicineVerificationViewProps {
  onNavigate: (section: ActiveSection, contextId?: string) => void;
  selectedId?: string;
}

export const MedicineVerificationView: React.FC<MedicineVerificationViewProps> = ({
  onNavigate,
  selectedId,
}) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(
    PharmacyService.getPrescriptions()
  );
  const [activeRxId, setActiveRxId] = useState<string>(selectedId || 'RX-94821');
  const [activeRx, setActiveRx] = useState<Prescription | null>(null);
  const [selectedPrescribedItem, setSelectedPrescribedItem] = useState<PrescriptionItem | null>(null);

  // Scanner Mode: 'camera' | 'manual'
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');

  // Input queries
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MedicineProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Active validation comparison result
  const [verificationResult, setVerificationResult] = useState<MedicineVerificationDetail | null>(null);

  // Verified items map for current prescription
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>({});

  // Integrated Dispense Modal state
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [counselingGiven, setCounselingGiven] = useState(true);
  const [controlledSubstanceAck, setControlledSubstanceAck] = useState(false);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispenseError, setDispenseError] = useState<string | null>(null);
  const [dispenseSuccessRecord, setDispenseSuccessRecord] = useState<any | null>(null);

  // Camera scanner states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Batches in inventory
  const [batches, setBatches] = useState<MedicineBatch[]>(PharmacyService.getBatches());

  // Subscribe to pharmacy service
  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setBatches(PharmacyService.getBatches());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedId) {
      setActiveRxId(selectedId);
    }
  }, [selectedId]);

  // Update active prescription when selection changes
  useEffect(() => {
    const rx = prescriptions.find((p) => p.id === activeRxId) || prescriptions[0] || null;
    setActiveRx(rx);
    if (rx) {
      if (rx.items.length > 0) {
        setSelectedPrescribedItem(rx.items[0]);
      }
      if (rx.status === 'MEDICINE_VERIFIED' || rx.status === 'DISPENSED') {
        const allVerified: Record<string, boolean> = {};
        rx.items.forEach((item) => {
          allVerified[item.medicineId] = true;
        });
        setVerifiedItems(allVerified);
      } else {
        setVerifiedItems({});
      }
    }
    setVerificationResult(null);
  }, [activeRxId, prescriptions]);

  // Handle Search input change with debounce-like behavior
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = MedicineCatalogService.searchMedicines(searchQuery);
    setSearchResults(results.slice(0, 6));
  }, [searchQuery]);

  // Camera Stream Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser mediaDevices API not supported in this environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access unavailable:', err);
      setCameraError(
        'Webcam access unavailable or permission not granted. Use the optical scanner simulator or manual lookup below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [scanMode]);

  // Core verification dispatch
  const executeMedicineVerification = (query: string, targetItem?: PrescriptionItem) => {
    const itemToVerify = targetItem || selectedPrescribedItem;
    if (!itemToVerify) return;

    const result = MedicineCatalogService.compareAndValidateMedicine(
      query,
      itemToVerify,
      batches
    );
    setVerificationResult(result);

    // Log through PharmacyService audit log
    if (result.outcome === 'SUCCESS') {
      PharmacyService.addAuditLog(
        'MEDICINE_SCAN_AUTHENTIC',
        `Physical package verified: ${result.product?.name} (Barcode: ${result.product?.barcode}) matches Rx ${activeRx?.id} item ${itemToVerify.name} [Identity, Strength, Form Validated]`
      );
    } else if (result.outcome === 'UNKNOWN_BARCODE') {
      PharmacyService.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `Unregistered barcode scan attempt: "${query}" not recognized in National Formulary.`
      );
    } else if (result.outcome === 'UNAVAILABLE_PRODUCT') {
      PharmacyService.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `Flagged product scan: ${result.product?.name} (Batch: ${result.matchedBatch?.batchNumber}) - ${result.summary}`
      );
    } else {
      PharmacyService.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `CLINICAL MISMATCH ALERT on Rx ${activeRx?.id}: ${result.summary}`
      );
    }
  };

  const handleManualLookupSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    executeMedicineVerification(searchQuery);
    setIsSearching(false);
  };

  const handleSelectProductFromSearch = (product: MedicineProduct) => {
    setSearchQuery(product.barcode);
    setIsSearching(false);
    executeMedicineVerification(product.barcode);
  };

  // Simulate scanning a test target
  const handleSimulateScan = (barcode: string) => {
    setIsSimulatingScan(true);
    setSearchQuery(barcode);
    setTimeout(() => {
      setIsSimulatingScan(false);
      executeMedicineVerification(barcode);
    }, 450);
  };

  // Confirm verification of an item
  const handleConfirmItemVerified = () => {
    if (!verificationResult || !verificationResult.isMatch || !selectedPrescribedItem) return;
    setVerifiedItems((prev) => ({
      ...prev,
      [selectedPrescribedItem.medicineId]: true,
    }));

    // Auto-advance to next unverified item if any
    if (activeRx) {
      const remaining = activeRx.items.find(
        (i) => i.medicineId !== selectedPrescribedItem.medicineId && !verifiedItems[i.medicineId]
      );
      if (remaining) {
        setSelectedPrescribedItem(remaining);
      }
    }
  };

  // Quarantine recalled/suspicious batch
  const handleQuarantine = () => {
    if (!verificationResult?.matchedBatch) return;
    PharmacyService.quarantineBatch(
      verificationResult.matchedBatch.id,
      'Cryptographic registry checksum failure / Recalled stock'
    );
    setVerificationResult({
      ...verificationResult,
      outcome: 'UNAVAILABLE_PRODUCT',
      summary: 'Batch has been isolated into quarantine bin. Security report filed.',
    });
  };

  // Complete entire Rx verification
  const handleCompleteRxMedicineVerification = () => {
    if (!activeRx) return;
    PharmacyService.updatePrescriptionStatus(
      activeRx.id,
      'MEDICINE_VERIFIED',
      'All prescribed medicines physically scanned, validated for strength/form, and verified authentic'
    );
    setActiveRx((prev) => (prev ? { ...prev, status: 'MEDICINE_VERIFIED' } : null));
  };

  const allItemsVerified =
    activeRx && activeRx.items.length > 0 && activeRx.items.every((item) => verifiedItems[item.medicineId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Medicine Verification
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Verify barcode, dosage form, and strength against active prescription
          </p>
        </div>

        {/* Prescription Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            Prescription:
          </label>
          <select
            value={activeRxId}
            onChange={(e) => setActiveRxId(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono font-medium bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          >
            {prescriptions.map((rx) => (
              <option key={rx.id} value={rx.id}>
                {rx.id} — {rx.patientName} ({rx.items.length} items)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Scanner & Search Terminal */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-2xs">
            {/* Scanner Controls / Mode Selector */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Barcode Scanner
              </h3>

              {/* Mode Toggle Tabs */}
              <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    scanMode === 'camera'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Camera Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('manual')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    scanMode === 'manual'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Manual / Name Lookup
                </button>
              </div>
            </div>

            {/* TAB 1: Camera Scanner View */}
            {scanMode === 'camera' && (
              <div className="space-y-4">
                <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Camera className="w-10 h-10 text-zinc-600 mx-auto opacity-40 animate-pulse" />
                      <p className="text-xs text-zinc-400 max-w-sm">
                        {cameraError || 'Initializing camera stream...'}
                      </p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                      >
                        Retry Camera Access
                      </button>
                    </div>
                  )}

                  {/* Optical Targeting HUD Overlays */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
                    <div
                      className={`relative w-48 sm:w-64 h-32 border-2 rounded-lg transition-all ${
                        isSimulatingScan
                          ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : 'border-emerald-500/60'
                      }`}
                    >
                      {/* Laser Sweep Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-pulse top-1/2 -translate-y-1/2" />
                      <span className="absolute -top-6 left-0 text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider bg-zinc-950/80 px-2 py-0.5 rounded">
                        GS1 / EAN RETICLE
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-300 font-mono mt-3 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-700/60">
                      Align barcode or QR within box
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Optical Engine: Active
                  </span>
                  <span className="text-[11px]">Supports GS1-128, DataMatrix, GTIN-14, EAN-13</span>
                </div>
              </div>
            )}

            {/* TAB 2: Manual Barcode / Medicine Name Lookup Form */}
            <form onSubmit={handleManualLookupSubmit} className="space-y-2 relative">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Barcode Number, GTIN, or Medicine Name:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Barcode (e.g. 08901234500102) or Drug Name (e.g. Metformin)..."
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Button type="submit" variant="primary" size="md">
                  Verify Barcode
                </Button>
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {isSearching && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                  <div className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/60 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex justify-between">
                    <span>Verified Catalog Matches</span>
                    <span>Click to Scan</span>
                  </div>
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProductFromSearch(p)}
                      className="w-full px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/80 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {p.name} <span className="text-[11px] font-normal text-zinc-500">({p.dosageForm})</span>
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {p.genericName} • {p.manufacturer}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {p.barcode}
                        </span>
                        <p className="text-[10px] text-zinc-400">GTIN-14</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Sample Barcodes */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Sample Barcodes:
              </span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSimulateScan('08901234500102')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Metformin 500mg (Match)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('08901234500103')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Telmisartan 40mg (Match)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('08901234500202')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Metformin 1000mg (Potency Mismatch)
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateScan('08909999000123')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Unknown Barcode
                </button>
              </div>
            </div>
          </div>

          {/* Validation Comparison Result Card */}
          {verificationResult && (
            <div
              className={`p-5 rounded-xl border space-y-4 animate-in fade-in transition-all ${
                verificationResult.outcome === 'SUCCESS'
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/80'
                  : verificationResult.outcome === 'UNKNOWN_BARCODE'
                  ? 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700'
                  : verificationResult.outcome === 'UNAVAILABLE_PRODUCT'
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                  : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}
            >
              {/* Header Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {verificationResult.outcome === 'SUCCESS' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : verificationResult.outcome === 'UNKNOWN_BARCODE' ? (
                    <HelpCircle className="w-6 h-6 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                  ) : verificationResult.outcome === 'UNAVAILABLE_PRODUCT' ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        verificationResult.outcome === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : verificationResult.outcome === 'UNKNOWN_BARCODE'
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {verificationResult.outcome.replace('_', ' ')}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-1">
                      {verificationResult.summary}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      {verificationResult.recommendation}
                    </p>
                  </div>
                </div>

                {verificationResult.matchedBatch && (
                  <StatusBadge status={verificationResult.matchedBatch.authenticityStatus} />
                )}
              </div>

              {/* Scanned Physical Product Information Card */}
              {verificationResult.product && (
                <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Scanned Drug
                    </span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">
                      {verificationResult.product.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {verificationResult.product.brandName}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Potency & Form
                    </span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {verificationResult.product.strength}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {verificationResult.product.dosageForm}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Barcode / GTIN
                    </span>
                    <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {verificationResult.product.barcode}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Pack: {verificationResult.product.packageSize} units
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">
                      Manufacturer
                    </span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {verificationResult.product.manufacturer}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Batch: {verificationResult.matchedBatch?.batchNumber || 'Unassigned'}
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-Side Clinical Comparison Matrix */}
              {verificationResult.prescribedItem && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Clinical Comparison vs Prescribed Item ({verificationResult.prescribedItem.name})
                  </span>

                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-[10px] text-zinc-500 uppercase">
                        <tr>
                          <th className="py-2 px-3">Safety Parameter</th>
                          <th className="py-2 px-3">Prescription Requirement</th>
                          <th className="py-2 px-3">Scanned Physical Package</th>
                          <th className="py-2 px-3 text-right">Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {/* 1. Drug Identity */}
                        <tr>
                          <td className="py-2 px-3 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-zinc-400" />
                            Drug Identity
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {verificationResult.prescribedItem.name}
                          </td>
                          <td className="py-2 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {verificationResult.product?.name || 'Unrecognized Product'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {verificationResult.criteria.identityMatched ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5" /> Mismatch
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* 2. Strength */}
                        <tr>
                          <td className="py-2 px-3 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-zinc-400" />
                            Dosage Strength
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {verificationResult.prescribedItem.dosage}
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {verificationResult.product?.strength || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {verificationResult.criteria.strengthMatched ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" /> Potency Error
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* 3. Dosage Form */}
                        <tr>
                          <td className="py-2 px-3 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Boxes className="w-3.5 h-3.5 text-zinc-400" />
                            Dosage Form
                          </td>
                          <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100">
                            Solid Oral Form (Tablet)
                          </td>
                          <td className="py-2 px-3 text-zinc-900 dark:text-zinc-100">
                            {verificationResult.product?.dosageForm || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {verificationResult.criteria.dosageFormMatched ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Match
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-3.5 h-3.5" /> Form Error
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* 4. Quantity vs Stock */}
                        <tr>
                          <td className="py-2 px-3 font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
                            Stock Availability
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {verificationResult.prescribedItem.quantity} units needed
                          </td>
                          <td className="py-2 px-3 font-mono text-zinc-900 dark:text-zinc-100">
                            {verificationResult.matchedBatch
                              ? `${verificationResult.matchedBatch.stockQuantity} units available`
                              : '0 in stock'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {verificationResult.criteria.stockSufficient ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="w-3.5 h-3.5" /> Stock Deficit
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reasons & Clinical Notes */}
              <div className="space-y-1">
                {verificationResult.reasons.map((r, i) => (
                  <p key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    {r}
                  </p>
                ))}
              </div>

              {/* Verification Confirmation Actions */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                {verificationResult.outcome === 'SUCCESS' ? (
                  <Button
                    variant="success"
                    size="md"
                    className="w-full sm:w-auto"
                    icon={<ShieldCheck className="w-4 h-4" />}
                    onClick={handleConfirmItemVerified}
                  >
                    Confirm & Record Item Verification
                  </Button>
                ) : verificationResult.outcome === 'UNAVAILABLE_PRODUCT' &&
                  verificationResult.matchedBatch?.authenticityStatus === 'SUSPICIOUS' ? (
                  <Button
                    variant="danger"
                    size="md"
                    className="w-full sm:w-auto"
                    icon={<AlertOctagon className="w-4 h-4" />}
                    onClick={handleQuarantine}
                  >
                    Quarantine Suspicious Batch & File Incident
                  </Button>
                ) : (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" />
                    Dispensing blocked until correct medicine packaging is scanned.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Prescription Items & Dispensing Pre-flight */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Prescription Items Checklist
              </h3>
              {activeRx && <StatusBadge status={activeRx.status} size="sm" />}
            </div>

            {!activeRx ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-xs">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No prescription selected. Select an order above to verify prescribed medicines.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Patient Summary Header */}
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {activeRx.patientName} ({activeRx.patientAge}y, {activeRx.patientGender})
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500">{activeRx.id}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Diagnosis: {activeRx.diagnosis}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Doctor: {activeRx.doctorName} ({activeRx.hospital})
                  </p>
                </div>

                {/* Prescribed Items List */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Select Item to Verify:
                  </span>

                  {activeRx.items.map((item) => {
                    const isVerified = verifiedItems[item.medicineId];
                    const isSelected = selectedPrescribedItem?.medicineId === item.medicineId;

                    return (
                      <div
                        key={item.medicineId}
                        onClick={() => {
                          setSelectedPrescribedItem(item);
                          setVerificationResult(null);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 border-transparent shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        } ${
                          isVerified
                            ? 'bg-emerald-500/10'
                            : 'bg-white dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </span>
                          {isVerified ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              Pending Scan
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase">Potency:</span>{' '}
                            {item.dosage}
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 uppercase">Quantity:</span>{' '}
                            {item.quantity} units
                          </div>
                          <div className="col-span-2">
                            <span className="text-[10px] text-zinc-400 uppercase">Dosing:</span>{' '}
                            {item.frequency} ({item.duration})
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress & Next Step Workflow */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium">Verification Progress:</span>
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {Object.keys(verifiedItems).filter((k) => verifiedItems[k]).length} of{' '}
                      {activeRx.items.length} items verified
                    </span>
                  </div>

                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${
                          activeRx.items.length > 0
                            ? (Object.keys(verifiedItems).filter((k) => verifiedItems[k]).length /
                                activeRx.items.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  {activeRx.status === 'MEDICINE_VERIFIED' || allItemsVerified ? (
                    <div className="space-y-2 pt-2">
                      <Button
                        variant="success"
                        size="md"
                        className="w-full"
                        icon={<ArrowRight className="w-4 h-4" />}
                        onClick={() => {
                          setShowDispenseModal(true);
                          setCounselingGiven(true);
                          setControlledSubstanceAck(false);
                          setDispenseNotes('');
                          setDispenseError(null);
                          setDispenseSuccessRecord(null);
                        }}
                      >
                        Fulfill & Dispense Order
                      </Button>
                      <p className="text-[10px] text-center text-zinc-500">
                        Prescription order is fully authenticated and approved for final patient handover.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        disabled={!allItemsVerified}
                        onClick={handleCompleteRxMedicineVerification}
                      >
                        Scan All Prescribed Items First
                      </Button>
                      <p className="text-[10px] text-center text-zinc-500">
                        Dispensing is locked until all medicines pass barcode, strength, and identity checks.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Modal: Dispense Order */}
      {showDispenseModal && activeRx && (
        <Modal
          isOpen={showDispenseModal}
          onClose={() => setShowDispenseModal(false)}
          title={`Dispense Prescription: ${activeRx.id}`}
          description={`Patient: ${activeRx.patientName} (${activeRx.patientAge}y, ${activeRx.patientGender}) • Doctor: ${activeRx.doctorName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {dispenseError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                {dispenseError}
              </div>
            )}

            {!dispenseSuccessRecord ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Verified Medicines Being Dispensed:
                  </span>
                  <div className="mt-1 divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                    {activeRx.items.map((item) => (
                      <div key={item.medicineId} className="p-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            {item.name}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {item.dosage} • {item.frequency} ({item.duration})
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.quantity} units
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="medDispenseCounseling"
                      checked={counselingGiven}
                      onChange={(e) => setCounselingGiven(e.target.checked)}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="medDispenseCounseling" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Mandatory Clinical Counseling Completed
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-500 pl-5">
                    Patient counselled on dosing schedule, frequency, and food interactions.
                  </p>

                  {activeRx.items.some((i) => i.isControlled) && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="medControlledAck"
                        checked={controlledSubstanceAck}
                        onChange={(e) => setControlledSubstanceAck(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                      />
                      <label htmlFor="medControlledAck" className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Schedule H1 Register Entry Acknowledged & Signed
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                    Pharmacist Handover Notes
                  </label>
                  <input
                    type="text"
                    value={dispenseNotes}
                    onChange={(e) => setDispenseNotes(e.target.value)}
                    placeholder="E.g., In-person handover completed to patient directly..."
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <Button variant="outline" size="sm" onClick={() => setShowDispenseModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => {
                      if (activeRx.items.some((i) => i.isControlled) && !controlledSubstanceAck) {
                        setDispenseError('Schedule H1 controlled substance statutory sign-off required.');
                        return;
                      }
                      const res = PharmacyService.dispensePrescription(
                        activeRx.id,
                        counselingGiven,
                        'PHARM-STATION-BLR-01',
                        dispenseNotes
                      );
                      if (res.success && res.record) {
                        setDispenseSuccessRecord(res.record);
                        setDispenseError(null);
                      } else {
                        setDispenseError(res.error || 'Dispensing failed.');
                      }
                    }}
                  >
                    Authorize & Complete Dispensing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  Prescription Successfully Dispensed!
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Dispensing Token:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {dispenseSuccessRecord.dispensingToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Record ID:</span>
                    <span>{dispenseSuccessRecord.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Billed:</span>
                    <span>₹{dispenseSuccessRecord.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDispenseModal(false)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      const id = activeRx.id;
                      setShowDispenseModal(false);
                      onNavigate('dispensing-history', id);
                    }}
                  >
                    View in Dispensing History
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
