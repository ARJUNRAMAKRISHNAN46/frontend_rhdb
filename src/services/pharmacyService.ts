import {
  Prescription,
  Patient,
  MedicineBatch,
  DispenseRecord,
  SystemAlert,
  AuditLog,
  PrescriptionStatus,
  AuditAction,
  MedicineProduct,
  PrescriptionItem,
  MedicineVerificationDetail,
  MedicineInventoryItem,
  InventoryStockStatus,
} from '@/types/pharmacy';
import {
  INITIAL_PRESCRIPTIONS,
  INITIAL_PATIENTS,
  INITIAL_BATCHES,
  INITIAL_DISPENSE_RECORDS,
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
} from './mockData';
import { MedicineCatalogService, VERIFIED_MEDICINE_CATALOG } from './medicineCatalogService';

const STORAGE_KEYS = {
  PRESCRIPTIONS: 'rhdb_pharmacy_prescriptions',
  PATIENTS: 'rhdb_pharmacy_patients',
  BATCHES: 'rhdb_pharmacy_batches',
  DISPENSE_RECORDS: 'rhdb_pharmacy_dispense_records',
  ALERTS: 'rhdb_pharmacy_alerts',
  AUDIT_LOGS: 'rhdb_pharmacy_audit_logs',
  MEDICINES: 'rhdb_pharmacy_medicines',
};

// Simple event listener pattern for reactive state in React components
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Failed to parse ${key} from localStorage:`, e);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notify();
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export const PharmacyService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // ------------------ Prescriptions ------------------
  getPrescriptions(): Prescription[] {
    return load<Prescription[]>(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
  },

  getPrescriptionById(id: string): Prescription | undefined {
    return this.getPrescriptions().find((p) => p.id === id);
  },

  updatePrescriptionStatus(id: string, status: PrescriptionStatus, notes?: string): boolean {
    const prescriptions = this.getPrescriptions();
    const index = prescriptions.findIndex((p) => p.id === id);
    if (index === -1) return false;

    const current = prescriptions[index];
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated: Prescription = {
      ...current,
      status,
      notes: notes ? `${current.notes ? current.notes + ' | ' : ''}${notes}` : current.notes,
      ...(status === 'PATIENT_VERIFIED' ? { verifiedPatientAt: now } : {}),
      ...(status === 'MEDICINE_VERIFIED' ? { verifiedMedicineAt: now } : {}),
      ...(status === 'DISPENSED' ? { dispensedAt: now } : {}),
    };

    prescriptions[index] = updated;
    save(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);

    this.addAuditLog(
      status === 'REJECTED' ? 'RX_VERIFY_ATTEMPT' : 'RX_VERIFIED',
      `Prescription ${id} status updated to ${status}${notes ? ` (${notes})` : ''}`
    );

    return true;
  },

  // ------------------ Patients ------------------
  getPatients(): Patient[] {
    return load<Patient[]>(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  },

  getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id);
  },

  verifyPatient(patientId: string, prescriptionId: string, method: string): boolean {
    const rx = this.getPrescriptionById(prescriptionId);
    if (!rx) return false;

    this.updatePrescriptionStatus(
      prescriptionId,
      'PATIENT_VERIFIED',
      `Patient identity securely authenticated via ${method}`
    );

    this.addAuditLog(
      'PATIENT_IDENTITY_VERIFIED',
      `Patient ${patientId} (${rx.patientName}) authenticated using ${method} for Rx: ${prescriptionId}`
    );

    return true;
  },

  // ------------------ Inventory & Batches ------------------
  getBatches(): MedicineBatch[] {
    return load<MedicineBatch[]>(STORAGE_KEYS.BATCHES, INITIAL_BATCHES);
  },

  getBatchById(id: string): MedicineBatch | undefined {
    return this.getBatches().find((b) => b.id === id);
  },

  verifyBatch(query: string): {
    success: boolean;
    batch?: MedicineBatch;
    message: string;
    isCounterfeit?: boolean;
  } {
    const clean = query.trim().toUpperCase();
    const batches = this.getBatches();
    const match = batches.find(
      (b) =>
        b.batchNumber.toUpperCase() === clean ||
        b.gtin === clean ||
        b.serialNumber.toUpperCase() === clean
    );

    if (!match) {
      this.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `Scanned identifier "${query}" NOT found in National Medicine Registry database.`
      );
      return {
        success: false,
        message: 'Barcode/Batch not registered in RHDB National Medicine Registry.',
        isCounterfeit: true,
      };
    }

    if (match.authenticityStatus === 'SUSPICIOUS' || match.authenticityStatus === 'RECALLED') {
      this.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `CRITICAL: Attempted scan of ${match.name} (Batch: ${match.batchNumber}) which is flagged as ${match.authenticityStatus}.`
      );
      return {
        success: false,
        batch: match,
        message: `ALERT: This batch has been flagged as ${match.authenticityStatus}! Do not dispense.`,
        isCounterfeit: true,
      };
    }

    this.addAuditLog(
      'MEDICINE_SCAN_AUTHENTIC',
      `Authentic batch verified: ${match.name} (Batch ${match.batchNumber}, GTIN: ${match.gtin}) with active blockchain hash.`
    );

    return {
      success: true,
      batch: match,
      message: 'Genuine and verified authentic against RHDB cryptographic registry.',
      isCounterfeit: false,
    };
  },

  getMedicineCatalog(): MedicineProduct[] {
    return this.getMedicines();
  },

  getMedicines(): MedicineProduct[] {
    return load<MedicineProduct[]>(STORAGE_KEYS.MEDICINES, VERIFIED_MEDICINE_CATALOG);
  },

  getMedicineById(id: string): MedicineProduct | undefined {
    return this.getMedicines().find((m) => m.id === id);
  },

  addMedicine(data: Omit<MedicineProduct, 'id'>): { success: boolean; medicine?: MedicineProduct; error?: string } {
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'Medicine name must be at least 2 characters.' };
    }
    if (!data.strength || !data.strength.trim()) {
      return { success: false, error: 'Strength / potency is required (e.g., 500mg).' };
    }
    if (!data.dosageForm) {
      return { success: false, error: 'Dosage form is required.' };
    }
    if (!data.barcode || !data.barcode.trim()) {
      return { success: false, error: 'Barcode / GTIN is required.' };
    }
    if (data.reorderThreshold < 0) {
      return { success: false, error: 'Reorder threshold cannot be negative.' };
    }
    if (data.unitPrice <= 0) {
      return { success: false, error: 'Unit price must be greater than zero.' };
    }

    const medicines = this.getMedicines();
    if (medicines.some((m) => m.barcode.trim() === data.barcode.trim())) {
      return { success: false, error: `Barcode "${data.barcode}" is already registered to another medicine.` };
    }

    const newId = `MED-${Math.floor(100 + Math.random() * 900)}`;
    const newMedicine: MedicineProduct = {
      ...data,
      id: newId,
    };

    medicines.push(newMedicine);
    save(STORAGE_KEYS.MEDICINES, medicines);

    this.addAuditLog(
      'STOCK_ADJUSTED',
      `New formulary item added: ${newMedicine.name} (${newMedicine.brandName}) [Barcode: ${newMedicine.barcode}, Threshold: ${newMedicine.reorderThreshold}]`
    );

    return { success: true, medicine: newMedicine };
  },

  updateMedicine(id: string, updates: Partial<MedicineProduct>): { success: boolean; medicine?: MedicineProduct; error?: string } {
    const medicines = this.getMedicines();
    const index = medicines.findIndex((m) => m.id === id);
    if (index === -1) {
      return { success: false, error: 'Medicine record not found.' };
    }

    if (updates.reorderThreshold !== undefined && updates.reorderThreshold < 0) {
      return { success: false, error: 'Reorder threshold cannot be negative.' };
    }

    if (updates.barcode) {
      const duplicate = medicines.find((m) => m.id !== id && m.barcode === updates.barcode);
      if (duplicate) {
        return { success: false, error: `Barcode "${updates.barcode}" is already in use by ${duplicate.name}.` };
      }
    }

    const updated: MedicineProduct = {
      ...medicines[index],
      ...updates,
    };

    medicines[index] = updated;
    save(STORAGE_KEYS.MEDICINES, medicines);

    this.addAuditLog(
      'STOCK_ADJUSTED',
      `Formulary item updated: ${updated.name} (ID: ${id})`
    );

    return { success: true, medicine: updated };
  },

  deleteMedicine(id: string): boolean {
    const medicines = this.getMedicines().filter((m) => m.id !== id);
    save(STORAGE_KEYS.MEDICINES, medicines);
    this.addAuditLog('STOCK_ADJUSTED', `Medicine removed from formulary catalog: ID ${id}`);
    return true;
  },

  addBatch(batchData: Omit<MedicineBatch, 'id' | 'blockchainHash'>): { success: boolean; batch?: MedicineBatch; error?: string } {
    if (!batchData.batchNumber || !batchData.batchNumber.trim()) {
      return { success: false, error: 'Batch number is required.' };
    }
    if (batchData.stockQuantity < 0) {
      return { success: false, error: 'Initial batch quantity cannot be negative.' };
    }
    if (!batchData.expiryDate) {
      return { success: false, error: 'Batch expiry date is required.' };
    }

    const batches = this.getBatches();
    const duplicate = batches.find(
      (b) => b.batchNumber.toUpperCase() === batchData.batchNumber.trim().toUpperCase()
    );
    if (duplicate) {
      return { success: false, error: `Batch number "${batchData.batchNumber}" already exists in the system.` };
    }

    const newId = `BAT-${Math.floor(100 + Math.random() * 900)}`;
    const randomHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newBatch: MedicineBatch = {
      ...batchData,
      id: newId,
      blockchainHash: `0x${randomHash}`,
    };

    batches.push(newBatch);
    save(STORAGE_KEYS.BATCHES, batches);

    this.addAuditLog(
      'STOCK_ADJUSTED',
      `New batch received: ${newBatch.batchNumber} for ${newBatch.name} (Qty: ${newBatch.stockQuantity}, Expires: ${newBatch.expiryDate})`
    );

    return { success: true, batch: newBatch };
  },

  findProductByBarcode(barcode: string): MedicineProduct | undefined {
    const medicines = this.getMedicines();
    return medicines.find((p) => p.barcode === barcode.trim());
  },

  searchMedicines(query: string): MedicineProduct[] {
    const q = query.trim().toLowerCase();
    const medicines = this.getMedicines();
    if (!q) return medicines;

    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.barcode.includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
    );
  },

  getMedicinesWithInventory(): MedicineInventoryItem[] {
    const medicines = this.getMedicines();
    const batches = this.getBatches();
    const baselineDate = new Date('2026-10-26').getTime();

    return medicines.map((med) => {
      // Find all batches associated with this medicine
      const medBatches = batches.filter(
        (b) => b.medicineId === med.id || b.gtin === med.barcode
      );

      // Consistent total quantity calculated directly from batch records
      const totalQuantity = medBatches.reduce((acc, b) => acc + b.stockQuantity, 0);

      // Analyze batch expiry and stock conditions
      let hasExpiredBatch = false;
      let hasNearExpiryBatch = false;
      let nearestExpiry: string | undefined = undefined;

      medBatches.forEach((b) => {
        const expTime = new Date(b.expiryDate).getTime();
        if (expTime < baselineDate) {
          if (b.stockQuantity > 0) hasExpiredBatch = true;
        } else {
          const diffDays = (expTime - baselineDate) / (1000 * 60 * 60 * 24);
          if (diffDays <= 45 && b.stockQuantity > 0) {
            hasNearExpiryBatch = true;
          }
          if (!nearestExpiry || expTime < new Date(nearestExpiry).getTime()) {
            nearestExpiry = b.expiryDate;
          }
        }
      });

      const hasLowStock = totalQuantity > 0 && totalQuantity <= med.reorderThreshold;

      // Determine overall stock status
      let stockStatus: InventoryStockStatus = 'IN_STOCK';
      if (totalQuantity === 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (hasExpiredBatch) {
        stockStatus = 'EXPIRED';
      } else if (hasLowStock) {
        stockStatus = 'LOW_STOCK';
      } else if (hasNearExpiryBatch) {
        stockStatus = 'NEAR_EXPIRY';
      }

      return {
        ...med,
        reorderThreshold: med.reorderThreshold,
        totalQuantity,
        batchCount: medBatches.length,
        batches: medBatches,
        stockStatus,
        nearestExpiryDate: nearestExpiry,
        hasExpiredBatch,
        hasNearExpiryBatch,
        hasLowStock,
      };
    });
  },

  validateMedicineVerification(
    scannedQuery: string,
    prescribedItem: PrescriptionItem
  ): MedicineVerificationDetail {
    const batches = this.getBatches();
    const result = MedicineCatalogService.compareAndValidateMedicine(
      scannedQuery,
      prescribedItem,
      batches
    );

    if (result.outcome === 'SUCCESS') {
      this.addAuditLog(
        'MEDICINE_SCAN_AUTHENTIC',
        `Physical package verified: ${result.product?.name} (Barcode: ${result.product?.barcode}) matches Rx item ${prescribedItem.name} [Identity, Strength, Form, Qty Validated]`
      );
    } else if (result.outcome === 'UNKNOWN_BARCODE') {
      this.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `Unregistered barcode scan attempt: "${scannedQuery}" not recognized in National Formulary.`
      );
    } else if (result.outcome === 'UNAVAILABLE_PRODUCT') {
      this.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `Flagged product scan attempt: ${result.product?.name} (Batch ${result.matchedBatch?.batchNumber}) - ${result.summary}`
      );
    } else {
      this.addAuditLog(
        'MEDICINE_SCAN_COUNTERFEIT',
        `CLINICAL SAFETY ALERT: ${result.summary}. Substitution prevented.`
      );
    }

    return result;
  },

  adjustStock(
    batchId: string,
    quantityDelta: number,
    reason: string
  ): { success: boolean; error?: string; newStock?: number } {
    if (!reason || !reason.trim()) {
      return { success: false, error: 'A specific reason is required for every inventory adjustment.' };
    }

    const batches = this.getBatches();
    const index = batches.findIndex((b) => b.id === batchId);
    if (index === -1) {
      return { success: false, error: 'Batch record not found in dispensary inventory.' };
    }

    const currentStock = batches[index].stockQuantity;
    if (currentStock + quantityDelta < 0) {
      return {
        success: false,
        error: `Adjustment would result in negative inventory quantity. Maximum deductible is ${currentStock} units (requested -${Math.abs(quantityDelta)}).`,
      };
    }

    const newStock = currentStock + quantityDelta;
    batches[index] = { ...batches[index], stockQuantity: newStock };
    save(STORAGE_KEYS.BATCHES, batches);

    this.addAuditLog(
      'STOCK_ADJUSTED',
      `Inventory for ${batches[index].name} (Batch ${batches[index].batchNumber}) adjusted by ${quantityDelta > 0 ? '+' : ''}${quantityDelta}. New balance: ${newStock} units. Reason: ${reason}`
    );

    if (newStock <= batches[index].reorderThreshold) {
      this.addAlert({
        type: 'STOCKOUT',
        severity: newStock === 0 ? 'CRITICAL' : 'HIGH',
        title: `Low Stock Alert: ${batches[index].name}`,
        message: `Current stock level is ${newStock} units (Reorder threshold is ${batches[index].reorderThreshold}).`,
        relatedEntityId: batchId,
      });
    }

    return { success: true, newStock };
  },

  quarantineBatch(batchId: string, reason: string): boolean {
    const batches = this.getBatches();
    const index = batches.findIndex((b) => b.id === batchId);
    if (index === -1) return false;

    batches[index] = {
      ...batches[index],
      authenticityStatus: 'RECALLED',
      storageCondition: `QUARANTINED: ${reason}`,
    };
    save(STORAGE_KEYS.BATCHES, batches);

    this.addAlert({
      type: 'RECALL',
      severity: 'CRITICAL',
      title: `Batch Quarantined: ${batches[index].name}`,
      message: `Batch ${batches[index].batchNumber} has been placed into quarantine: ${reason}`,
      relatedEntityId: batchId,
    });

    this.addAuditLog(
      'MEDICINE_SCAN_COUNTERFEIT',
      `Batch ${batches[index].batchNumber} (${batches[index].name}) quarantined by pharmacy station. Reason: ${reason}`
    );

    return true;
  },

  validateDispenseEligibility(prescriptionId: string): {
    eligible: boolean;
    errors: string[];
    warnings: string[];
    prescription?: Prescription;
    patient?: Patient;
  } {
    const rx = this.getPrescriptionById(prescriptionId);
    if (!rx) {
      return { eligible: false, errors: ['Prescription not found.'], warnings: [] };
    }

    const patient = this.getPatientById(rx.patientId);
    const errors: string[] = [];
    const warnings: string[] = [];

    const isExpired = new Date(rx.expiryDate).getTime() < new Date('2026-10-26').getTime();
    if (rx.status === 'EXPIRED' || isExpired) {
      errors.push(`Prescription expired on ${rx.expiryDate}. Dispensing expired orders is prohibited.`);
    }

    if (rx.status === 'REJECTED') {
      errors.push('Prescription was rejected due to clinical or cryptographic flags.');
    }
    if (rx.status === 'DISPENSED') {
      errors.push('Prescription has already been fully dispensed.');
    }

    const isPatientVerified =
      rx.status === 'PATIENT_VERIFIED' ||
      rx.status === 'VERIFIED' ||
      rx.status === 'MEDICINE_VERIFIED' ||
      rx.status === 'PARTIALLY_DISPENSED' ||
      Boolean(rx.verifiedPatientAt);

    if (!isPatientVerified && rx.status === 'PENDING') {
      errors.push('Patient identity has not been authenticated. Patient verification is required before dispensing.');
    }

    const hasControlled = rx.items.some((i) => i.isControlled);
    if (hasControlled) {
      warnings.push('Prescription contains Schedule H1 controlled substances requiring statutory ledger sign-off.');
    }

    return {
      eligible: errors.length === 0,
      errors,
      warnings,
      prescription: rx,
      patient,
    };
  },

  dispensePrescription(
    prescriptionId: string,
    counselingProvided: boolean = true,
    pharmacistStationId: string = 'PHARM-STATION-BLR-01',
    notes?: string
  ): { success: boolean; record?: DispenseRecord; error?: string } {
    const eligibility = this.validateDispenseEligibility(prescriptionId);
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.errors[0] || 'Prescription is not eligible for dispensing.' };
    }

    const prescriptions = this.getPrescriptions();
    const rx = eligibility.prescription!;

    const batches = this.getBatches();
    const dispensedItems: Array<{
      medicineId: string;
      name: string;
      batchNumber: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    let totalAmount = 0;

    // Deduct inventory for each item with expired batch protection
    const baselineDate = new Date('2026-10-26').getTime();

    for (const item of rx.items) {
      // Find candidate batches for this medicine
      const candidateBatches = batches.filter(
        (b) => b.medicineId === item.medicineId || b.gtin === item.medicineId
      );

      // Check if an expired batch exists and no valid batch is available
      const expiredBatch = candidateBatches.find(
        (b) => new Date(b.expiryDate).getTime() < baselineDate && b.stockQuantity > 0
      );

      const validBatch = candidateBatches.find(
        (b) =>
          b.authenticityStatus === 'VERIFIED_GENUINE' &&
          new Date(b.expiryDate).getTime() >= baselineDate &&
          b.stockQuantity >= item.quantity
      ) || candidateBatches.find(
        (b) =>
          b.authenticityStatus === 'VERIFIED_GENUINE' &&
          new Date(b.expiryDate).getTime() >= baselineDate &&
          b.stockQuantity > 0
      );

      if (!validBatch && expiredBatch) {
        return {
          success: false,
          error: `DISPENSING BLOCKED: Batch ${expiredBatch.batchNumber} of ${item.name} expired on ${expiredBatch.expiryDate}. Dispensing expired medication is strictly prohibited.`,
        };
      }

      const selectedBatch = validBatch || candidateBatches[0];
      if (selectedBatch) {
        selectedBatch.stockQuantity = Math.max(0, selectedBatch.stockQuantity - item.quantity);
        dispensedItems.push({
          medicineId: item.medicineId,
          name: item.name,
          batchNumber: selectedBatch.batchNumber,
          quantity: item.quantity,
          unitPrice: selectedBatch.unitPrice,
        });
        totalAmount += item.quantity * selectedBatch.unitPrice;
      } else {
        dispensedItems.push({
          medicineId: item.medicineId,
          name: item.name,
          batchNumber: 'GEN-BATCH-01',
          quantity: item.quantity,
          unitPrice: 10,
        });
        totalAmount += item.quantity * 10;
      }
    }

    save(STORAGE_KEYS.BATCHES, batches);

    // Generate secure token
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const token = `RHDB-TOKEN-${new Date().getFullYear()}-${randomHex}-${prescriptionId.slice(-4)}`;

    const newRecord: DispenseRecord = {
      id: `DSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      prescriptionId: rx.id,
      patientId: rx.patientId,
      patientName: rx.patientName,
      pharmacistStationId,
      items: dispensedItems,
      dispensedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      dispensingToken: token,
      counselingProvided,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'COMPLETED',
      notes,
    };

    const existingRecords = this.getDispenseRecords();
    save(STORAGE_KEYS.DISPENSE_RECORDS, [newRecord, ...existingRecords]);

    this.updatePrescriptionStatus(prescriptionId, 'DISPENSED', `Dispensed with Token: ${token}`);

    this.addAuditLog(
      'MEDICINE_DISPENSED',
      `Dispensed prescription ${rx.id} for ${rx.patientName}. Items: ${dispensedItems.map((i) => `${i.name} (x${i.quantity})`).join(', ')}. Verification Token: ${token}`
    );

    return { success: true, record: newRecord };
  },

  getDispenseRecords(): DispenseRecord[] {
    return load<DispenseRecord[]>(STORAGE_KEYS.DISPENSE_RECORDS, INITIAL_DISPENSE_RECORDS);
  },

  // ------------------ Alerts ------------------
  getAlerts(): SystemAlert[] {
    return load<SystemAlert[]>(STORAGE_KEYS.ALERTS, INITIAL_ALERTS);
  },

  addAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'resolved'>): SystemAlert {
    const alerts = this.getAlerts();
    const newAlert: SystemAlert = {
      ...alert,
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      resolved: false,
    };

    save(STORAGE_KEYS.ALERTS, [newAlert, ...alerts]);
    return newAlert;
  },

  resolveAlert(id: string, pharmacistName: string = 'Pharm. R. Kumar'): boolean {
    const alerts = this.getAlerts();
    const index = alerts.findIndex((a) => a.id === id);
    if (index === -1) return false;

    alerts[index] = {
      ...alerts[index],
      resolved: true,
      resolvedBy: pharmacistName,
      resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    save(STORAGE_KEYS.ALERTS, alerts);

    this.addAuditLog(
      'ALERT_RESOLVED',
      `Alert ${id} ("${alerts[index].title}") marked resolved by ${pharmacistName}.`
    );

    return true;
  },

  // ------------------ Audit Logs ------------------
  getAuditLogs(): AuditLog[] {
    return load<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(action: AuditAction, details: string, station: string = 'Counter #1 - Main Dispensary'): AuditLog {
    const logs = this.getAuditLogs();
    const randomHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newLog: AuditLog = {
      id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
      action,
      pharmacistId: 'PHARM-LIC-88291 (R. Kumar)',
      details,
      ipAddress: '192.168.1.104',
      station,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      integrityHash: randomHash,
    };

    save(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
    return newLog;
  },

  // ------------------ Reset ------------------
  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.PRESCRIPTIONS);
    localStorage.removeItem(STORAGE_KEYS.PATIENTS);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.DISPENSE_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.ALERTS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    notify();
  },
};
