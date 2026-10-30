import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Boxes,
  Barcode,
  Sparkles,
  ArrowUpDown,
  Filter,
  DollarSign,
  Info,
} from 'lucide-react';
import {
  ActiveSection,
  MedicineBatch,
  MedicineProduct,
  MedicineInventoryItem,
  DosageForm,
} from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';

interface InventoryViewProps {
  onNavigate?: (section: ActiveSection, contextId?: string) => void;
}

const DOSAGE_FORMS: DosageForm[] = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Oral Suspension',
  'Injection',
  'Inhaler',
  'Dispersible Tablet',
  'Ointment',
  'Drops',
];

export const InventoryView: React.FC<InventoryViewProps> = () => {
  const [inventoryItems, setInventoryItems] = useState<MedicineInventoryItem[]>(
    PharmacyService.getMedicinesWithInventory()
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals state
  const [medicineModalMode, setMedicineModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingMedicine, setEditingMedicine] = useState<MedicineProduct | null>(null);

  // Medicine Form state
  const [medFormData, setMedFormData] = useState({
    name: '',
    brandName: '',
    genericName: '',
    strength: '',
    dosageForm: 'Tablet' as DosageForm,
    barcode: '',
    manufacturer: '',
    category: 'Antibiotics',
    reorderThreshold: 30,
    unitPrice: 10,
    packageSize: 10,
    controlledSubstance: false,
    description: '',
  });
  const [medFormErrors, setMedFormErrors] = useState<Record<string, string>>({});

  // Batch Drawer / Modal state
  const [selectedMedicineForBatches, setSelectedMedicineForBatches] = useState<MedicineInventoryItem | null>(null);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);

  // Add Batch Form state
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: '',
    stockQuantity: 50,
    manufacturingDate: '2025-10-01',
    expiryDate: '2027-09-30',
    storageCondition: 'Store in cool and dry place',
    unitPrice: 10,
  });
  const [batchFormErrors, setBatchFormErrors] = useState<Record<string, string>>({});

  // Stock Adjustment Modal state
  const [selectedBatchForAdjust, setSelectedBatchForAdjust] = useState<MedicineBatch | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'REMOVE'>('ADD');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Stock reconciliation / supplier replenishment');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Subscribe to pharmacy reactive state
  useEffect(() => {
    const unsub = PharmacyService.subscribe(() => {
      setInventoryItems(PharmacyService.getMedicinesWithInventory());
    });
    return () => unsub();
  }, []);

  // Sync selected medicine batches if inventory changes
  useEffect(() => {
    if (selectedMedicineForBatches) {
      const updated = inventoryItems.find((i) => i.id === selectedMedicineForBatches.id);
      if (updated) setSelectedMedicineForBatches(updated);
    }
  }, [inventoryItems]);

  // Derived filter categories
  const categories = ['ALL', ...Array.from(new Set(inventoryItems.map((m) => m.category)))];

  // Filtered medicines
  const filteredMedicines = inventoryItems.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.brandName.toLowerCase().includes(q) ||
      item.genericName.toLowerCase().includes(q) ||
      item.barcode.includes(q) ||
      item.manufacturer.toLowerCase().includes(q) ||
      item.batches.some((b) => b.batchNumber.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'IN_STOCK') matchesStatus = item.stockStatus === 'IN_STOCK';
    else if (statusFilter === 'LOW_STOCK') matchesStatus = item.hasLowStock;
    else if (statusFilter === 'OUT_OF_STOCK') matchesStatus = item.totalQuantity === 0;
    else if (statusFilter === 'NEAR_EXPIRY') matchesStatus = item.hasNearExpiryBatch;
    else if (statusFilter === 'EXPIRED') matchesStatus = item.hasExpiredBatch;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // KPI metrics
  const totalMedicines = inventoryItems.length;
  const totalUnits = inventoryItems.reduce((acc, m) => acc + m.totalQuantity, 0);
  const lowStockCount = inventoryItems.filter((m) => m.hasLowStock).length;
  const outOfStockCount = inventoryItems.filter((m) => m.totalQuantity === 0).length;
  const nearExpiryCount = inventoryItems.filter((m) => m.hasNearExpiryBatch).length;
  const expiredCount = inventoryItems.filter((m) => m.hasExpiredBatch).length;

  // Form Validation & Submit: Medicine
  const validateMedicineForm = () => {
    const errors: Record<string, string> = {};
    if (!medFormData.name.trim() || medFormData.name.trim().length < 2) {
      errors.name = 'Medicine name must be at least 2 characters';
    }
    if (!medFormData.strength.trim()) {
      errors.strength = 'Strength / potency is required (e.g. 500mg)';
    }
    if (!medFormData.barcode.trim()) {
      errors.barcode = 'Barcode / GTIN is required';
    }
    if (medFormData.reorderThreshold < 0) {
      errors.reorderThreshold = 'Reorder threshold cannot be negative';
    }
    if (medFormData.unitPrice <= 0) {
      errors.unitPrice = 'Unit price must be greater than zero';
    }
    setMedFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddMedicine = () => {
    setEditingMedicine(null);
    setMedFormData({
      name: '',
      brandName: '',
      genericName: '',
      strength: '',
      dosageForm: 'Tablet',
      barcode: `08901234500${Math.floor(200 + Math.random() * 800)}`,
      manufacturer: '',
      category: 'Antibiotics',
      reorderThreshold: 30,
      unitPrice: 15,
      packageSize: 10,
      controlledSubstance: false,
      description: '',
    });
    setMedFormErrors({});
    setMedicineModalMode('ADD');
  };

  const handleOpenEditMedicine = (item: MedicineInventoryItem) => {
    setEditingMedicine(item);
    setMedFormData({
      name: item.name,
      brandName: item.brandName,
      genericName: item.genericName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      barcode: item.barcode,
      manufacturer: item.manufacturer,
      category: item.category,
      reorderThreshold: item.reorderThreshold,
      unitPrice: item.unitPrice,
      packageSize: item.packageSize,
      controlledSubstance: item.controlledSubstance,
      description: item.description || '',
    });
    setMedFormErrors({});
    setMedicineModalMode('EDIT');
  };

  const handleSaveMedicineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMedicineForm()) return;

    if (medicineModalMode === 'ADD') {
      const res = PharmacyService.addMedicine(medFormData);
      if (!res.success) {
        setMedFormErrors({ general: res.error || 'Failed to add medicine.' });
        return;
      }
    } else if (medicineModalMode === 'EDIT' && editingMedicine) {
      const res = PharmacyService.updateMedicine(editingMedicine.id, medFormData);
      if (!res.success) {
        setMedFormErrors({ general: res.error || 'Failed to update medicine.' });
        return;
      }
    }
    setMedicineModalMode(null);
  };

  // Form Validation & Submit: Batch
  const validateBatchForm = () => {
    const errors: Record<string, string> = {};
    if (!batchFormData.batchNumber.trim()) {
      errors.batchNumber = 'Batch number is required (e.g. AUG-2026-X81)';
    }
    if (batchFormData.stockQuantity < 0) {
      errors.stockQuantity = 'Quantity cannot be negative';
    }
    if (!batchFormData.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    }
    setBatchFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicineForBatches || !validateBatchForm()) return;

    const res = PharmacyService.addBatch({
      medicineId: selectedMedicineForBatches.id,
      name: selectedMedicineForBatches.name,
      genericName: selectedMedicineForBatches.genericName,
      category: selectedMedicineForBatches.category,
      batchNumber: batchFormData.batchNumber.trim().toUpperCase(),
      gtin: selectedMedicineForBatches.barcode,
      serialNumber: `SN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      manufacturer: selectedMedicineForBatches.manufacturer,
      manufacturingDate: batchFormData.manufacturingDate,
      expiryDate: batchFormData.expiryDate,
      stockQuantity: Number(batchFormData.stockQuantity),
      reorderThreshold: selectedMedicineForBatches.reorderThreshold,
      unitPrice: Number(batchFormData.unitPrice),
      authenticityStatus: 'VERIFIED_GENUINE',
      controlledSubstance: selectedMedicineForBatches.controlledSubstance,
      storageCondition: batchFormData.storageCondition,
    });

    if (!res.success) {
      setBatchFormErrors({ general: res.error || 'Failed to register batch.' });
      return;
    }
    setIsAddBatchOpen(false);
  };

  // Submit Stock Adjustment with negative prevention & reason validation
  const handleOpenAdjustModal = (batch: MedicineBatch) => {
    setSelectedBatchForAdjust(batch);
    setAdjustType('ADD');
    setAdjustQuantity(10);
    setAdjustReason('Restocked from supplier shipment');
    setAdjustError(null);
  };

  const handleAdjustSubmit = () => {
    if (!selectedBatchForAdjust) return;

    if (adjustQuantity <= 0) {
      setAdjustError('Adjustment quantity must be greater than zero.');
      return;
    }

    if (!adjustReason.trim()) {
      setAdjustError('A specific reason is mandatory for pharmacy regulatory audit trail.');
      return;
    }

    const delta = adjustType === 'ADD' ? adjustQuantity : -adjustQuantity;
    const result = PharmacyService.adjustStock(selectedBatchForAdjust.id, delta, adjustReason);

    if (!result.success) {
      setAdjustError(result.error || 'Failed to adjust stock.');
      return;
    }

    setSelectedBatchForAdjust(null);
  };

  // Quarantine batch
  const handleQuarantine = (batch: MedicineBatch) => {
    const reason = prompt(
      `Enter reason for quarantining batch ${batch.batchNumber}:`,
      'Cryptographic registry checksum failure or regulatory recall notice'
    );
    if (reason && reason.trim()) {
      PharmacyService.quarantineBatch(batch.id, reason.trim());
    }
  };

  // Helper: Format expiry days
  const getExpiryDetails = (expiryDate: string) => {
    const diff = Math.ceil(
      (new Date(expiryDate).getTime() - new Date('2026-10-26').getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) {
      return { isExpired: true, text: `Expired ${Math.abs(diff)}d ago`, days: diff };
    } else if (diff <= 30) {
      return { isExpired: false, isNear: true, text: `Expires in ${diff}d`, days: diff };
    }
    return { isExpired: false, isNear: false, text: `Expires in ${diff}d`, days: diff };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Inventory
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Stock levels, batch tracking, and reorder alerts
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={handleOpenAddMedicine}
        >
          Add Medicine
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Items
          </span>
          <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
            {totalMedicines}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            In Stock
          </span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {totalUnits}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Low Stock
          </span>
          <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {lowStockCount}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Out of Stock
          </span>
          <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {outOfStockCount}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
            Near Expiry
          </span>
          <p className="text-xl font-bold font-mono text-orange-600 dark:text-orange-400 mt-1">
            {nearExpiryCount}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            Expired
          </span>
          <p className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
            {expiredCount}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medicine name, generic molecule, barcode, batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
            {[
              { id: 'ALL', label: 'All Stock' },
              { id: 'IN_STOCK', label: 'In Stock' },
              { id: 'LOW_STOCK', label: 'Low Stock' },
              { id: 'NEAR_EXPIRY', label: 'Near Expiry' },
              { id: 'EXPIRED', label: 'Expired' },
              { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 font-bold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Medicine Inventory Table */}
      <div className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Medicine Details</th>
                <th className="py-3 px-4">Dosage & Form</th>
                <th className="py-3 px-4">GTIN / Barcode</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Threshold</th>
                <th className="py-3 px-4">Inventory Status</th>
                <th className="py-3 px-4">Batches</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                    <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No medicine records match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Name & Generic */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {item.name}
                          {item.controlledSubstance && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-semibold">
                              Schedule H1
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {item.genericName}
                        </div>
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {item.manufacturer} • {item.category}
                        </div>
                      </td>

                      {/* Strength & Dosage Form */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.strength}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {item.dosageForm} (Pack: {item.packageSize})
                        </div>
                      </td>

                      {/* Barcode / GTIN */}
                      <td className="py-3 px-4 font-mono">
                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-zinc-400" />
                          {item.barcode}
                        </div>
                        <div className="text-[10px] text-zinc-400">GTIN-14 Standard</div>
                      </td>

                      {/* Available Stock (Calculated consistently from batches) */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm font-bold font-mono ${
                            item.totalQuantity === 0
                              ? 'text-rose-600 dark:text-rose-500'
                              : item.hasLowStock
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-zinc-900 dark:text-zinc-100'
                          }`}
                        >
                          {item.totalQuantity}
                        </span>
                        <div className="text-[10px] text-zinc-400">units in stock</div>
                      </td>

                      {/* Reorder Threshold */}
                      <td className="py-3 px-4 text-center font-mono text-zinc-600 dark:text-zinc-400">
                        {item.reorderThreshold}
                        <div className="text-[10px] text-zinc-400">min buffer</div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        <StatusBadge status={item.stockStatus} size="sm" />
                        {item.hasExpiredBatch && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                            ⚠️ Has expired batch
                          </div>
                        )}
                        {item.hasNearExpiryBatch && (
                          <div className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-0.5">
                            ⏳ Expiring soon
                          </div>
                        )}
                      </td>

                      {/* Batches count & Quick preview */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMedicineForBatches(item)}
                          className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] flex items-center gap-1.5 transition-colors border border-zinc-200 dark:border-zinc-700"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {item.batchCount} {item.batchCount === 1 ? 'Batch' : 'Batches'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMedicineForBatches(item)}
                          >
                            Manage Batches
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditMedicine(item)}
                            title="Edit Medicine Record"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-zinc-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add or Edit Medicine Form */}
      {medicineModalMode && (
        <Modal
          isOpen={!!medicineModalMode}
          onClose={() => setMedicineModalMode(null)}
          title={medicineModalMode === 'ADD' ? 'Add New Medicine Record' : 'Edit Medicine Details'}
          description="Update formulary catalog, packaging, and reorder trigger specifications."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveMedicineSubmit} className="space-y-4 text-xs">
            {medFormErrors.general && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {medFormErrors.general}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Medicine Full Name *
                </label>
                <input
                  type="text"
                  value={medFormData.name}
                  onChange={(e) => setMedFormData({ ...medFormData, name: e.target.value })}
                  placeholder="e.g. Augmentin 625 Duo"
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                {medFormErrors.name && (
                  <p className="text-[10px] text-rose-600 mt-0.5">{medFormErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={medFormData.brandName}
                  onChange={(e) => setMedFormData({ ...medFormData, brandName: e.target.value })}
                  placeholder="e.g. Augmentin"
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Generic Active Molecule
                </label>
                <input
                  type="text"
                  value={medFormData.genericName}
                  onChange={(e) => setMedFormData({ ...medFormData, genericName: e.target.value })}
                  placeholder="e.g. Amoxicillin + Clavulanic Acid (500mg/125mg)"
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Strength / Potency *
                </label>
                <input
                  type="text"
                  value={medFormData.strength}
                  onChange={(e) => setMedFormData({ ...medFormData, strength: e.target.value })}
                  placeholder="e.g. 625mg, 500mg, 40mg"
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                {medFormErrors.strength && (
                  <p className="text-[10px] text-rose-600 mt-0.5">{medFormErrors.strength}</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Dosage Form *
                </label>
                <select
                  value={medFormData.dosageForm}
                  onChange={(e) =>
                    setMedFormData({ ...medFormData, dosageForm: e.target.value as DosageForm })
                  }
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                >
                  {DOSAGE_FORMS.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  GTIN / Barcode *
                </label>
                <input
                  type="text"
                  value={medFormData.barcode}
                  onChange={(e) => setMedFormData({ ...medFormData, barcode: e.target.value })}
                  placeholder="e.g. 08901234500101"
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                {medFormErrors.barcode && (
                  <p className="text-[10px] text-rose-600 mt-0.5">{medFormErrors.barcode}</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={medFormData.manufacturer}
                  onChange={(e) => setMedFormData({ ...medFormData, manufacturer: e.target.value })}
                  placeholder="e.g. GlaxoSmithKline Pharma"
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Reorder Threshold (Units) *
                </label>
                <input
                  type="number"
                  min={0}
                  value={medFormData.reorderThreshold}
                  onChange={(e) =>
                    setMedFormData({ ...medFormData, reorderThreshold: Math.max(0, Number(e.target.value)) })
                  }
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
                {medFormErrors.reorderThreshold && (
                  <p className="text-[10px] text-rose-600 mt-0.5">{medFormErrors.reorderThreshold}</p>
                )}
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                  Unit Price (₹ / $) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0.1}
                  value={medFormData.unitPrice}
                  onChange={(e) =>
                    setMedFormData({ ...medFormData, unitPrice: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="controlledSubstance"
                checked={medFormData.controlledSubstance}
                onChange={(e) =>
                  setMedFormData({ ...medFormData, controlledSubstance: e.target.checked })
                }
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="controlledSubstance" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                Controlled Substance (Schedule H1 / Strict statutory custody required)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setMedicineModalMode(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {medicineModalMode === 'ADD' ? 'Create Medicine Record' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Batch Management & History Drawer */}
      {selectedMedicineForBatches && (
        <Modal
          isOpen={!!selectedMedicineForBatches}
          onClose={() => {
            setSelectedMedicineForBatches(null);
            setIsAddBatchOpen(false);
          }}
          title={`Batches: ${selectedMedicineForBatches.name}`}
          description={`Total Stock: ${selectedMedicineForBatches.totalQuantity} units • Reorder Trigger: ${selectedMedicineForBatches.reorderThreshold} units`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header / Add Batch Trigger */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedMedicineForBatches.genericName}
                </p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  GTIN: {selectedMedicineForBatches.barcode} • Manufacturer: {selectedMedicineForBatches.manufacturer}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsAddBatchOpen(!isAddBatchOpen)}
              >
                {isAddBatchOpen ? 'Cancel' : 'Receive New Batch'}
              </Button>
            </div>

            {/* Inline Add Batch Form */}
            {isAddBatchOpen && (
              <form
                onSubmit={handleSaveBatchSubmit}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30 space-y-3"
              >
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Receive New Inventory Batch
                </h4>

                {batchFormErrors.general && (
                  <p className="text-[10px] text-rose-600">{batchFormErrors.general}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mb-0.5">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      value={batchFormData.batchNumber}
                      onChange={(e) =>
                        setBatchFormData({ ...batchFormData, batchNumber: e.target.value })
                      }
                      placeholder="e.g. AUG-2026-X99"
                      className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {batchFormErrors.batchNumber && (
                      <p className="text-[9px] text-rose-600">{batchFormErrors.batchNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mb-0.5">
                      Received Quantity *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={batchFormData.stockQuantity}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          stockQuantity: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mb-0.5">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={batchFormData.expiryDate}
                      onChange={(e) =>
                        setBatchFormData({ ...batchFormData, expiryDate: e.target.value })
                      }
                      className="w-full px-2.5 py-1 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddBatchOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Register Batch
                  </Button>
                </div>
              </form>
            )}

            {/* Batches Table */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Batch Number</th>
                    <th className="py-2.5 px-3">Expiry Status</th>
                    <th className="py-2.5 px-3 text-center">Units in Stock</th>
                    <th className="py-2.5 px-3">Integrity</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {selectedMedicineForBatches.batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400">
                        No batch records registered for this medicine yet.
                      </td>
                    </tr>
                  ) : (
                    selectedMedicineForBatches.batches.map((batch) => {
                      const exp = getExpiryDetails(batch.expiryDate);
                      const isQuarantined =
                        batch.authenticityStatus === 'SUSPICIOUS' ||
                        batch.authenticityStatus === 'RECALLED';

                      return (
                        <tr
                          key={batch.id}
                          className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                            exp.isExpired
                              ? 'bg-rose-50/50 dark:bg-rose-950/20'
                              : isQuarantined
                              ? 'bg-amber-50/50 dark:bg-amber-950/20'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">
                              {batch.batchNumber}
                            </span>
                            <div className="text-[10px] text-zinc-400">
                              Mfg: {batch.manufacturingDate}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span>{batch.expiryDate}</span>
                              {exp.isExpired ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                                  EXPIRED (DO NOT DISPENSE)
                                </span>
                              ) : exp.isNear ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
                                  {exp.text}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-400">Valid</span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {batch.stockQuantity}
                          </td>

                          <td className="py-2.5 px-3">
                            <StatusBadge status={batch.authenticityStatus} size="sm" />
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAdjustModal(batch)}
                              >
                                Adjust Stock
                              </Button>
                              {!isQuarantined && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => handleQuarantine(batch)}
                                >
                                  Quarantine
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Safety Guidance Card */}
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  Regulatory Compliance Rule:
                </span>{' '}
                Expired batches are permanently locked from prescription fulfillment. Any physical adjustments must be accompanied by an audit reason.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: Stock Adjustment (Preventing Negative Inventory & Enforcing Reason) */}
      {selectedBatchForAdjust && (
        <Modal
          isOpen={!!selectedBatchForAdjust}
          onClose={() => setSelectedBatchForAdjust(null)}
          title={`Adjust Batch Stock: ${selectedBatchForAdjust.batchNumber}`}
          description={`Medicine: ${selectedBatchForAdjust.name} • Available Balance: ${selectedBatchForAdjust.stockQuantity} units`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            {adjustError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium">{adjustError}</span>
              </div>
            )}

            {/* Toggle Add vs Deduct */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustType('ADD');
                  setAdjustError(null);
                }}
                className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustType === 'ADD'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Plus className="w-4 h-4" /> Add Received Stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustType('REMOVE');
                  setAdjustError(null);
                }}
                className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustType === 'REMOVE'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-2xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Minus className="w-4 h-4" /> Deduct / Damage / Write-off
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-medium">
                  Quantity ({adjustType === 'ADD' ? '+' : '-'})
                </label>
                <span className="text-[11px] text-zinc-500">
                  Current: <strong className="font-mono">{selectedBatchForAdjust.stockQuantity}</strong> units
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={adjustType === 'REMOVE' ? selectedBatchForAdjust.stockQuantity : undefined}
                value={adjustQuantity}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setAdjustQuantity(val);
                  if (adjustType === 'REMOVE' && val > selectedBatchForAdjust.stockQuantity) {
                    setAdjustError(
                      `Cannot deduct ${val} units. Maximum available stock is ${selectedBatchForAdjust.stockQuantity} units.`
                    );
                  } else {
                    setAdjustError(null);
                  }
                }}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Mandatory Reason for Adjustment *
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => {
                  setAdjustReason(e.target.value);
                  if (e.target.value.trim()) setAdjustError(null);
                }}
                placeholder="e.g. Supplier delivery, transit breakage, physical audit correction..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            {/* Real-time Resulting Stock Preview */}
            <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Resulting Stock Balance:</span>
              <span
                className={`font-bold ${
                  adjustType === 'REMOVE' && adjustQuantity > selectedBatchForAdjust.stockQuantity
                    ? 'text-rose-600'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {adjustType === 'ADD'
                  ? selectedBatchForAdjust.stockQuantity + adjustQuantity
                  : Math.max(0, selectedBatchForAdjust.stockQuantity - adjustQuantity)}{' '}
                units
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedBatchForAdjust(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={
                  adjustType === 'REMOVE' && adjustQuantity > selectedBatchForAdjust.stockQuantity
                }
                onClick={handleAdjustSubmit}
              >
                Confirm Inventory Adjustment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
