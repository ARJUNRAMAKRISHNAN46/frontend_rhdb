import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Boxes,
  History,
  BarChart3,
  Search,
  ChevronRight,
} from 'lucide-react';
import { ActiveSection } from '@/types/pharmacy';
import { PharmacyService } from '@/services/pharmacyService';
import { ProfileService } from '@/services/profileService';
import { UserProfileData } from '@/types/profile';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { useLocation, useNavigate } from 'react-router-dom';

interface PharmacyShellProps {
  activeSection?: ActiveSection;
  onNavigate?: (section: ActiveSection, contextId?: string) => void;
  children: React.ReactNode;
}

export const PharmacyShell: React.FC<PharmacyShellProps> = ({
  activeSection: propActiveSection,
  onNavigate: propOnNavigate,
  children,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active section from route if not explicitly passed
  const currentPath = location.pathname;
  const activeSection: ActiveSection = (() => {
    if (propActiveSection) return propActiveSection;
    if (currentPath.startsWith('/prescriptions')) return 'prescriptions';
    if (currentPath.startsWith('/medicine-verification')) return 'medicine-verification';
    if (currentPath.startsWith('/inventory')) return 'inventory';
    if (currentPath.startsWith('/dispensing-history')) return 'dispensing-history';
    if (currentPath.startsWith('/reports')) return 'reports';
    return 'dashboard';
  })();

  const handleNav = (section: ActiveSection, contextId?: string) => {
    if (propOnNavigate) {
      propOnNavigate(section, contextId);
    } else {
      if (contextId) {
        navigate(`/${section}?id=${encodeURIComponent(contextId)}`);
      } else {
        navigate(`/${section}`);
      }
    }
  };
  const [prescriptions, setPrescriptions] = useState(PharmacyService.getPrescriptions());
  const [batches, setBatches] = useState(PharmacyService.getBatches());
  const [globalSearch, setGlobalSearch] = useState('');

  // Profile and Settings state
  const [profile, setProfile] = useState<UserProfileData>(ProfileService.getProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'settings'>('profile');

  useEffect(() => {
    const unsubPharmacy = PharmacyService.subscribe(() => {
      setPrescriptions(PharmacyService.getPrescriptions());
      setBatches(PharmacyService.getBatches());
    });

    const unsubProfile = ProfileService.subscribe(() => {
      setProfile(ProfileService.getProfile());
    });

    return () => {
      unsubPharmacy();
      unsubProfile();
    };
  }, []);

  const pendingRxCount = prescriptions.filter((p) => p.status === 'PENDING').length;
  const lowStockCount = batches.filter((b) => b.stockQuantity <= b.reorderThreshold).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveSection,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'prescriptions' as ActiveSection,
      label: 'Prescriptions',
      icon: FileText,
      badge: pendingRxCount > 0 ? pendingRxCount : null,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    },
    {
      id: 'medicine-verification' as ActiveSection,
      label: 'Medicine Verification',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'inventory' as ActiveSection,
      label: 'Inventory',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30',
    },
    {
      id: 'dispensing-history' as ActiveSection,
      label: 'Dispensing History',
      icon: History,
      badge: null,
    },
    {
      id: 'reports' as ActiveSection,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
  ];

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = globalSearch.trim().toUpperCase();
    if (!query) return;

    if (query.startsWith('RX-')) {
      handleNav('prescriptions', query);
    } else if (query.startsWith('BATCH-') || query.startsWith('890')) {
      handleNav('medicine-verification', query);
    } else {
      handleNav('prescriptions', query);
    }
  };

  const openProfileModal = (tab: 'profile' | 'settings') => {
    setProfileModalTab(tab);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased overflow-hidden transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 shadow-xs transition-colors duration-200">
        {/* Brand & Module Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white">
                  RHDB Pharmacy
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                Dispensing & Verification
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Card Footer - Bottom of Sidebar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-950/40">
          <button
            onClick={() => openProfileModal('profile')}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-200/70 dark:hover:bg-zinc-800/70 transition-all text-left group border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700/60"
            title="Click to view & edit Profile and Settings"
          >
            <div className="relative shrink-0">
              <img
                src={profile.basic.avatarUrl}
                alt={profile.basic.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 group-hover:ring-emerald-500 transition-all shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {profile.basic.name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-transform" />
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {profile.basic.role}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {profile.basic.regNumber}
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar - Clean left-aligned search bar only */}
        <header className="h-14 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-6 flex items-center shrink-0 shadow-2xs">
          {/* Quick Search on Left */}
          <form onSubmit={handleGlobalSearch} className="relative w-80 sm:w-96 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Rx ID (RX-94821), Patient, or Batch..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/70 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </form>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Profile & Settings Comprehensive Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={profileModalTab}
      />
    </div>
  );
};
