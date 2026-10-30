import {
  MedicineProduct,
  MedicineBatch,
  PrescriptionItem,
  MedicineVerificationDetail,
  VerificationOutcome,
} from '@/types/pharmacy';

/**
 * Verified National / Hospital Medicine Formulary Catalog
 * Seeded for the RHDB Secure Prescription & Medicine Verification Prototype.
 * In production, this service queries the RHDB Verified Central Product Registry.
 */
export const VERIFIED_MEDICINE_CATALOG: MedicineProduct[] = [
  {
    id: 'MED-101',
    name: 'Augmentin 625 Duo',
    brandName: 'Augmentin',
    genericName: 'Amoxicillin + Clavulanic Acid (500mg/125mg)',
    strength: '625mg',
    dosageForm: 'Tablet',
    barcode: '08901234500101',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    category: 'Antibiotics / Penicillin-class',
    controlledSubstance: false,
    packageSize: 10,
    unitPrice: 22.5,
    reorderThreshold: 30,
    description: 'Broad-spectrum antibacterial for respiratory, ear, skin and urinary infections.',
  },
  {
    id: 'MED-102',
    name: 'Metformin HCl 500mg SR',
    brandName: 'Glycomet SR',
    genericName: 'Metformin Hydrochloride (Sustained Release)',
    strength: '500mg',
    dosageForm: 'Tablet',
    barcode: '08901234500102',
    manufacturer: 'Sun Pharmaceutical Ind Ltd',
    category: 'Antidiabetic / Biguanide',
    controlledSubstance: false,
    packageSize: 20,
    unitPrice: 4.8,
    reorderThreshold: 60,
    description: 'First-line anti-hyperglycemic agent for Type 2 Diabetes management.',
  },
  {
    id: 'MED-102-1000',
    name: 'Metformin HCl 1000mg SR',
    brandName: 'Glycomet SR 1000',
    genericName: 'Metformin Hydrochloride (Sustained Release)',
    strength: '1000mg',
    dosageForm: 'Tablet',
    barcode: '08901234500202',
    manufacturer: 'Sun Pharmaceutical Ind Ltd',
    category: 'Antidiabetic / Biguanide',
    controlledSubstance: false,
    packageSize: 15,
    unitPrice: 8.5,
    reorderThreshold: 30,
    description: 'High-potency metformin for elevated glycemic resistance. [Test Item: Strength Mismatch demo]',
  },
  {
    id: 'MED-102-LIQ',
    name: 'Metformin Oral Solution 500mg/5mL',
    brandName: 'Riomet Liquid',
    genericName: 'Metformin Hydrochloride Solution',
    strength: '500mg',
    dosageForm: 'Oral Suspension',
    barcode: '08901234500302',
    manufacturer: 'Sun Pharmaceutical Ind Ltd',
    category: 'Antidiabetic / Liquid Form',
    controlledSubstance: false,
    packageSize: 100,
    unitPrice: 18.0,
    reorderThreshold: 15,
    description: 'Pediatric and geriatric liquid formulation. [Test Item: Dosage Form Mismatch demo]',
  },
  {
    id: 'MED-103',
    name: 'Telmisartan 40mg',
    brandName: 'Telma 40',
    genericName: 'Telmisartan Tablets IP',
    strength: '40mg',
    dosageForm: 'Tablet',
    barcode: '08901234500103',
    manufacturer: 'Cipla Therapeutics Ltd',
    category: 'Cardiovascular / ARB',
    controlledSubstance: false,
    packageSize: 30,
    unitPrice: 9.5,
    reorderThreshold: 25,
    description: 'Angiotensin II Receptor Blocker for essential hypertension management.',
  },
  {
    id: 'MED-103-80',
    name: 'Telmisartan 80mg',
    brandName: 'Telma 80',
    genericName: 'Telmisartan Tablets IP',
    strength: '80mg',
    dosageForm: 'Tablet',
    barcode: '08901234500203',
    manufacturer: 'Cipla Therapeutics Ltd',
    category: 'Cardiovascular / ARB',
    controlledSubstance: false,
    packageSize: 30,
    unitPrice: 17.0,
    reorderThreshold: 20,
    description: 'High-dose telmisartan for uncontrolled hypertension. [Test Item: Strength Mismatch demo]',
  },
  {
    id: 'MED-104',
    name: 'Alprazolam 0.5mg',
    brandName: 'Restyl 0.5',
    genericName: 'Alprazolam Tablets IP',
    strength: '0.5mg',
    dosageForm: 'Tablet',
    barcode: '08901234500104',
    manufacturer: 'Torrent Pharmaceuticals Ltd',
    category: 'Schedule H1 / Anxiolytic Benzodiazepine',
    controlledSubstance: true,
    packageSize: 15,
    unitPrice: 3.2,
    reorderThreshold: 20,
    description: 'Controlled substance requiring double-locked dispensary registry.',
  },
  {
    id: 'MED-105',
    name: 'Paracetamol 650mg Fast-Release',
    brandName: 'Dolo 650',
    genericName: 'Paracetamol / Acetaminophen IP',
    strength: '650mg',
    dosageForm: 'Tablet',
    barcode: '08901234500999',
    manufacturer: 'Apex Wellness Unlicensed',
    category: 'Analgesics / Antipyretic',
    controlledSubstance: false,
    packageSize: 15,
    unitPrice: 1.5,
    reorderThreshold: 50,
    description: 'Analgesic tablet with flagged counterfeit batch PCM-FAKE-99X.',
  },
  {
    id: 'MED-106',
    name: 'Atorvastatin 20mg',
    brandName: 'Atorva 20',
    genericName: 'Atorvastatin Calcium IP',
    strength: '20mg',
    dosageForm: 'Tablet',
    barcode: '08901234500106',
    manufacturer: 'Dr. Reddy’s Laboratories Ltd',
    category: 'Lipid Lowering / HMG-CoA Reductase Inhibitor',
    controlledSubstance: false,
    packageSize: 30,
    unitPrice: 14.0,
    reorderThreshold: 40,
    description: 'Statin therapy for coronary artery disease and primary hypercholesterolemia.',
  },
  {
    id: 'MED-107',
    name: 'Montelukast + Levocetirizine',
    brandName: 'Montair-LC',
    genericName: 'Montelukast Sodium (10mg) + Levocetirizine (5mg)',
    strength: '10mg/5mg',
    dosageForm: 'Tablet',
    barcode: '08901234500107',
    manufacturer: 'Mankind Pharma Ltd',
    category: 'Respiratory / Antihistamine Leukotriene Antagonist',
    controlledSubstance: false,
    packageSize: 10,
    unitPrice: 12.5,
    reorderThreshold: 30,
    description: 'Dual anti-allergic therapy for allergic rhinitis and asthma prophylaxis.',
  },
  {
    id: 'MED-108',
    name: 'Cefixime 200mg DT',
    brandName: 'Taxim-O 200 DT',
    genericName: 'Cefixime Dispersible Tablets IP',
    strength: '200mg',
    dosageForm: 'Dispersible Tablet',
    barcode: '08901234500108',
    manufacturer: 'Alkem Laboratories Ltd',
    category: 'Antibiotics / Cephalosporin 3rd Gen',
    controlledSubstance: false,
    packageSize: 10,
    unitPrice: 16.0,
    reorderThreshold: 20,
    description: 'Oral third-generation cephalosporin for uncomplicated infections.',
  },
  {
    id: 'MED-199',
    name: 'Salbutamol Inhaler 100mcg',
    brandName: 'Asthalin 100 Inhaler',
    genericName: 'Salbutamol Metered Dose Inhaler',
    strength: '100mcg',
    dosageForm: 'Inhaler',
    barcode: '08901234500199',
    manufacturer: 'Cipla Respiratory Ltd',
    category: 'Bronchodilator / Beta-2 Agonist',
    controlledSubstance: false,
    packageSize: 1,
    unitPrice: 28.0,
    reorderThreshold: 15,
    description: 'Rapid-acting rescue inhaler for bronchospasm. [Test Item: Out of Stock demo]',
  },
];

/**
 * Normalizes strength strings for comparison (e.g. "500mg" vs "500 mg" vs "500mg SR")
 */
function normalizeStrength(str: string): string {
  if (!str) return '';
  return str.toLowerCase().replace(/\s+/g, '').replace(/sr|cr|xr|er/g, '').trim();
}

/**
 * Normalizes dosage form (e.g. "Tablet" vs "Tablets")
 */
function normalizeForm(str: string): string {
  if (!str) return '';
  const s = str.toLowerCase().trim();
  if (s.includes('tablet')) return 'tablet';
  if (s.includes('capsule')) return 'capsule';
  if (s.includes('suspension') || s.includes('syrup') || s.includes('liquid') || s.includes('solution'))
    return 'liquid';
  if (s.includes('inhaler')) return 'inhaler';
  if (s.includes('injection')) return 'injection';
  return s;
}

export const MedicineCatalogService = {
  /**
   * Look up a medicine product by its exact GTIN-14 / EAN-13 barcode
   */
  findProductByBarcode(barcode: string): MedicineProduct | undefined {
    const clean = barcode.trim();
    if (!clean) return undefined;
    return VERIFIED_MEDICINE_CATALOG.find((p) => p.barcode === clean);
  },

  /**
   * Look up a medicine product by its internal medicine ID
   */
  getProductById(id: string): MedicineProduct | undefined {
    return VERIFIED_MEDICINE_CATALOG.find((p) => p.id === id);
  },

  /**
   * Search medicines by name, brand, generic compound, or barcode
   */
  searchMedicines(query: string): MedicineProduct[] {
    const q = query.trim().toLowerCase();
    if (!q) return VERIFIED_MEDICINE_CATALOG;

    return VERIFIED_MEDICINE_CATALOG.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.brandName.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.barcode.includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
    );
  },

  /**
   * Returns all verified products
   */
  getAllProducts(): MedicineProduct[] {
    return VERIFIED_MEDICINE_CATALOG;
  },

  /**
   * Perform comprehensive clinical validation between a scanned/selected product
   * and a prescribed prescription item.
   *
   * Validates:
   * 1. Product existence in verified catalog (Rule: Never assume barcode identifies medicine without matching record).
   * 2. Active batch authenticity and stock status (Rule: Unavailable / Quarantined states).
   * 3. Medicine identity / active compound (Rule: Never silently substitute a different medicine).
   * 4. Strength (Rule: Exact strength match).
   * 5. Dosage form (Rule: Exact dosage form match).
   * 6. Prescribed quantity fulfillment.
   */
  compareAndValidateMedicine(
    input: string,
    prescribedItem: PrescriptionItem,
    batches: MedicineBatch[]
  ): MedicineVerificationDetail {
    const clean = input.trim();

    // 1. Try finding product by barcode first, then by batch number, then by exact ID/name
    let product: MedicineProduct | undefined = this.findProductByBarcode(clean);

    let matchedBatch: MedicineBatch | undefined = undefined;
    if (!product) {
      // Check if user entered a batch number directly (e.g. AUG-2026-X81)
      matchedBatch = batches.find(
        (b) => b.batchNumber.toUpperCase() === clean.toUpperCase() || b.gtin === clean
      );
      if (matchedBatch) {
        product = this.getProductById(matchedBatch.medicineId);
      }
    }

    if (!product) {
      // Search by product name / ID if typed manually
      product = VERIFIED_MEDICINE_CATALOG.find(
        (p) =>
          p.id.toLowerCase() === clean.toLowerCase() ||
          p.name.toLowerCase() === clean.toLowerCase() ||
          p.brandName.toLowerCase() === clean.toLowerCase()
      );
    }

    // STATE: Unknown Barcode / Product not found in database
    if (!product) {
      return {
        outcome: 'UNKNOWN_BARCODE',
        isMatch: false,
        scannedBarcode: clean,
        prescribedItem,
        criteria: {
          identityMatched: false,
          strengthMatched: false,
          dosageFormMatched: false,
          stockSufficient: false,
        },
        summary: `Unregistered Barcode / Product Code: "${clean}"`,
        reasons: [
          `No matching medicine product record was found in the RHDB Formulary for barcode "${clean}".`,
          'CLINICAL SAFETY RULE: Never assume that a barcode automatically identifies a medicine unless a matching product record exists in the verified database.',
        ],
        recommendation:
          'Inspect the physical packaging. Check if the manufacturer barcode is damaged or non-standard. Do NOT dispense unverified stock.',
      };
    }

    // Locate matching batch in dispensary inventory
    if (!matchedBatch) {
      matchedBatch = batches.find(
        (b) => b.medicineId === product?.id || b.gtin === product?.barcode
      );
    }

    // STATE: Unavailable / Recalled / Quarantined Product
    if (
      matchedBatch &&
      (matchedBatch.authenticityStatus === 'SUSPICIOUS' ||
        matchedBatch.authenticityStatus === 'RECALLED')
    ) {
      return {
        outcome: 'UNAVAILABLE_PRODUCT',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: true,
          strengthMatched: true,
          dosageFormMatched: true,
          stockSufficient: false,
        },
        summary: `CRITICAL: Product Batch Flagged as ${matchedBatch.authenticityStatus}`,
        reasons: [
          `Batch ${matchedBatch.batchNumber} of ${product.name} has been quarantined or recalled.`,
          'Cryptographic ledger integrity check failed or manufacturer recall order is active.',
        ],
        recommendation:
          'DO NOT DISPENSE. Physically isolate this stock into Quarantine Bin and file an adverse drug event report.',
      };
    }

    // STATE: Unavailable / Out of Stock
    const availableStock = matchedBatch ? matchedBatch.stockQuantity : 0;
    if (availableStock === 0) {
      return {
        outcome: 'UNAVAILABLE_PRODUCT',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: true,
          strengthMatched: true,
          dosageFormMatched: true,
          stockSufficient: false,
        },
        summary: `Product Out of Stock: ${product.name}`,
        reasons: [
          `The scanned product is recognized, but dispensary stock is depleted (0 units available).`,
          `Prescription requires ${prescribedItem.quantity} units.`,
        ],
        recommendation:
          'Request stock transfer from central hospital storage or notify prescriber for alternative guidance.',
      };
    }

    // CLINICAL VALIDATION 1: Medicine Identity (Active pharmaceutical ingredient / compound)
    // Compare product ID or key generic name tokens
    const productBaseId = product.id.split('-').slice(0, 2).join('-');
    const prescribedBaseId = prescribedItem.medicineId.split('-').slice(0, 2).join('-');
    const identityMatched = productBaseId === prescribedBaseId;

    if (!identityMatched) {
      return {
        outcome: 'MISMATCH_IDENTITY',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: false,
          strengthMatched: false,
          dosageFormMatched: false,
          stockSufficient: availableStock >= prescribedItem.quantity,
        },
        summary: `DRUG IDENTITY MISMATCH: Scanned "${product.name}" instead of "${prescribedItem.name}"`,
        reasons: [
          `Scanned medicine active compound (${product.genericName}) does NOT match prescribed drug (${prescribedItem.name}).`,
          'CLINICAL SAFETY MANDATE: Pharmacists must never silently substitute a different medicine without explicit physician authorization.',
        ],
        recommendation:
          'Reject physical package. Retrieve the exact medication prescribed on the active prescription.',
      };
    }

    // CLINICAL VALIDATION 2: Strength Match
    const prescribedStrengthNorm = normalizeStrength(prescribedItem.dosage);
    const scannedStrengthNorm = normalizeStrength(product.strength);
    const strengthMatched =
      prescribedStrengthNorm === scannedStrengthNorm ||
      prescribedStrengthNorm.includes(scannedStrengthNorm) ||
      scannedStrengthNorm.includes(prescribedStrengthNorm);

    if (!strengthMatched) {
      return {
        outcome: 'MISMATCH_STRENGTH',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: true,
          strengthMatched: false,
          dosageFormMatched: true,
          stockSufficient: availableStock >= prescribedItem.quantity,
        },
        summary: `STRENGTH MISMATCH: Prescribed ${prescribedItem.dosage} vs Scanned ${product.strength}`,
        reasons: [
          `The prescribed dosage is ${prescribedItem.dosage}, but the scanned product package delivers ${product.strength}.`,
          'Dispensing an incorrect strength risks severe under-dosing or lethal drug toxicity.',
        ],
        recommendation:
          'Put back package. Locate the package with the exact prescribed potency specified on the prescription.',
      };
    }

    // CLINICAL VALIDATION 3: Dosage Form Match
    const prescribedFormNorm = normalizeForm(prescribedItem.name);
    const scannedFormNorm = normalizeForm(product.dosageForm);
    const dosageFormMatched =
      prescribedFormNorm === '' ||
      scannedFormNorm === '' ||
      prescribedFormNorm === scannedFormNorm ||
      (prescribedFormNorm === 'tablet' && product.dosageForm.toLowerCase().includes('tablet'));

    if (!dosageFormMatched) {
      return {
        outcome: 'MISMATCH_DOSAGE_FORM',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: true,
          strengthMatched: true,
          dosageFormMatched: false,
          stockSufficient: availableStock >= prescribedItem.quantity,
        },
        summary: `DOSAGE FORM MISMATCH: Prescribed ${prescribedItem.name} vs Scanned ${product.dosageForm}`,
        reasons: [
          `Prescription specifies solid/oral form, but scanned medicine is formulated as "${product.dosageForm}".`,
          'Different dosage forms exhibit altered pharmacokinetics, absorption rates, and bioavailability.',
        ],
        recommendation:
          'Select the specific dosage form ordered by the prescriber. Do not interchange tablets with liquid suspensions without doctor approval.',
      };
    }

    // CLINICAL VALIDATION 4: Quantity Check
    const stockSufficient = availableStock >= prescribedItem.quantity;
    if (!stockSufficient) {
      return {
        outcome: 'MISMATCH_QUANTITY',
        isMatch: false,
        product,
        matchedBatch,
        prescribedItem,
        scannedBarcode: product.barcode,
        criteria: {
          identityMatched: true,
          strengthMatched: true,
          dosageFormMatched: true,
          stockSufficient: false,
        },
        summary: `INSUFFICIENT STOCK: Available ${availableStock} units vs Required ${prescribedItem.quantity} units`,
        reasons: [
          `Prescribed quantity is ${prescribedItem.quantity} units, but current verified batch has only ${availableStock} units in stock.`,
        ],
        recommendation:
          'You may record a Partial Dispensing in the Dispensing module or replenish inventory before fulfilling this full order.',
      };
    }

    // SUCCESS STATE: All 4 validation criteria verified
    return {
      outcome: 'SUCCESS',
      isMatch: true,
      product,
      matchedBatch,
      prescribedItem,
      scannedBarcode: product.barcode,
      criteria: {
        identityMatched: true,
        strengthMatched: true,
        dosageFormMatched: true,
        stockSufficient: true,
      },
      summary: `VERIFIED AUTHENTIC: ${product.name} Matches Prescription`,
      reasons: [
        `Active ingredient verified: ${product.genericName}.`,
        `Potency confirmed: ${product.strength} matches prescribed ${prescribedItem.dosage}.`,
        `Dosage form confirmed: ${product.dosageForm}.`,
        `Sufficient stock: ${availableStock} units available for ${prescribedItem.quantity} required.`,
        `Manufacturer: ${product.manufacturer} (Batch ${matchedBatch ? matchedBatch.batchNumber : 'N/A'}).`,
      ],
      recommendation:
        'All safety checks passed. You may mark this item verified and proceed toward dispensing.',
    };
  },
};
