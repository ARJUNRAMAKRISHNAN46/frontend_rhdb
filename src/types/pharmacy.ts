export type PrescriptionStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'PATIENT_VERIFIED'
  | 'MEDICINE_VERIFIED'
  | 'PARTIALLY_DISPENSED'
  | 'DISPENSED'
  | 'REJECTED'
  | 'EXPIRED';

export interface PrescriptionItem {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
  isControlled?: boolean;
}

export interface Prescription {
  id: string; // e.g. RX-94821
  secureHash: string; // SHA-256 digital signature simulation
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  doctorId: string;
  doctorName: string;
  hospital: string;
  doctorLicense: string;
  dateIssued: string;
  expiryDate: string;
  diagnosis: string;
  notes?: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  verifiedPatientAt?: string;
  verifiedMedicineAt?: string;
  dispensedAt?: string;
}

export type PatientVerificationMethod = 'BIOMETRIC' | 'OTP' | 'NATIONAL_HEALTH_ID' | 'MANUAL';

export interface Patient {
  id: string; // e.g. PAT-1049
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  nationalHealthId: string; // e.g. ABHA ID: 91-4920-1928-9401
  address: string;
  allergies: string[];
  chronicConditions: string[];
  photoUrl?: string;
  status: 'ACTIVE' | 'FLAGGED' | 'RESTRICTED';
  recentPrescriptions: string[];
}

export type BatchAuthenticityStatus = 'VERIFIED_GENUINE' | 'SUSPICIOUS' | 'RECALLED' | 'UNVERIFIED';

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Oral Suspension'
  | 'Injection'
  | 'Inhaler'
  | 'Dispersible Tablet'
  | 'Ointment'
  | 'Drops';

export interface MedicineProduct {
  id: string; // e.g. MED-101
  name: string; // e.g. Augmentin 625 Duo
  brandName: string; // Augmentin
  genericName: string; // Amoxicillin + Clavulanic Acid
  strength: string; // 625mg
  dosageForm: DosageForm;
  barcode: string; // GTIN-14 / EAN-13, e.g. '08901234500101'
  manufacturer: string; // GlaxoSmithKline Pharmaceuticals Ltd
  category: string; // Antibiotic
  controlledSubstance: boolean;
  packageSize: number; // e.g. 10 tablets per strip
  unitPrice: number;
  reorderThreshold: number;
  description?: string;
}

export type InventoryStockStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEAR_EXPIRY'
  | 'EXPIRED'
  | 'QUARANTINED';

export interface MedicineInventoryItem extends MedicineProduct {
  totalQuantity: number;
  batchCount: number;
  batches: MedicineBatch[];
  stockStatus: InventoryStockStatus;
  nearestExpiryDate?: string;
  hasExpiredBatch: boolean;
  hasNearExpiryBatch: boolean;
  hasLowStock: boolean;
}

export type VerificationOutcome =
  | 'SUCCESS'
  | 'MISMATCH_IDENTITY'
  | 'MISMATCH_STRENGTH'
  | 'MISMATCH_DOSAGE_FORM'
  | 'MISMATCH_QUANTITY'
  | 'UNKNOWN_BARCODE'
  | 'UNAVAILABLE_PRODUCT';

export interface MedicineVerificationDetail {
  outcome: VerificationOutcome;
  isMatch: boolean;
  product?: MedicineProduct;
  matchedBatch?: MedicineBatch;
  prescribedItem?: PrescriptionItem;
  scannedBarcode?: string;
  criteria: {
    identityMatched: boolean;
    strengthMatched: boolean;
    dosageFormMatched: boolean;
    stockSufficient: boolean;
  };
  summary: string;
  reasons: string[];
  recommendation: string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  name: string;
  genericName: string;
  category: string;
  batchNumber: string;
  gtin: string; // GS1 barcode (e.g. 08901234567890)
  serialNumber: string;
  manufacturer: string;
  manufacturingDate: string;
  expiryDate: string;
  stockQuantity: number;
  reorderThreshold: number;
  unitPrice: number;
  authenticityStatus: BatchAuthenticityStatus;
  blockchainHash: string;
  controlledSubstance: boolean;
  storageCondition: string;
}

export interface DispenseRecordItem {
  medicineId: string;
  name: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
}

export interface DispenseRecord {
  id: string; // DSP-2026-001
  prescriptionId: string;
  patientId: string;
  patientName: string;
  pharmacistStationId: string;
  items: DispenseRecordItem[];
  dispensedAt: string;
  dispensingToken: string;
  counselingProvided: boolean;
  totalAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type AlertType =
  | 'DRUG_INTERACTION'
  | 'COUNTERFEIT_DETECTED'
  | 'EXPIRED_STOCK'
  | 'STOCKOUT'
  | 'RECALL'
  | 'PATIENT_ALLERGY'
  | 'DUPLICATE_DISPENSE';

export interface SystemAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedEntityId?: string; // Rx ID, Batch ID, or Patient ID
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'RX_VERIFY_ATTEMPT'
  | 'RX_VERIFIED'
  | 'PATIENT_IDENTITY_VERIFIED'
  | 'PATIENT_IDENTITY_FAILED'
  | 'MEDICINE_SCAN_AUTHENTIC'
  | 'MEDICINE_SCAN_COUNTERFEIT'
  | 'MEDICINE_DISPENSED'
  | 'STOCK_ADJUSTED'
  | 'ALERT_RESOLVED'
  | 'REPORT_GENERATED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  pharmacistId: string;
  details: string;
  ipAddress: string;
  station: string;
  timestamp: string;
  integrityHash: string; // Tamper-proof SHA256 simulation
}

export type ActiveSection =
  | 'dashboard'
  | 'prescriptions'
  | 'medicine-verification'
  | 'inventory'
  | 'dispensing-history'
  | 'reports';
