import {
  UserProfileData,
  UserBasicDetails,
  PharmacyDetails,
  OwnerDetails,
  StaffMember,
  SecuritySettings,
} from '@/types/profile';

const STORAGE_KEY = 'rhdb_pharmacy_profile_v1';

const INITIAL_PROFILE: UserProfileData = {
  basic: {
    id: 'PHARM-USR-01',
    name: 'Rajesh Kumar',
    role: 'Lead Pharmacist & Operations Head',
    regNumber: 'PCI-DL-88291',
    email: 'rajesh.kumar@apollomedzone.in',
    phone: '+91 98102 34567',
    qualification: 'M.Pharm (Pharmacology), R.Ph',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    joinedDate: '2023-04-15',
  },
  pharmacy: {
    name: 'Apollo Medzone Dispensary #01',
    branchCode: 'APO-NDLS-044',
    drugLicense20B: 'DL-20B/EZ-49219',
    drugLicense21B: 'DL-21B/EZ-49220',
    gstin: '07AABCA1234F1Z5',
    address: 'Shop 12-14, Ground Floor, Central Plaza, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    phone: '+91 11 2341 8900',
    email: 'delhi01@apollomedzone.in',
    operatingHours: '24x7 Emergency Services & Scheduled Fulfillment',
    rhdbNodeId: 'RHDB-NODE-DL-0081-SECURE',
  },
  owner: {
    ownerName: 'Dr. Arvind Somani',
    ownershipType: 'Sole Proprietorship / Licensed Partner',
    contactPhone: '+91 98111 22334',
    email: 'arvind.somani@somanihealthcare.in',
    panNumber: 'ABCPS1234D',
    identificationType: 'Aadhaar / National Identity Verified',
    registeredOffice: 'Somani Healthcare Corporate Towers, Sector 44, Gurgaon, HR - 122003',
  },
  staff: [
    {
      id: 'STF-01',
      name: 'Rajesh Kumar',
      role: 'Chief Pharmacist',
      licenseNumber: 'PCI-DL-88291',
      phone: '+91 98102 34567',
      email: 'rajesh.kumar@apollomedzone.in',
      shift: 'Morning (08:00 - 16:30)',
      status: 'ACTIVE',
      assignedCounter: 'Counter 1 - Prescription Verification & Dispensing',
    },
    {
      id: 'STF-02',
      name: 'Pooja Sharma',
      role: 'Senior Pharmacist',
      licenseNumber: 'PCI-DL-94012',
      phone: '+91 98103 44556',
      email: 'pooja.sharma@apollomedzone.in',
      shift: 'Evening (16:00 - 00:30)',
      status: 'ACTIVE',
      assignedCounter: 'Counter 2 - High Value & Controlled Drugs',
    },
    {
      id: 'STF-03',
      name: 'Vikas Mehra',
      role: 'Assistant Pharmacist',
      licenseNumber: 'PCI-DL-10492',
      phone: '+91 98711 22345',
      email: 'vikas.mehra@apollomedzone.in',
      shift: 'Night (00:00 - 08:30)',
      status: 'ACTIVE',
      assignedCounter: 'Emergency & Trauma Dispensing Counter',
    },
    {
      id: 'STF-04',
      name: 'Sunil Nair',
      role: 'Inventory Specialist',
      licenseNumber: 'INV-REG-4491',
      phone: '+91 98990 11223',
      email: 'sunil.nair@apollomedzone.in',
      shift: 'General Day (09:30 - 18:00)',
      status: 'OFF_DUTY',
      assignedCounter: 'Back-office Warehouse & Quarantine Vault',
    },
  ],
  security: {
    twoFactorEnabled: true,
    soundAlertsEnabled: true,
    autoScheduleH1Log: true,
    lastPasswordChanged: '2026-09-12',
  },
};

type ProfileListener = () => void;
const listeners = new Set<ProfileListener>();

function notify() {
  listeners.forEach((fn) => fn());
}

function loadProfile(): UserProfileData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROFILE;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error loading profile from storage:', e);
    return INITIAL_PROFILE;
  }
}

function saveProfile(data: UserProfileData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    notify();
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

export const ProfileService = {
  getProfile(): UserProfileData {
    return loadProfile();
  },

  subscribe(listener: ProfileListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  updateBasicDetails(updated: Partial<UserBasicDetails>): UserBasicDetails {
    const current = loadProfile();
    const newBasic = { ...current.basic, ...updated };
    current.basic = newBasic;
    saveProfile(current);
    return newBasic;
  },

  updatePharmacyDetails(updated: Partial<PharmacyDetails>): PharmacyDetails {
    const current = loadProfile();
    const newPharmacy = { ...current.pharmacy, ...updated };
    current.pharmacy = newPharmacy;
    saveProfile(current);
    return newPharmacy;
  },

  updateOwnerDetails(updated: Partial<OwnerDetails>): OwnerDetails {
    const current = loadProfile();
    const newOwner = { ...current.owner, ...updated };
    current.owner = newOwner;
    saveProfile(current);
    return newOwner;
  },

  addStaffMember(staff: Omit<StaffMember, 'id'>): StaffMember {
    const current = loadProfile();
    const newMember: StaffMember = {
      ...staff,
      id: `STF-${String(current.staff.length + 1).padStart(2, '0')}`,
    };
    current.staff = [newMember, ...current.staff];
    saveProfile(current);
    return newMember;
  },

  updateStaffMember(id: string, updated: Partial<StaffMember>): void {
    const current = loadProfile();
    current.staff = current.staff.map((s) => (s.id === id ? { ...s, ...updated } : s));
    saveProfile(current);
  },

  deleteStaffMember(id: string): void {
    const current = loadProfile();
    current.staff = current.staff.filter((s) => s.id !== id);
    saveProfile(current);
  },

  updateSecurity(updated: Partial<SecuritySettings>): SecuritySettings {
    const current = loadProfile();
    current.security = { ...current.security, ...updated };
    saveProfile(current);
    return current.security;
  },

  updatePassword(_currentPass: string, _newPass: string): { success: boolean; message: string } {
    // In prototype, simulate password change
    const current = loadProfile();
    current.security.lastPasswordChanged = new Date().toISOString().split('T')[0];
    saveProfile(current);
    return {
      success: true,
      message: 'Password successfully updated! Secure session refreshed.',
    };
  },

  resetToDefault(): void {
    saveProfile(INITIAL_PROFILE);
  },
};
