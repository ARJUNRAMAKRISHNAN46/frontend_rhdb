import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Briefcase,
  Users,
  Settings as SettingsIcon,
  KeyRound,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
  Edit2,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileCheck,
  Award,
  IdCard,
} from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { ProfileService } from '@/services/profileService';
import {
  UserProfileData,
  UserBasicDetails,
  PharmacyDetails,
  OwnerDetails,
  StaffMember,
  StaffRole,
  StaffStatus,
} from '@/types/profile';
import { Button } from '@/components/common/Button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'settings';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const { themeMode, setThemeMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);
  const [profileSubTab, setProfileSubTab] = useState<'basic' | 'pharmacy' | 'owner' | 'staff'>('basic');

  const [profile, setProfile] = useState<UserProfileData>(ProfileService.getProfile());

  // Edit states for sections
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState<UserBasicDetails>(profile.basic);

  const [isEditingPharmacy, setIsEditingPharmacy] = useState(false);
  const [pharmacyForm, setPharmacyForm] = useState<PharmacyDetails>(profile.pharmacy);

  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerForm, setOwnerForm] = useState<OwnerDetails>(profile.owner);

  // Staff management state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<Omit<StaffMember, 'id'>>({
    name: '',
    role: 'Assistant Pharmacist',
    licenseNumber: '',
    phone: '',
    email: '',
    shift: 'Morning (08:00 - 16:30)',
    status: 'ACTIVE',
    assignedCounter: 'Counter 1',
  });

  // Password update states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = ProfileService.subscribe(() => {
      const updated = ProfileService.getProfile();
      setProfile(updated);
      setBasicForm(updated.basic);
      setPharmacyForm(updated.pharmacy);
      setOwnerForm(updated.owner);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setPasswordSuccess(null);
      setPasswordError(null);
      setStatusMessage(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Handlers
  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    ProfileService.updateBasicDetails(basicForm);
    setIsEditingBasic(false);
    showToast('Basic profile details updated successfully');
  };

  const handleSavePharmacy = (e: React.FormEvent) => {
    e.preventDefault();
    ProfileService.updatePharmacyDetails(pharmacyForm);
    setIsEditingPharmacy(false);
    showToast('Pharmacy establishment details updated');
  };

  const handleSaveOwner = (e: React.FormEvent) => {
    e.preventDefault();
    ProfileService.updateOwnerDetails(ownerForm);
    setIsEditingOwner(false);
    showToast('Licensee & Owner information updated');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.phone) {
      alert('Please fill in required staff fields');
      return;
    }
    ProfileService.addStaffMember(staffForm);
    setIsAddStaffOpen(false);
    setStaffForm({
      name: '',
      role: 'Assistant Pharmacist',
      licenseNumber: '',
      phone: '',
      email: '',
      shift: 'Morning (08:00 - 16:30)',
      status: 'ACTIVE',
      assignedCounter: 'Counter 1',
    });
    showToast('New staff member registered successfully');
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove staff member "${name}"?`)) {
      ProfileService.deleteStaffMember(id);
      showToast(`Removed staff member: ${name}`);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    const res = ProfileService.updatePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // Preset avatar selections
  const presetAvatars = [
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1594824813589-cf22880a6b98?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Profile & Settings
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Operator account, pharmacy details, staff roster, and preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top-Level Tabs (Profile vs Settings) */}
        <div className="px-6 pt-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'profile'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile & Pharmacy Details</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'settings'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings & Security</span>
            </button>
          </div>

          {/* Quick status toast */}
          {statusMessage && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' ? (
            <div>
              {/* Profile Sub-navigation (Basic Details | Pharmacy Details | Owner Details | Staff Details) */}
              <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl mb-6 text-xs font-medium">
                <button
                  onClick={() => setProfileSubTab('basic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    profileSubTab === 'basic'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Basic Details</span>
                </button>
                <button
                  onClick={() => setProfileSubTab('pharmacy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    profileSubTab === 'pharmacy'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Pharmacy Details</span>
                </button>
                <button
                  onClick={() => setProfileSubTab('owner')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    profileSubTab === 'owner'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Owner Details</span>
                </button>
                <button
                  onClick={() => setProfileSubTab('staff')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    profileSubTab === 'staff'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Staff Details ({profile.staff.length})</span>
                </button>
              </div>

              {/* 1. BASIC DETAILS SECTION */}
              {profileSubTab === 'basic' && (
                <div className="space-y-6">
                  {/* Avatar & Header Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                      <img
                        src={profile.basic.avatarUrl}
                        alt={profile.basic.name}
                        className="w-20 h-20 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-md"
                      />
                      <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {profile.basic.name}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
                          {profile.basic.regNumber}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {profile.basic.role} &bull; {profile.basic.qualification}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-center sm:justify-start gap-3">
                        <span>Station: {profile.pharmacy.name}</span>
                        <span>&bull;</span>
                        <span>Joined: {profile.basic.joinedDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isEditingBasic ? 'secondary' : 'primary'}
                        size="sm"
                        icon={isEditingBasic ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        onClick={() => setIsEditingBasic(!isEditingBasic)}
                      >
                        {isEditingBasic ? 'Cancel Edit' : 'Edit Basic Details'}
                      </Button>
                    </div>
                  </div>

                  {/* Edit Basic Details Form OR View Mode */}
                  {isEditingBasic ? (
                    <form onSubmit={handleSaveBasic} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Edit Basic Information
                        </h4>
                        <span className="text-[11px] text-zinc-500">All fields update in real time</span>
                      </div>

                      {/* Avatar Selector */}
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
                          Select Profile Photo
                        </label>
                        <div className="flex items-center gap-3">
                          {presetAvatars.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setBasicForm({ ...basicForm, avatarUrl: url })}
                              className={`relative rounded-full p-0.5 transition-all ${
                                basicForm.avatarUrl === url
                                  ? 'ring-2 ring-emerald-500 scale-105'
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt={`Avatar ${idx}`} className="w-10 h-10 rounded-full object-cover" />
                              {basicForm.avatarUrl === url && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px]">
                                  ✓
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={basicForm.name}
                            onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Role / Designation *
                          </label>
                          <input
                            type="text"
                            required
                            value={basicForm.role}
                            onChange={(e) => setBasicForm({ ...basicForm, role: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Pharmacist Registration # (PCI / State) *
                          </label>
                          <input
                            type="text"
                            required
                            value={basicForm.regNumber}
                            onChange={(e) => setBasicForm({ ...basicForm, regNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Academic Qualification
                          </label>
                          <input
                            type="text"
                            value={basicForm.qualification}
                            onChange={(e) => setBasicForm({ ...basicForm, qualification: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Official Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={basicForm.email}
                            onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Contact Phone *
                          </label>
                          <input
                            type="text"
                            required
                            value={basicForm.phone}
                            onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingBasic(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />}>
                          Save Profile Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <IdCard className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Professional Credentials</span>
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">License Authority:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Pharmacy Council of India (PCI)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Registration Number:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{profile.basic.regNumber}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Registered Pharmacist:</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Check className="w-3 h-3" /> Active & Verified
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-zinc-500">Degree & Specialization:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.basic.qualification}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Contact & Station Information</span>
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Email Address:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.basic.email}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Primary Phone:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.basic.phone}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Dispensing Counter:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">Main Dispensary - Counter #01</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-zinc-500">RHDB Station Node:</span>
                            <span className="font-mono text-zinc-800 dark:text-zinc-200">{profile.pharmacy.rhdbNodeId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. PHARMACY DETAILS SECTION */}
              {profileSubTab === 'pharmacy' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Pharmacy Details
                      </h3>
                    </div>
                    <Button
                      variant={isEditingPharmacy ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isEditingPharmacy ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => setIsEditingPharmacy(!isEditingPharmacy)}
                    >
                      {isEditingPharmacy ? 'Cancel' : 'Edit Pharmacy Details'}
                    </Button>
                  </div>

                  {isEditingPharmacy ? (
                    <form onSubmit={handleSavePharmacy} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Pharmacy Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={pharmacyForm.name}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, name: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Branch Code
                          </label>
                          <input
                            type="text"
                            value={pharmacyForm.branchCode}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, branchCode: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Drug License No. (Form 20B - Retail) *
                          </label>
                          <input
                            type="text"
                            required
                            value={pharmacyForm.drugLicense20B}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, drugLicense20B: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Drug License No. (Form 21B - Wholesale/Dispensing) *
                          </label>
                          <input
                            type="text"
                            required
                            value={pharmacyForm.drugLicense21B}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, drugLicense21B: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            GSTIN / Tax ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={pharmacyForm.gstin}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, gstin: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Operating Hours
                          </label>
                          <input
                            type="text"
                            value={pharmacyForm.operatingHours}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, operatingHours: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Street Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={pharmacyForm.address}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, address: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            City / District
                          </label>
                          <input
                            type="text"
                            value={pharmacyForm.city}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, city: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            State & PIN Code
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={pharmacyForm.state}
                              onChange={(e) => setPharmacyForm({ ...pharmacyForm, state: e.target.value })}
                              placeholder="State"
                              className="w-2/3 px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={pharmacyForm.pincode}
                              onChange={(e) => setPharmacyForm({ ...pharmacyForm, pincode: e.target.value })}
                              placeholder="PIN"
                              className="w-1/3 px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Dispensary Helpline Phone
                          </label>
                          <input
                            type="text"
                            value={pharmacyForm.phone}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, phone: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Dispensary Official Email
                          </label>
                          <input
                            type="email"
                            value={pharmacyForm.email}
                            onChange={(e) => setPharmacyForm({ ...pharmacyForm, email: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingPharmacy(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />}>
                          Save Pharmacy Details
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* Overview Box */}
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                              {profile.pharmacy.name}
                            </h4>
                            <span className="text-xs text-zinc-500 font-mono">Code: {profile.pharmacy.branchCode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                              Authorized Retail Pharmacy
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2.5">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Address:</span>
                                <p className="text-zinc-600 dark:text-zinc-400">
                                  {profile.pharmacy.address}, {profile.pharmacy.city}, {profile.pharmacy.state} - {profile.pharmacy.pincode}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Hours: </span>
                                <span className="text-zinc-600 dark:text-zinc-400">{profile.pharmacy.operatingHours}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Helpline: </span>
                                <span className="text-zinc-600 dark:text-zinc-400">{profile.pharmacy.phone}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Email: </span>
                                <span className="text-zinc-600 dark:text-zinc-400">{profile.pharmacy.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Regulatory Licenses Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
                            <span>Form 20B License</span>
                            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {profile.pharmacy.drugLicense20B}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                            Valid & Inspected
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
                            <span>Form 21B License</span>
                            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {profile.pharmacy.drugLicense21B}
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                            Schedule H1 Authorized
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/40">
                          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1 flex items-center justify-between">
                            <span>GSTIN Registration</span>
                            <Award className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {profile.pharmacy.gstin}
                          </div>
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                            Tax Compliance OK
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. OWNER DETAILS SECTION */}
              {profileSubTab === 'owner' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Owner Details
                      </h3>
                    </div>
                    <Button
                      variant={isEditingOwner ? 'secondary' : 'primary'}
                      size="sm"
                      icon={isEditingOwner ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                      onClick={() => setIsEditingOwner(!isEditingOwner)}
                    >
                      {isEditingOwner ? 'Cancel' : 'Edit Owner Details'}
                    </Button>
                  </div>

                  {isEditingOwner ? (
                    <form onSubmit={handleSaveOwner} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Owner / Licensee Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={ownerForm.ownerName}
                            onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Ownership Type *
                          </label>
                          <input
                            type="text"
                            required
                            value={ownerForm.ownershipType}
                            onChange={(e) => setOwnerForm({ ...ownerForm, ownershipType: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Owner Contact Phone *
                          </label>
                          <input
                            type="text"
                            required
                            value={ownerForm.contactPhone}
                            onChange={(e) => setOwnerForm({ ...ownerForm, contactPhone: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Owner Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={ownerForm.email}
                            onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            PAN / National Tax ID *
                          </label>
                          <input
                            type="text"
                            required
                            value={ownerForm.panNumber}
                            onChange={(e) => setOwnerForm({ ...ownerForm, panNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Government ID Verification Status
                          </label>
                          <input
                            type="text"
                            value={ownerForm.identificationType}
                            onChange={(e) => setOwnerForm({ ...ownerForm, identificationType: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Registered Corporate Office Address
                          </label>
                          <input
                            type="text"
                            value={ownerForm.registeredOffice}
                            onChange={(e) => setOwnerForm({ ...ownerForm, registeredOffice: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingOwner(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />}>
                          Save Owner Details
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Owner Identity & Legal Form</span>
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Legal Name:</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{profile.owner.ownerName}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Ownership Structure:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.owner.ownershipType}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">PAN / Tax ID:</span>
                            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{profile.owner.panNumber}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-zinc-500">KYC Status:</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" /> {profile.owner.identificationType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Direct Contact & Corporate Office</span>
                        </h4>
                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Direct Phone:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.owner.contactPhone}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                            <span className="text-zinc-500">Direct Email:</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">{profile.owner.email}</span>
                          </div>
                          <div className="py-1">
                            <span className="text-zinc-500 block mb-0.5">Corporate Headquarters:</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                              {profile.owner.registeredOffice}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. STAFF DETAILS SECTION */}
              {profileSubTab === 'staff' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Staff Roster ({profile.staff.length})
                      </h3>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus className="w-3.5 h-3.5" />}
                      onClick={() => setIsAddStaffOpen(true)}
                    >
                      Add Staff Member
                    </Button>
                  </div>

                  {/* Add Staff Modal / Form Drawer */}
                  {isAddStaffOpen && (
                    <form onSubmit={handleAddStaff} className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                          Register New Pharmacy Personnel
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddStaffOpen(false)}
                          className="text-zinc-400 hover:text-zinc-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Personnel Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Anjali Verma"
                            value={staffForm.name}
                            onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Role / Job Title *
                          </label>
                          <select
                            value={staffForm.role}
                            onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as StaffRole })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Chief Pharmacist">Chief Pharmacist</option>
                            <option value="Senior Pharmacist">Senior Pharmacist</option>
                            <option value="Assistant Pharmacist">Assistant Pharmacist</option>
                            <option value="Pharmacy Technician">Pharmacy Technician</option>
                            <option value="Inventory Specialist">Inventory Specialist</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            License Number (if applicable)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. PCI-DL-38192"
                            value={staffForm.licenseNumber}
                            onChange={(e) => setStaffForm({ ...staffForm, licenseNumber: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Contact Phone *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="+91 98..."
                            value={staffForm.phone}
                            onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Shift Schedule
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Morning (08:00 - 16:30)"
                            value={staffForm.shift}
                            onChange={(e) => setStaffForm({ ...staffForm, shift: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Assigned Counter
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Counter 2 - Fast Track"
                            value={staffForm.assignedCounter}
                            onChange={(e) => setStaffForm({ ...staffForm, assignedCounter: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddStaffOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                          Register Staff
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Staff Table */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-3">Personnel</th>
                          <th className="py-2.5 px-3">Role & License</th>
                          <th className="py-2.5 px-3">Contact</th>
                          <th className="py-2.5 px-3">Shift & Counter</th>
                          <th className="py-2.5 px-3">Duty Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {profile.staff.map((staff) => (
                          <tr key={staff.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {staff.name}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">ID: {staff.id}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-zinc-800 dark:text-zinc-200 font-medium">{staff.role}</div>
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                                {staff.licenseNumber || 'Internal Staff'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-zinc-700 dark:text-zinc-300">{staff.phone}</div>
                              <div className="text-[10px] text-zinc-400">{staff.email}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="text-zinc-700 dark:text-zinc-300">{staff.shift}</div>
                              <div className="text-[10px] text-zinc-500">{staff.assignedCounter}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  staff.status === 'ACTIVE'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                    : staff.status === 'ON_LEAVE'
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                {staff.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {staff.id !== 'STF-01' && (
                                <button
                                  onClick={() => handleDeleteStaff(staff.id, staff.name)}
                                  className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors"
                                  title="Delete Staff Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* SETTINGS TAB */
            <div className="space-y-6">
              {/* Appearance / Theme Settings */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Theme
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light Mode Option */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      themeMode === 'light'
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Sun className="w-4 h-4" />
                      </div>
                      {themeMode === 'light' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Light Mode</div>
                      <div className="text-[11px] text-zinc-500">Crisp daytime clarity for bright environments</div>
                    </div>
                  </button>

                  {/* Dark Mode Option */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      themeMode === 'dark'
                        ? 'border-emerald-600 bg-zinc-900 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Moon className="w-4 h-4" />
                      </div>
                      {themeMode === 'dark' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Dark Mode</div>
                      <div className="text-[11px] text-zinc-500">OLED high contrast for prolonged shifts & night duty</div>
                    </div>
                  </button>

                  {/* System Sync Option */}
                  <button
                    type="button"
                    onClick={() => setThemeMode('system')}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      themeMode === 'system'
                        ? 'border-emerald-600 bg-zinc-100 dark:bg-zinc-800 ring-2 ring-emerald-500/20 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Laptop className="w-4 h-4" />
                      </div>
                      {themeMode === 'system' && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">System Sync</div>
                      <div className="text-[11px] text-zinc-500">Automatically follow OS / browser color scheme</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Password Management */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Change Password
                  </h3>
                </div>

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      >
                        {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          placeholder="Min. 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-9 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                        >
                          {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {newPassword && (
                    <div className="text-[11px] text-zinc-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        <span>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        <span>Passwords match</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1">
                    <Button type="submit" variant="primary" size="sm" icon={<Save className="w-3.5 h-3.5" />}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security Audit Badge */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Last security credential audit: {profile.security.lastPasswordChanged}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    ProfileService.resetToDefault();
                    showToast('Demo profile restored to defaults');
                  }}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline"
                >
                  Reset Demo Profile Data
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Branch #{profile.pharmacy.branchCode}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
