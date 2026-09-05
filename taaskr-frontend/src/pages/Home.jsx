import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2, Scissors,
  Radio, Award, AlertTriangle, CheckCircle2, ChevronRight, Phone, MessageSquare, 
  FileText, Plus, Bell, RefreshCw, Send, Check, X, ArrowUpRight, HelpCircle, Briefcase, Clock
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Appliances & Electrical', active: true },
  { id: 2, name: 'Civil & Property Maintenance', active: true },
  { id: 3, name: 'Plumbing & Cleaning', active: true },
  { id: 4, name: 'Diagnostic & Healthcare Services', active: true },
  { id: 5, name: 'Logistics', active: true },
  { id: 6, name: "Men's Salon & Massage", active: true },
  { id: 7, name: 'Security Services', active: true }
];

const DEFAULT_SERVICES = [
  { id: 1, name: 'AC Repair & Service', description: 'Comprehensive diagnostics, coil cleaning, and cooling optimization.', price: 699, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 2, name: 'RO Water Purifier Service', description: 'Filter replacement, membrane inspection, and complete purification check.', price: 499, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 3, name: 'Switchboard & Wiring Repair', description: 'Quick inspection and repair of loose wiring, burnt sockets, and tripped breakers.', price: 349, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 4, name: 'Ceiling & Exhaust Fan Repair', description: 'Bearing replacement, speed regulator setup, and quiet motor tuning.', price: 299, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 5, name: 'Tap Leakage & Valve Repair', description: 'Fix dripping faucets, replace internal washers, and ensure seamless water pressure.', price: 299, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 6, name: 'Deep Home & Bathroom Cleaning', description: 'Intensive stain removal, floor sanitization, and eco-friendly disinfection.', price: 1499, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 7, name: 'Blood Test & Sample Collection', description: 'Hygienic at-home phlebotomy with certified NABL accredited lab processing.', price: 499, pricingType: 'FIXED', categoryId: 4, active: true },
  { id: 8, name: 'CCTV Installation & Setup', description: 'HD camera mounting, DVR configuration, and mobile live-view setup.', price: 1199, pricingType: 'FIXED', categoryId: 7, active: true },
  { id: 9, name: 'Mini Truck Goods Transport', description: 'Reliable intra-city tempo transport for furniture, equipment, and shifting.', price: 250, pricingType: 'PER_KM', categoryId: 5, active: true },
  { id: 10, name: 'General Civil & Wall Repair', description: 'Minor masonry, plaster patching, and tile touch-ups by verified masons.', price: 799, pricingType: 'FIXED', categoryId: 2, active: true }
];

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('taaskr_location');
      return saved ? JSON.parse(saved) : { city: 'Indore', pincode: '452001' };
    } catch (e) {
      return { city: 'Indore', pincode: '452001' };
    }
  });

  // Partner Operations State
  const [isOnline, setIsOnline] = useState(true);
  const [showSkillRequestModal, setShowSkillRequestModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [requestedCategory, setRequestedCategory] = useState('');
  const [requestedSkillExp, setRequestedSkillExp] = useState('3');
  const [requestedSkillNotes, setRequestedSkillNotes] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [escalationType, setEscalationType] = useState('PARTS_REIMBURSEMENT');
  const [escalationAmount, setEscalationAmount] = useState('');
  const [escalationBookingId, setEscalationBookingId] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');
  const [escalationSubmitted, setEscalationSubmitted] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem('user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleLocChange = (e) => {
      if (e.detail) setCurrentLocation(e.detail);
    };
    window.addEventListener('taaskr_location_change', handleLocChange);
    return () => window.removeEventListener('taaskr_location_change', handleLocChange);
  }, []);

  // Pagination state for services catalog grid
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 8;

  // Reset page when filtering or searching
  useEffect(() => {
    setServicesPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [cats, servs] = await Promise.all([
          api.catalog.getCategories(),
          api.catalog.getServices()
        ]);
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats.filter(c => c && c.active !== false));
        }
        if (Array.isArray(servs) && servs.length > 0) {
          setServices(servs.filter(s => s && s.active !== false));
        }
      } catch (err) {
        console.warn('Backend catalog sync notice:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Comprehensive multi-token search matcher across service name, description, category name, and keywords
  const doesServiceMatch = (service, query) => {
    if (!service) return false;
    if (!query || !query.trim()) return true;
    const qTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cat = categories.find(c => c && c.id === service.categoryId);
    const catName = (cat?.name || '').toLowerCase();
    const sName = (service.name || '').toLowerCase();
    const sDesc = (service.description || '').toLowerCase();
    const fullText = `${sName} ${catName} ${sDesc}`;

    return qTokens.every(token => fullText.includes(token));
  };

  // Dropdown searches globally across all services
  const searchDropdownResults = searchQuery.trim() === ''
    ? []
    : (services || []).filter(service => doesServiceMatch(service, searchQuery));

  const filteredServices = (services || []).filter(service => {
    if (!service) return false;
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery.trim() === '' || doesServiceMatch(service, searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getCategoryTheme = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    
    // 1. Appliances & Electrical
    if (cat.includes('electric') || cat.includes('appliance') || cat.includes('wire') || cat.includes('switch') || cat.includes('power') || cat.includes('fan') || cat.includes('ac')) {
      return {
        icon: <Zap size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
        primary: '#F59E0B',
        secondary: '#EF4444',
        tertiary: '#FBBF24',
        accentBg: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 50%, #EF4444 100%)',
        shadow1: 'rgba(245, 158, 11, 0.42)',
        shadow2: 'rgba(239, 68, 68, 0.32)',
        shadow3: 'rgba(251, 191, 36, 0.28)',
        glow: 'rgba(245, 158, 11, 0.55)',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        badgeColor: '#FDE047'
      };
    }

    // 2. Plumbing & Cleaning
    if (cat.includes('plumb') || cat.includes('clean') || cat.includes('water') || cat.includes('pipe') || cat.includes('drain') || cat.includes('wash') || cat.includes('tap')) {
      return {
        icon: <Droplets size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        primary: '#06B6D4',
        secondary: '#10B981',
        tertiary: '#2563EB',
        accentBg: 'linear-gradient(135deg, #06B6D4 0%, #059669 50%, #2563EB 100%)',
        shadow1: 'rgba(6, 182, 212, 0.42)',
        shadow2: 'rgba(16, 185, 129, 0.32)',
        shadow3: 'rgba(37, 99, 235, 0.28)',
        glow: 'rgba(6, 182, 212, 0.55)',
        badgeBg: 'rgba(6, 182, 212, 0.2)',
        badgeColor: '#67E8F9'
      };
    }

    // 3. Diagnostic & Healthcare Services
    if (cat.includes('diagnostic') || cat.includes('health') || cat.includes('patholog') || cat.includes('blood') || cat.includes('doctor') || cat.includes('care') || cat.includes('medic') || cat.includes('test')) {
      return {
        icon: <Activity size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
        primary: '#F43F5E',
        secondary: '#14B8A6',
        tertiary: '#A855F7',
        accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 50%, #14B8A6 100%)',
        shadow1: 'rgba(244, 63, 94, 0.42)',
        shadow2: 'rgba(20, 184, 166, 0.32)',
        shadow3: 'rgba(168, 85, 247, 0.28)',
        glow: 'rgba(244, 63, 94, 0.55)',
        badgeBg: 'rgba(244, 63, 94, 0.2)',
        badgeColor: '#FDA4AF'
      };
    }

    // 6. Logistics & Freight
    if (cat.includes('logistics') || cat.includes('mov') || cat.includes('vehicle') || cat.includes('transport') || cat.includes('truck') || cat.includes('cargo') || cat.includes('courier') || cat.includes('freight')) {
      return {
        icon: <Truck size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        tertiary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 50%, #8B5CF6 100%)',
        shadow1: 'rgba(59, 130, 246, 0.42)',
        shadow2: 'rgba(139, 92, 246, 0.32)',
        shadow3: 'rgba(6, 182, 212, 0.28)',
        glow: 'rgba(59, 130, 246, 0.55)',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
        badgeColor: '#93C5FD'
      };
    }

    // 7. Security Services
    if (cat.includes('security') || cat.includes('guard') || cat.includes('cctv') || cat.includes('lock')) {
      return {
        icon: <ShieldCheck size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        tertiary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #EC4899 100%)',
        shadow1: 'rgba(139, 92, 246, 0.42)',
        shadow2: 'rgba(236, 72, 153, 0.32)',
        shadow3: 'rgba(99, 102, 241, 0.28)',
        glow: 'rgba(139, 92, 246, 0.55)',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
        badgeColor: '#C4B5FD'
      };
    }

    // 8. Civil & Property Maintenance
    if (cat.includes('civil') || cat.includes('property') || cat.includes('mason') || cat.includes('roof') || cat.includes('floor')) {
      return {
        icon: <Building2 size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
        primary: '#EA580C',
        secondary: '#F59E0B',
        tertiary: '#E11D48',
        accentBg: 'linear-gradient(135deg, #EA580C 0%, #C2410C 50%, #F59E0B 100%)',
        shadow1: 'rgba(234, 88, 12, 0.42)',
        shadow2: 'rgba(245, 158, 11, 0.32)',
        shadow3: 'rgba(225, 29, 72, 0.28)',
        glow: 'rgba(234, 88, 12, 0.55)',
        badgeBg: 'rgba(234, 88, 12, 0.2)',
        badgeColor: '#FDBA74'
      };
    }

    // 9. Appliances & Hardware
    if (cat.includes('appliance') || cat.includes('repair') || cat.includes('machine')) {
      return {
        icon: <Settings size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        primary: '#0EA5E9',
        secondary: '#6366F1',
        tertiary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #6366F1 100%)',
        shadow1: 'rgba(14, 165, 233, 0.42)',
        shadow2: 'rgba(99, 102, 241, 0.32)',
        shadow3: 'rgba(6, 182, 212, 0.28)',
        glow: 'rgba(14, 165, 233, 0.55)',
        badgeBg: 'rgba(14, 165, 233, 0.2)',
        badgeColor: '#7DD3FC'
      };
    }

    // 10. Men's Salon & Massage
    if (cat.includes('salon') || cat.includes('massage') || cat.includes('barber') || cat.includes('hair') || cat.includes('spa') || cat.includes('men')) {
      return {
        icon: <Scissors size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        primary: '#A855F7',
        secondary: '#EC4899',
        tertiary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #EC4899 100%)',
        shadow1: 'rgba(168, 85, 247, 0.42)',
        shadow2: 'rgba(236, 72, 153, 0.32)',
        shadow3: 'rgba(99, 102, 241, 0.28)',
        glow: 'rgba(168, 85, 247, 0.55)',
        badgeBg: 'rgba(168, 85, 247, 0.2)',
        badgeColor: '#E9D5FF'
      };
    }

    // 11. AC & Cooling
    if (/\bac\b/.test(cat) || cat.includes('cool') || cat.includes('refrigerat')) {
      return {
        icon: <Snowflake size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80',
        primary: '#38BDF8',
        secondary: '#6366F1',
        tertiary: '#0284C7',
        accentBg: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 50%, #6366F1 100%)',
        shadow1: 'rgba(56, 189, 248, 0.42)',
        shadow2: 'rgba(99, 102, 241, 0.32)',
        shadow3: 'rgba(2, 132, 199, 0.28)',
        glow: 'rgba(56, 189, 248, 0.55)',
        badgeBg: 'rgba(56, 189, 248, 0.2)',
        badgeColor: '#BAE6FD'
      };
    }

    // 12. Painting & Walls
    if (cat.includes('paint')) {
      return {
        icon: <Paintbrush size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1562259949-e8ce0f68d60f?auto=format&fit=crop&w=400&q=80',
        primary: '#EC4899',
        secondary: '#8B5CF6',
        tertiary: '#F43F5E',
        accentBg: 'linear-gradient(135deg, #EC4899 0%, #BE185D 50%, #8B5CF6 100%)',
        shadow1: 'rgba(236, 72, 153, 0.42)',
        shadow2: 'rgba(139, 92, 246, 0.32)',
        shadow3: 'rgba(244, 63, 94, 0.28)',
        glow: 'rgba(236, 72, 153, 0.55)',
        badgeBg: 'rgba(236, 72, 153, 0.2)',
        badgeColor: '#F472B6'
      };
    }

    // 13. Carpentry & Wood
    if (cat.includes('carpent') || cat.includes('wood')) {
      return {
        icon: <Ruler size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=400&q=80',
        primary: '#D97706',
        secondary: '#EA580C',
        tertiary: '#CA8A04',
        accentBg: 'linear-gradient(135deg, #D97706 0%, #92400E 50%, #EA580C 100%)',
        shadow1: 'rgba(217, 119, 6, 0.42)',
        shadow2: 'rgba(234, 88, 12, 0.32)',
        shadow3: 'rgba(202, 138, 4, 0.28)',
        glow: 'rgba(217, 119, 6, 0.55)',
        badgeBg: 'rgba(217, 119, 6, 0.2)',
        badgeColor: '#FCD34D'
      };
    }

    // Default / All Services (Vibrant Electric Indigo -> Pink -> Cyan)
    return {
      icon: <LayoutList size={28} strokeWidth={2.4} />,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      primary: '#6366F1',
      secondary: '#EC4899',
      tertiary: '#38BDF8',
      accentBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #EC4899 100%)',
      shadow1: 'rgba(99, 102, 241, 0.42)',
      shadow2: 'rgba(236, 72, 153, 0.32)',
      shadow3: 'rgba(56, 189, 248, 0.28)',
      glow: 'rgba(99, 102, 241, 0.55)',
      badgeBg: 'rgba(99, 102, 241, 0.2)',
      badgeColor: '#C7D2FE'
    };
  };

const EXACT_SERVICE_IMAGES = {
  // Plumbing
  'tap repair': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'pipe leakage fix': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'ceiling leakage fixing': 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
  'drain blockage removal': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',

  // Cleaning
  'bathroom cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'bathroom deep cleaning': 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80',
  'full home cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'house deep cleaning': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80',
  'kitchen deep cleaning': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  'sofa cleaning': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',

  // Electrical
  'switch board repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'fan repair': 'https://images.unsplash.com/photo-1590725140246-20150937a07a?auto=format&fit=crop&w=600&q=80',
  'inverter & battery servicing': 'https://images.unsplash.com/photo-1558441719-646b22ad4409?auto=format&fit=crop&w=600&q=80',

  // Appliances
  'ro repair': 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80',
  'ro installation': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
  'ro maintenance': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  'ac repair': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'ac installation': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
  'ac maintenance': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'refrigerator repair': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
  'washing machine repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',
  'microwave repair': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',

  // Security Services
  'cctv installation': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  'smart lock installation': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80',
  'door lock repair': 'https://images.unsplash.com/photo-1555529902-5261145633bf?auto=format&fit=crop&w=600&q=80',
  'video doorbell installation': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
  'security guard service': 'https://images.unsplash.com/photo-1581568736305-49a04e012c13?auto=format&fit=crop&w=600&q=80',

  // Diagnostic & Health
  'blood test & sample collection': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
  'full body health checkup': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'home diagnostic test': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  'compounder on call': 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',

  // Civil & Maintenance
  'masonry & brickwork': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'waterproofing': 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80',
  'flooring & tiling': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
  'roof & terrace maintenance': 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80',
  'home renovation': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
  'general civil repairs': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',

  // Carpentry
  'carpentry services': 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80',
  'cabinet & woodwork repair': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
  'door & window repair': 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=600&q=80',

  // Salon & Spa
  "men's haircut & grooming": 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  'head & shoulder massage': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  'quick comfort therapy': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',
  'beard styling & shave': 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80',

  // Logistics & Vehicles
  'electric bike': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  'petrol bike': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
  'express courier (local)': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
  'personal items (documents & files)': 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80',
  'electric rickshaw': 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80',
  'loading vehicle (3w)': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
  'loading vehicle': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  'mini truck': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'mini truck (tata ace)': 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=600&q=80',
  'retail store delivery': 'https://images.unsplash.com/photo-1586528116024-e1b1d7d0a2ec?auto=format&fit=crop&w=600&q=80',
  'truck': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  'truck (14ft / 17ft)': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
  'furniture moving': '/furniture-moving.jpg',
  'furniture shifting': '/furniture-moving.jpg',
  'furniture transport': '/furniture-moving.jpg',
  'house shifting & furniture': '/furniture-moving.jpg',
  'heavy truck': 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80'
};

  const getServiceConfig = (serviceName, categoryName) => {
    const rawName = (serviceName || '').trim();
    const name = rawName.toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    const theme = getCategoryTheme(cat);
    
    // 1. Direct exact match from curated dictionary
    let serviceImage = EXACT_SERVICE_IMAGES[name];

    // 2. Intelligent keyword fallback if exact name not in map
    if (!serviceImage) {
      if (name.includes('furniture') || name.includes('sofa') || name.includes('shifting') || name.includes('relocation') || name.includes('movers') || name.includes('packers')) {
        serviceImage = '/furniture-moving.jpg';
      } else if (name.includes('ac ') || name.includes('air condition') || name.includes('cooling') || name.includes('hvac')) {
        serviceImage = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('switch') || name.includes('wire') || name.includes('electric') || name.includes('inverter') || name.includes('fuse') || name.includes('mcb')) {
        serviceImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('fan')) {
        serviceImage = 'https://images.unsplash.com/photo-1590725140246-20150937a07a?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('tap') || name.includes('faucet') || name.includes('basin') || name.includes('sink') || name.includes('valve')) {
        serviceImage = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('pipe') || name.includes('drain') || name.includes('plumb') || name.includes('tank')) {
        serviceImage = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('ro ') || name.includes('purifier') || name.includes('water filter') || name.includes('water clean')) {
        serviceImage = 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('washing machine') || name.includes('laundry')) {
        serviceImage = 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('refrigerator') || name.includes('fridge')) {
        serviceImage = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('bathroom') || name.includes('toilet') || name.includes('washroom')) {
        serviceImage = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('clean') || name.includes('housekeep') || name.includes('dusting') || name.includes('maid')) {
        serviceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('blood') || name.includes('cbc') || name.includes('lab') || name.includes('pathology') || name.includes('sample')) {
        serviceImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('health') || name.includes('doctor') || name.includes('nurse') || name.includes('compounder') || name.includes('patient') || name.includes('diagnostic')) {
        serviceImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('hair') || name.includes('barber') || name.includes('shave') || name.includes('beard') || name.includes('grooming')) {
        serviceImage = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('massage') || name.includes('therapy') || name.includes('spa')) {
        serviceImage = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('cctv') || name.includes('camera') || name.includes('surveillance')) {
        serviceImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('guard') || name.includes('security') || name.includes('officer')) {
        serviceImage = 'https://images.unsplash.com/photo-1581568736305-49a04e012c13?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('lock') || name.includes('doorbell') || name.includes('key')) {
        serviceImage = 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('carpent') || name.includes('wood') || name.includes('cabinet')) {
        serviceImage = 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('waterproof')) {
        serviceImage = 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('roof') || name.includes('terrace')) {
        serviceImage = 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mason') || name.includes('brick') || name.includes('civil') || name.includes('plaster') || name.includes('renovat')) {
        serviceImage = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('bike') || name.includes('courier') || name.includes('document') || name.includes('parcel')) {
        serviceImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('rickshaw') || name.includes('loading') || name.includes('3w')) {
        serviceImage = 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mini truck') || name.includes('tata ace') || name.includes('pickup')) {
        serviceImage = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('truck') || name.includes('tempo') || name.includes('logistics') || name.includes('cargo') || name.includes('transport') || name.includes('freight')) {
        serviceImage = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
      } else {
        serviceImage = theme.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
      }
    }

    return {
      image: serviceImage,
      icon: theme.icon,
      color: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      shadow1: theme.shadow1,
      shadow2: theme.shadow2,
      shadow3: theme.shadow3,
      bg: `${theme.primary}18`
    };
  };

  // If logged in as PROVIDER, render the dedicated Partner Operations & Admin Collaboration Nexus
  if (currentUser && currentUser.role === 'PROVIDER') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
        {/* Partner Executive Operations Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 20px rgba(56, 189, 248, 0.1)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <Radio size={12} className="animate-pulse" />
                  <span>Taaskr Partner Operations Hub</span>
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ID: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>#TK-IND-{currentUser.id ? String(currentUser.id).padStart(4, '0') : '8842'}</strong>
                </span>
              </div>

              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
                Welcome back, {currentUser.name || 'Partner Specialist'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                Connected to <strong>Taaskr Central Operations Desk</strong> • Authorized territory: <strong>Indore Metro & East Zone (15 km dispatch radius)</strong>
              </p>
            </div>

            {/* Live Dispatch Toggle & Quick Launch */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsOnline(!isOnline)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '30px',
                  border: isOnline ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                  backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: isOnline ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isOnline ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10b981' : '#ef4444',
                  boxShadow: isOnline ? '0 0 8px #10b981' : 'none'
                }} />
                <span>{isOnline ? 'Active on Dispatch Grid' : 'Dispatch Paused (On Break)'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  to="/provider"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.825rem', fontWeight: 600 }}
                >
                  <Sparkles size={14} />
                  <span>Open Partner Console</span>
                </Link>
                <button
                  onClick={() => setShowEscalationModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
                >
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span>Admin Help Desk</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ADMIN OPERATIONS BROADCASTS & NOTICES (Admin -> Provider)      */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Bell size={18} color="var(--primary)" />
              <span>Admin Operational Directives & Live Bulletins</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated 10 mins ago • Taaskr Ops Desk</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Bulletin 1: Monsoon Surge Incentive */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Active Surge</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indore East & Vijay Nagar</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                ⚡ +₹150 Emergency Surcharge Incentive
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Admin has activated monsoon emergency surge. Earn an extra <strong>₹150 bonus</strong> on every AC, RO & Electrical repair completed within 45 minutes of customer request.
              </p>
            </div>

            {/* Bulletin 2: Security & OTP Protocol */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Compliance Rule</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Operating Procedure</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                🛡️ Mandatory 4-Digit Start OTP & ID Badge
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                All partners must display the digital Taaskr ID and verify the customer's 4-digit start OTP before commencing work to ensure immediate insurance coverage.
              </p>
            </div>

            {/* Bulletin 3: Payout Notice */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Payout Batch</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weekly Settlement</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                💳 Auto-IMPS Payouts Scheduled
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Next batch settlement will process automatically on <strong>Tuesday 10:00 AM</strong> to your registered bank account. Cash on Delivery collections are reconciled in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PROVIDER-ADMIN SLA & COMPLIANCE GOVERNANCE                      */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Admin-Partner Governance & SLA Compliance Index</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* KYC Card */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KYC & Verification</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>100% Verified</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 500 }}>Aadhaar & Police Clearance OK</div>
              </div>
            </div>

            {/* SLA Rating */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                <Star size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality & SLA Score</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>4.9 ★ Gold Tier</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>98.6% On-Time • 0 Penalties</div>
              </div>
            </div>

            {/* Revenue Share Split */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                flexShrink: 0
              }}>
                <Award size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Partner Revenue Share</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>85% Net Payout</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>15% Platform & Insurance SLA</div>
              </div>
            </div>

            {/* Payout Bank */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
                flexShrink: 0
              }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Settlement Bank</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>HDFC Bank ****4892</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct IMPS / UPI Enabled</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: AUTHORIZED SERVICE CAPABILITY MATRIX (Admin Approved Trades)   */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Briefcase size={18} color="var(--primary)" />
                <span>Admin Approved Service Trades & Capabilities</span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Services authorized by Taaskr Admin for your technician profile to receive automatic customer dispatches.
              </p>
            </div>

            <button
              onClick={() => {
                setRequestSubmitted(false);
                setShowSkillRequestModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              <span>Request New Trade Approval</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { id: 1, name: 'AC Repair & Diagnostics', category: 'Appliances', rate: '₹699', status: 'AUTHORIZED', icon: <Snowflake size={20} color="#38bdf8" /> },
              { id: 2, name: 'RO Water Purifier Servicing', category: 'Appliances', rate: '₹499', status: 'AUTHORIZED', icon: <Droplets size={20} color="#06b6d4" /> },
              { id: 3, name: 'Switchboard & Electrical Wiring', category: 'Electrical', rate: '₹349', status: 'AUTHORIZED', icon: <Zap size={20} color="#f59e0b" /> },
              { id: 4, name: 'Deep Home & Bathroom Cleaning', category: 'Cleaning', rate: '₹1,499', status: 'AUTHORIZED', icon: <Sparkles size={20} color="#10b981" /> },
              { id: 5, name: 'Mini Truck Goods Transport', category: 'Logistics', rate: '₹250/km', status: 'AUTHORIZED', icon: <Truck size={20} color="#a855f7" /> },
              { id: 6, name: 'CCTV & Security Camera Setup', category: 'Security Services', rate: '₹1,199', status: 'AUTHORIZED', icon: <ShieldCheck size={20} color="#ec4899" /> }
            ].map((srv) => (
              <div
                key={srv.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {srv.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem 0' }}>
                      {srv.name}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Category: <span style={{ color: 'var(--text-secondary)' }}>{srv.category}</span> • Base Payout: <strong style={{ color: 'var(--text-main)' }}>{srv.rate}</strong>
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}>
                  ● Approved
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: ADMIN INCIDENT & ESCALATION DESK (Provider -> Admin)           */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Admin Operations & Dispute Desk
              </h2>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Facing on-site issues, spare parts extra costs, or customer unavailability? Connect directly with Taaskr Central Operations for rapid resolution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEscalationType('PARTS_REIMBURSEMENT');
                setEscalationSubmitted(false);
                setShowEscalationModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            >
              <FileText size={14} />
              <span>Claim Extra Parts Cost</span>
            </button>

            <button
              onClick={() => {
                setEscalationType('CUSTOMER_UNREACHABLE');
                setEscalationSubmitted(false);
                setShowEscalationModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            >
              <Phone size={14} />
              <span>Report Customer Unreachable</span>
            </button>

            <a
              href="tel:+917314009000"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem', textDecoration: 'none' }}
            >
              <Phone size={14} />
              <span>Priority Admin Hotline</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: REQUEST NEW TRADE / SKILL AUTHORIZATION FROM ADMIN               */}
        {/* ========================================================================= */}
        {showSkillRequestModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Briefcase size={18} color="var(--primary)" />
                  <span>Request Trade Authorization</span>
                </h3>
                <button
                  onClick={() => setShowSkillRequestModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {requestSubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1rem auto' }}>
                    <Check size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Application Submitted to Admin Desk
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Taaskr Technical Operations will review your certification and dispatch history. You will be notified within 24 hours upon approval.
                  </p>
                  <button
                    onClick={() => setShowSkillRequestModal(false)}
                    className="btn btn-primary btn-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setRequestSubmitted(true);
                }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Service Category to Authorize</label>
                    <select
                      className="form-control"
                      value={requestedCategory}
                      onChange={(e) => setRequestedCategory(e.target.value)}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      <option value="Solar Inverter Maintenance">Solar Inverter & Renewable Energy</option>
                      <option value="Medical Diagnostic Phlebotomy">Healthcare Sample Collection</option>
                      <option value="Plumbing & Pipe Overhaul">Advanced Commercial Plumbing</option>
                      <option value="Heavy Freight Logistics">Heavy Freight & Interstate Transport</option>
                      <option value="Fire Alarm & Security">Fire Safety & Alarm Setup</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Years of Industry Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="30"
                      value={requestedSkillExp}
                      onChange={(e) => setRequestedSkillExp(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Trade Certification / Notes for Admin</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Mention your ITI certificate, brand certifications (e.g. Daikin, Voltas, Havells) or prior experience..."
                      value={requestedSkillNotes}
                      onChange={(e) => setRequestedSkillNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowSkillRequestModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                    >
                      Submit for Admin Approval
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: ADMIN INCIDENT & MATERIAL REIMBURSEMENT DESK                     */}
        {/* ========================================================================= */}
        {showEscalationModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <span>Admin Operations Ticket</span>
                </h3>
                <button
                  onClick={() => setShowEscalationModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {escalationSubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1rem auto' }}>
                    <Check size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Ticket #{Math.floor(100000 + Math.random() * 900000)} Created
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Taaskr Dispatch Supervisor has been assigned to your ticket. A supervisor will call you within 5 minutes.
                  </p>
                  <button
                    onClick={() => setShowEscalationModal(false)}
                    className="btn btn-primary btn-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setEscalationSubmitted(true);
                }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Issue Category</label>
                    <select
                      className="form-control"
                      value={escalationType}
                      onChange={(e) => setEscalationType(e.target.value)}
                    >
                      <option value="PARTS_REIMBURSEMENT">Extra Spare Parts Reimbursement Claim</option>
                      <option value="CUSTOMER_UNREACHABLE">Customer Not Answering / Door Locked</option>
                      <option value="SCOPE_CHANGE">Customer Requested Additional Heavy Scope</option>
                      <option value="SAFETY_HAZARD">Onsite Electrical / Structural Safety Hazard</option>
                    </select>
                  </div>

                  {escalationType === 'PARTS_REIMBURSEMENT' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Spare Part Cost (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 450 (Capacitor / Valve replacement)"
                        value={escalationAmount}
                        onChange={(e) => setEscalationAmount(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Booking ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. #61 or leave blank for general issue"
                      value={escalationBookingId}
                      onChange={(e) => setEscalationBookingId(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Detailed Notes for Admin Desk</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe the issue in detail..."
                      value={escalationNotes}
                      onChange={(e) => setEscalationNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowEscalationModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Customer / Guest Catalog View
  return (
    <div className="animate-fade-in">
      {/* Dynamic Responsive Hero Section */}
      <section className="hero-section">
        {/* Glowing Ambient Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div className="hero-orb-1" style={{
            position: 'absolute', top: '-10%', left: '15%', width: '450px', height: '450px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(37, 99, 235, 0.06) 50%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(50px)'
          }} />
          <div className="hero-orb-2" style={{
            position: 'absolute', bottom: '-15%', right: '10%', width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(60px)'
          }} />
          <div className="hero-grid-pattern" style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Hero Content Container */}
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, textAlign: 'center', padding: '1rem 0' }}>
          
          <div className="hero-pill-tag" style={{ margin: '0 auto 1.5rem auto' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 10px var(--success)' }} />
            <span>
              Verified Service Marketplace • Real-Time Dispatch
            </span>
          </div>

          <h1 className="hero-title" style={{ maxWidth: '800px', margin: '0 auto 1.25rem auto' }}>
            On-Demand Services.<br />
            <span style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #6366F1 50%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Engineered for Speed.
            </span>
          </h1>

          <p className="hero-desc" style={{ maxWidth: '680px', margin: '0 auto 2.25rem auto' }}>
            Book verified electricians, plumbers, cleaners, and courier specialists in minutes. Upfront pricing, vetted partners, and instant doorstep scheduling.
          </p>

          {/* CTA Button Group */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => {
                const elem = document.getElementById('services-catalog');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary btn-lg"
            >
              <span>Explore Services</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => navigate('/register?role=PROVIDER')}
              className="btn btn-secondary btn-lg"
            >
              Join as Partner
            </button>
          </div>

          {/* Trust Highlights Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.5rem',
            maxWidth: '750px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>100% Background Checked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <Zap size={16} color="var(--warning)" />
              <span>Fast Doorstep Dispatch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <CreditCard size={16} color="var(--primary)" />
              <span>Pay After Completion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Area with Category Tiles & Integrated Search */}
      <main id="services-catalog" className="app-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Explore Verified Services
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
            Select a verified service category to instantly book top-rated, background-checked professionals with upfront pricing and live tracking.
          </p>
        </div>

        {/* Category Header & Explore All Services Control */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.35rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Service Categories
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: 0 }}>
              {selectedCategory 
                ? `Filtered by: ${categories.find(c => c.id === selectedCategory)?.name || 'Category'}` 
                : 'Choose a category to browse specialized technicians or explore everything'}
            </p>
          </div>

          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-outline'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              borderRadius: '12px',
              padding: '0.55rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              transition: 'all 0.25s ease',
              boxShadow: selectedCategory === null ? '0 6px 20px -3px rgba(99, 102, 241, 0.45)' : 'none'
            }}
          >
            <LayoutList size={18} />
            <span>Explore All Services</span>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '999px',
              background: selectedCategory === null ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
              color: selectedCategory === null ? '#FFFFFF' : 'var(--text-main)',
              fontWeight: 700
            }}>
              {services.length}
            </span>
          </button>
        </div>

        {/* Enlarged Category Tiles Grid */}
        <div style={{ marginBottom: '2.75rem' }}>
          <div className="category-tiles-grid">
            {(categories || []).map((cat) => {
              if (!cat) return null;
              const isSelected = selectedCategory === cat.id;
              const theme = getCategoryTheme(cat.name);
              const catServiceCount = (services || []).filter(s => s && s.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                  style={{
                    '--tile-color': theme.primary,
                    '--tile-secondary': theme.secondary,
                    '--tile-tertiary': theme.tertiary,
                    '--tile-shadow-1': theme.shadow1,
                    '--tile-shadow-2': theme.shadow2,
                    '--tile-shadow-3': theme.shadow3,
                    '--tile-accent': theme.accentBg
                  }}
                >
                  <div
                    className="cat-icon-badge"
                    style={{
                      background: theme.accentBg,
                      color: '#FFFFFF'
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className="category-tile-title">
                    {cat.name || 'Category'}
                  </div>
                  <div className="cat-count-badge">
                    {catServiceCount} {catServiceCount === 1 ? 'service' : 'services'}
                  </div>
                  {isSelected && (
                    <div className="cat-active-indicator" style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Services Grid Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Showing {filteredServices.length} {selectedCategory ? 'services' : 'options'}
          </h3>
        </div>

        {/* Services Grid with Dynamic Hover */}
        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="panel" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px' }} />
                <div className="skeleton" style={{ width: '70%', height: '18px' }} />
                <div className="skeleton" style={{ width: '100%', height: '14px' }} />
                <div className="skeleton" style={{ width: '40%', height: '14px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={22} />
            </div>
            <h3 className="empty-state-title">No Services Found</h3>
            <p className="empty-state-description">
              We couldn't find any services matching your search. Try adjusting your filters.
            </p>
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="grid-cols-4">
              {filteredServices.slice((servicesPage - 1) * servicesPerPage, servicesPage * servicesPerPage).map((service) => {
                if (!service) return null;
                const cat = categories.find(c => c && c.id === service.categoryId);
                const config = getServiceConfig(service.name, cat?.name);
                const priceUnit = service.pricingType === 'HOURLY' ? '/ hr' : service.pricingType === 'PER_KM' ? '/ km' : '';
                const descText = service.description || 'Verified, professional on-demand home and maintenance service.';

                return (
                  <div
                    key={service.id}
                    className="service-card"
                    style={{
                      '--service-color': config.color,
                      '--service-shadow-1': config.shadow1,
                      '--service-shadow-2': config.shadow2,
                      '--service-shadow-3': config.shadow3,
                      '--service-glow': config.shadow1,
                      '--service-bg': config.bg
                    }}
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <div className="service-card-image-box">
                      <img
                        src={config.image}
                        alt={service.name || 'Service'}
                        className="service-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <h3 className="service-card-title">{service.name || 'Service'}</h3>
                    </div>

                    {cat && (
                      <span className="service-category-tag" style={{ color: config.color, backgroundColor: config.bg }}>
                        {cat.name}
                      </span>
                    )}

                    <p className="service-card-desc">
                      {descText.length > 85 ? descText.substring(0, 85) + '...' : descText}
                    </p>

                    <div className="service-card-footer">
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          Starting from
                        </div>
                        <span className="service-price">
                          ₹{service.price ?? 0} {priceUnit}
                        </span>
                      </div>
                      
                      <button className="service-cta" onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/services/${service.id}`);
                      }}>
                        <span>Book</span> <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={servicesPage}
              totalItems={filteredServices.length}
              itemsPerPage={servicesPerPage}
              onPageChange={setServicesPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
