import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Appliances', active: true },
  { id: 2, name: 'Civil & Property Maintenance', active: true },
  { id: 3, name: 'Cleaning', active: true },
  { id: 4, name: 'Diagnostic Services', active: true },
  { id: 5, name: 'Electrical', active: true },
  { id: 6, name: 'Healthcare Services', active: true },
  { id: 7, name: 'Logistics', active: true },
  { id: 8, name: "Men's Salon & Massage", active: true },
  { id: 9, name: 'Plumbing', active: true },
  { id: 10, name: 'Security Services', active: true }
];

const DEFAULT_SERVICES = [
  { id: 1, name: 'AC Repair & Service', description: 'Comprehensive diagnostics, coil cleaning, and cooling optimization.', price: 699, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 2, name: 'RO Water Purifier Service', description: 'Filter replacement, membrane inspection, and complete purification check.', price: 499, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 3, name: 'Switchboard & Wiring Repair', description: 'Quick inspection and repair of loose wiring, burnt sockets, and tripped breakers.', price: 349, pricingType: 'FIXED', categoryId: 5, active: true },
  { id: 4, name: 'Ceiling & Exhaust Fan Repair', description: 'Bearing replacement, speed regulator setup, and quiet motor tuning.', price: 299, pricingType: 'FIXED', categoryId: 5, active: true },
  { id: 5, name: 'Tap Leakage & Valve Repair', description: 'Fix dripping faucets, replace internal washers, and ensure seamless water pressure.', price: 299, pricingType: 'FIXED', categoryId: 9, active: true },
  { id: 6, name: 'Deep Home & Bathroom Cleaning', description: 'Intensive stain removal, floor sanitization, and eco-friendly disinfection.', price: 1499, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 7, name: 'Blood Test & Sample Collection', description: 'Hygienic at-home phlebotomy with certified NABL accredited lab processing.', price: 499, pricingType: 'FIXED', categoryId: 4, active: true },
  { id: 8, name: 'CCTV Installation & Setup', description: 'HD camera mounting, DVR configuration, and mobile live-view setup.', price: 1199, pricingType: 'FIXED', categoryId: 10, active: true },
  { id: 9, name: 'Mini Truck Goods Transport', description: 'Reliable intra-city tempo transport for furniture, equipment, and shifting.', price: 250, pricingType: 'PER_KM', categoryId: 7, active: true },
  { id: 10, name: 'General Civil & Wall Repair', description: 'Minor masonry, plaster patching, and tile touch-ups by verified masons.', price: 799, pricingType: 'FIXED', categoryId: 2, active: true }
];

export default function Home() {
  const navigate = useNavigate();
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
    
    // 1. Electrical & Power
    if (cat.includes('electric') || cat.includes('wire') || cat.includes('switch') || cat.includes('power')) {
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

    // 2. Plumbing & Water Works
    if (cat.includes('plumb') || cat.includes('water') || cat.includes('pipe') || cat.includes('drain')) {
      return {
        icon: <Droplets size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80',
        primary: '#06B6D4',
        secondary: '#2563EB',
        tertiary: '#10B981',
        accentBg: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 50%, #2563EB 100%)',
        shadow1: 'rgba(6, 182, 212, 0.42)',
        shadow2: 'rgba(37, 99, 235, 0.32)',
        shadow3: 'rgba(16, 185, 129, 0.28)',
        glow: 'rgba(6, 182, 212, 0.55)',
        badgeBg: 'rgba(6, 182, 212, 0.2)',
        badgeColor: '#67E8F9'
      };
    }

    // 3. Cleaning & Housekeeping
    if (cat.includes('clean')) {
      return {
        icon: <Sparkles size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        primary: '#10B981',
        secondary: '#06B6D4',
        tertiary: '#3B82F6',
        accentBg: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #06B6D4 100%)',
        shadow1: 'rgba(16, 185, 129, 0.42)',
        shadow2: 'rgba(6, 182, 212, 0.32)',
        shadow3: 'rgba(59, 130, 246, 0.28)',
        glow: 'rgba(16, 185, 129, 0.55)',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeColor: '#6EE7B7'
      };
    }

    // 4. Diagnostic & Health Labs
    if (cat.includes('diagnostic') || cat.includes('patholog') || cat.includes('blood') || cat.includes('test')) {
      return {
        icon: <Activity size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
        primary: '#F43F5E',
        secondary: '#A855F7',
        tertiary: '#EC4899',
        accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 50%, #A855F7 100%)',
        shadow1: 'rgba(244, 63, 94, 0.42)',
        shadow2: 'rgba(168, 85, 247, 0.32)',
        shadow3: 'rgba(236, 72, 153, 0.28)',
        glow: 'rgba(244, 63, 94, 0.55)',
        badgeBg: 'rgba(244, 63, 94, 0.2)',
        badgeColor: '#FDA4AF'
      };
    }

    // 5. Healthcare Services
    if (cat.includes('health') || cat.includes('care') || cat.includes('doctor') || cat.includes('nurse')) {
      return {
        icon: <Stethoscope size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
        primary: '#14B8A6',
        secondary: '#10B981',
        tertiary: '#0284C7',
        accentBg: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #10B981 100%)',
        shadow1: 'rgba(20, 184, 166, 0.42)',
        shadow2: 'rgba(16, 185, 129, 0.32)',
        shadow3: 'rgba(2, 132, 199, 0.28)',
        glow: 'rgba(20, 184, 166, 0.55)',
        badgeBg: 'rgba(20, 184, 166, 0.2)',
        badgeColor: '#5EEAD4'
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
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80',
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

  const getServiceConfig = (serviceName, categoryName) => {
    const name = (serviceName || '').toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    const theme = getCategoryTheme(cat);
    
    // Select real, high-resolution stock photo matching the specific service
    let serviceImage = theme.image;
    if (name.includes('ac install') || name.includes('ac repair') || name.includes('ac service') || name.includes('air condition') || name.includes('gas refill')) {
      serviceImage = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('fan') || name.includes('switch') || name.includes('wire') || name.includes('inverter') || name.includes('fuse') || name.includes('electric')) {
      serviceImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('tap') || name.includes('leak') || name.includes('pipe') || name.includes('drain') || name.includes('plumb') || name.includes('tank')) {
      serviceImage = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('sofa') || name.includes('carpet') || name.includes('curtain') || name.includes('mattress')) {
      serviceImage = 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('house clean') || name.includes('home clean') || name.includes('deep clean') || name.includes('kitchen clean') || name.includes('bathroom clean')) {
      serviceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('blood') || name.includes('cbc') || name.includes('thyroid') || name.includes('test') || name.includes('lab') || name.includes('checkup')) {
      serviceImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('physician') || name.includes('doctor') || name.includes('nurse') || name.includes('physiotherapy') || name.includes('consultation')) {
      serviceImage = 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('hair') || name.includes('beard') || name.includes('massage') || name.includes('facial') || name.includes('spa') || name.includes('grooming')) {
      serviceImage = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('truck') || name.includes('courier') || name.includes('tempo') || name.includes('cargo') || name.includes('freight') || name.includes('logistics')) {
      serviceImage = 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('cctv') || name.includes('guard') || name.includes('security') || name.includes('alarm') || name.includes('camera')) {
      serviceImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('paint') || name.includes('wall') || name.includes('waterproof')) {
      serviceImage = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('mason') || name.includes('tile') || name.includes('civil') || name.includes('construction') || name.includes('plaster')) {
      serviceImage = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
    } else if (name.includes('appliance') || name.includes('washing') || name.includes('refrigerator') || name.includes('microwave') || name.includes('oven') || name.includes('geyser')) {
      serviceImage = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
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
                      boxShadow: `0 8px 20px -3px ${theme.shadow1}, 0 4px 12px ${theme.shadow2}`
                    }}
                  >
                    <img
                      src={theme.image}
                      alt={cat.name || 'Category'}
                      className="cat-thumb-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
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
