export interface UserBasicDetails {
  id: string;
  name: string;
  role: string;
  regNumber: string;
  email: string;
  phone: string;
  qualification: string;
  avatarUrl: string;
  joinedDate: string;
}

export interface PharmacyDetails {
  name: string;
  branchCode: string;
  drugLicense20B: string;
  drugLicense21B: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  operatingHours: string;
  rhdbNodeId: string;
}

export interface OwnerDetails {
  ownerName: string;
  ownershipType: string;
  contactPhone: string;
  email: string;
  panNumber: string;
  identificationType: string;
  registeredOffice: string;
}

export type StaffRole =
  | 'Chief Pharmacist'
  | 'Senior Pharmacist'
  | 'Assistant Pharmacist'
  | 'Pharmacy Technician'
  | 'Inventory Specialist';

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'OFF_DUTY';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  licenseNumber: string;
  phone: string;
  email: string;
  shift: string;
  status: StaffStatus;
  assignedCounter: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  soundAlertsEnabled: boolean;
  autoScheduleH1Log: boolean;
  lastPasswordChanged: string;
}

export interface UserProfileData {
  basic: UserBasicDetails;
  pharmacy: PharmacyDetails;
  owner: OwnerDetails;
  staff: StaffMember[];
  security: SecuritySettings;
}
