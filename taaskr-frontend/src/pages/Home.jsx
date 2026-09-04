import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      try {
        const [cats, servs] = await Promise.all([
          api.catalog.getCategories(),
          api.catalog.getServices()
        ]);
        setCategories(cats.filter(c => c.active !== false));
        setServices(servs.filter(s => s.active !== false));
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Comprehensive multi-token search matcher across service name, description, category name, and keywords
  const doesServiceMatch = (service, query) => {
    if (!query || !query.trim()) return true;
    const qTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const cat = categories.find(c => c.id === service.categoryId);
    const catName = (cat?.name || '').toLowerCase();
    const sName = (service.name || '').toLowerCase();
    const sDesc = (service.description || '').toLowerCase();
    const fullText = `${sName} ${catName} ${sDesc}`;

    return qTokens.every(token => fullText.includes(token));
  };

  // Dropdown searches globally across all services
  const searchDropdownResults = searchQuery.trim() === ''
    ? []
    : services.filter(service => doesServiceMatch(service, searchQuery));

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery.trim() === '' || doesServiceMatch(service, searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getCategoryTheme = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    
    // 1. Electrical & Power: Radiant Electric Amber -> Flame Orange
    if (cat.includes('electric') || cat.includes('wire') || cat.includes('switch') || cat.includes('power')) {
      return {
        icon: <Zap size={24} strokeWidth={2.4} />,
        primary: '#F59E0B',
        secondary: '#EF4444',
        accentBg: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(245, 158, 11, 0.28) 0%, rgba(234, 88, 12, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(245, 158, 11, 0.55)',
        border: '#F59E0B',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        badgeColor: '#FDE047'
      };
    }

    // 2. Plumbing & Water Works: Oceanic Cyan -> Azure Deep Blue
    if (cat.includes('plumb') || cat.includes('water') || cat.includes('pipe') || cat.includes('drain')) {
      return {
        icon: <Droplets size={24} strokeWidth={2.4} />,
        primary: '#06B6D4',
        secondary: '#2563EB',
        accentBg: 'linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(6, 182, 212, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(6, 182, 212, 0.28) 0%, rgba(37, 99, 235, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(6, 182, 212, 0.55)',
        border: '#06B6D4',
        badgeBg: 'rgba(6, 182, 212, 0.2)',
        badgeColor: '#67E8F9'
      };
    }

    // 3. Cleaning & Housekeeping: Spring Emerald -> Sparkling Aqua
    if (cat.includes('clean')) {
      return {
        icon: <Sparkles size={24} strokeWidth={2.4} />,
        primary: '#10B981',
        secondary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(16, 185, 129, 0.28) 0%, rgba(6, 182, 212, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(16, 185, 129, 0.55)',
        border: '#10B981',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeColor: '#6EE7B7'
      };
    }

    // 4. Diagnostic & Health Labs: Pulse Crimson -> Neon Rose
    if (cat.includes('diagnostic') || cat.includes('patholog') || cat.includes('blood') || cat.includes('test')) {
      return {
        icon: <Activity size={24} strokeWidth={2.4} />,
        primary: '#F43F5E',
        secondary: '#E11D48',
        accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(244, 63, 94, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(244, 63, 94, 0.28) 0%, rgba(190, 18, 60, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(244, 63, 94, 0.55)',
        border: '#F43F5E',
        badgeBg: 'rgba(244, 63, 94, 0.2)',
        badgeColor: '#FDA4AF'
      };
    }

    // 5. Healthcare Services: Medical Jade -> Mint Teal
    if (cat.includes('health') || cat.includes('care') || cat.includes('doctor') || cat.includes('nurse')) {
      return {
        icon: <Stethoscope size={24} strokeWidth={2.4} />,
        primary: '#14B8A6',
        secondary: '#059669',
        accentBg: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(20, 184, 166, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(20, 184, 166, 0.28) 0%, rgba(13, 148, 136, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(20, 184, 166, 0.55)',
        border: '#14B8A6',
        badgeBg: 'rgba(20, 184, 166, 0.2)',
        badgeColor: '#5EEAD4'
      };
    }

    // 6. Logistics & Freight: Royal Cargo Cobalt -> Electric Indigo
    if (cat.includes('logistics') || cat.includes('mov') || cat.includes('vehicle') || cat.includes('transport') || cat.includes('truck') || cat.includes('cargo') || cat.includes('courier') || cat.includes('freight')) {
      return {
        icon: <Truck size={24} strokeWidth={2.4} />,
        primary: '#3B82F6',
        secondary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(59, 130, 246, 0.28) 0%, rgba(99, 102, 241, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(59, 130, 246, 0.55)',
        border: '#3B82F6',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
        badgeColor: '#93C5FD'
      };
    }

    // 7. Security Services: Cyber Violet -> Radiant Purple
    if (cat.includes('security') || cat.includes('guard') || cat.includes('cctv') || cat.includes('lock')) {
      return {
        icon: <ShieldCheck size={24} strokeWidth={2.4} />,
        primary: '#8B5CF6',
        secondary: '#C026D3',
        accentBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(139, 92, 246, 0.28) 0%, rgba(192, 38, 211, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(139, 92, 246, 0.55)',
        border: '#8B5CF6',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
        badgeColor: '#C4B5FD'
      };
    }

    // 8. Civil & Property Maintenance: Sunset Terracotta -> Warm Amber
    if (cat.includes('civil') || cat.includes('property') || cat.includes('mason') || cat.includes('roof') || cat.includes('floor')) {
      return {
        icon: <Building2 size={24} strokeWidth={2.4} />,
        primary: '#EA580C',
        secondary: '#F59E0B',
        accentBg: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(234, 88, 12, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(234, 88, 12, 0.28) 0%, rgba(245, 158, 11, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(234, 88, 12, 0.55)',
        border: '#EA580C',
        badgeBg: 'rgba(234, 88, 12, 0.2)',
        badgeColor: '#FDBA74'
      };
    }

    // 9. Appliances & Hardware: Metallic Sky Blue -> Royal Indigo
    if (cat.includes('appliance') || cat.includes('repair') || cat.includes('machine')) {
      return {
        icon: <Settings size={24} strokeWidth={2.4} />,
        primary: '#0EA5E9',
        secondary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(14, 165, 233, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(14, 165, 233, 0.28) 0%, rgba(99, 102, 241, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(14, 165, 233, 0.55)',
        border: '#0EA5E9',
        badgeBg: 'rgba(14, 165, 233, 0.2)',
        badgeColor: '#7DD3FC'
      };
    }

    // 10. AC & Cooling: Arctic Sky Frost -> Deep Blue
    if (/\bac\b/.test(cat) || cat.includes('cool') || cat.includes('refrigerat')) {
      return {
        icon: <Snowflake size={24} strokeWidth={2.4} />,
        primary: '#38BDF8',
        secondary: '#0284C7',
        accentBg: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(56, 189, 248, 0.28) 0%, rgba(2, 132, 199, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(56, 189, 248, 0.55)',
        border: '#38BDF8',
        badgeBg: 'rgba(56, 189, 248, 0.2)',
        badgeColor: '#BAE6FD'
      };
    }

    // 11. Painting & Walls: Vivid Magenta -> Rose Pink
    if (cat.includes('paint')) {
      return {
        icon: <Paintbrush size={24} strokeWidth={2.4} />,
        primary: '#EC4899',
        secondary: '#F43F5E',
        accentBg: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(236, 72, 153, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(236, 72, 153, 0.28) 0%, rgba(244, 63, 94, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(236, 72, 153, 0.55)',
        border: '#EC4899',
        badgeBg: 'rgba(236, 72, 153, 0.2)',
        badgeColor: '#F472B6'
      };
    }

    // 12. Carpentry & Wood: Wood Bronze -> Deep Caramel
    if (cat.includes('carpent') || cat.includes('wood')) {
      return {
        icon: <Ruler size={24} strokeWidth={2.4} />,
        primary: '#D97706',
        secondary: '#B45309',
        accentBg: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(217, 119, 6, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(217, 119, 6, 0.28) 0%, rgba(180, 83, 9, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(217, 119, 6, 0.55)',
        border: '#D97706',
        badgeBg: 'rgba(217, 119, 6, 0.2)',
        badgeColor: '#FCD34D'
      };
    }

    // 13. Gardening & Lawn: Vibrant Lime -> Forest Green
    if (cat.includes('garden') || cat.includes('lawn')) {
      return {
        icon: <Leaf size={24} strokeWidth={2.4} />,
        primary: '#84CC16',
        secondary: '#16A34A',
        accentBg: 'linear-gradient(135deg, #84CC16 0%, #4D7C0F 100%)',
        hoverBg: 'radial-gradient(ellipse at top, rgba(132, 204, 22, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
        activeBg: 'linear-gradient(160deg, rgba(132, 204, 22, 0.28) 0%, rgba(22, 163, 74, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
        glow: 'rgba(132, 204, 22, 0.55)',
        border: '#84CC16',
        badgeBg: 'rgba(132, 204, 22, 0.2)',
        badgeColor: '#BEF264'
      };
    }

    // Default: All Services (Vibrant Electric Indigo -> Sky Blue)
    return {
      icon: <LayoutList size={24} strokeWidth={2.4} />,
      primary: '#6366F1',
      secondary: '#38BDF8',
      accentBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      hoverBg: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.32) 0%, rgba(15, 23, 42, 0.85) 80%)',
      activeBg: 'linear-gradient(160deg, rgba(99, 102, 241, 0.28) 0%, rgba(56, 189, 248, 0.16) 50%, rgba(15, 23, 42, 0.95) 100%)',
      glow: 'rgba(99, 102, 241, 0.55)',
      border: '#6366F1',
      badgeBg: 'rgba(99, 102, 241, 0.2)',
      badgeColor: '#C7D2FE'
    };
  };

  const getServiceConfig = (serviceName, categoryName) => {
    const name = (serviceName || '').toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    
    // 1. Civil & Property Maintenance (Roof, Waterproofing, Masonry, Flooring, Tiles)
    if (cat.includes('civil') || cat.includes('property') || name.includes('roof') || name.includes('terrace') || name.includes('mason') || name.includes('waterproof') || name.includes('tile') || name.includes('floor')) {
      if (name.includes('waterproof')) {
        return { icon: <Droplets size={24} />, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' };
      }
      return { icon: <Building2 size={24} />, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' };
    }

    // 2. Security & Smart Living (Security Guard, Video Doorbell, Smart Lock, CCTV)
    if (cat.includes('security') || name.includes('security') || name.includes('doorbell') || name.includes('lock') || name.includes('cctv') || name.includes('guard')) {
      return { icon: <ShieldCheck size={24} />, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' };
    }

    // 3. Electrical (Switch Board, Wiring, Fan, MCB, Inverter)
    if (cat.includes('electric') || name.includes('switch') || name.includes('wire') || name.includes('fan') || name.includes('fuse') || name.includes('spark') || name.includes('board')) {
      return { icon: <Zap size={24} />, color: '#EAB308', bg: 'rgba(234, 179, 8, 0.18)' };
    }

    // 4. Plumbing & Water Works (Tap, Leakage, Pipe, Drain, Flush)
    if (cat.includes('plumb') || name.includes('tap') || name.includes('pipe') || name.includes('leak') || name.includes('drain') || name.includes('sink') || name.includes('toilet')) {
      return { icon: <Droplets size={24} />, color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)' };
    }

    // 5. AC, Cooling & Refrigeration
    if (/\bac\b/.test(name) || name.includes('air condition') || name.includes('refrigerat') || name.includes('cooler') || (cat.includes('ac') && !cat.includes('civil'))) {
      return { icon: <Snowflake size={24} />, color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.15)' };
    }

    // 6. Water Purifier & RO
    if (/\bro\b/.test(name) || name.includes('water purifier') || name.includes('purifier') || name.includes('aquaguard')) {
      return { icon: <Droplets size={24} />, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' };
    }

    // 7. Cleaning & Housekeeping (Deep Cleaning, Bathroom, Kitchen, Sofa)
    if (cat.includes('clean') || name.includes('clean') || name.includes('dust') || name.includes('mop')) {
      return { icon: <Sparkles size={24} />, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
    }

    // 8. Logistics, Freight & Moving (Mini Truck, Bike Courier, Shifting, Tempo)
    if (cat.includes('logistics') || cat.includes('cargo') || cat.includes('courier') || cat.includes('freight') || cat.includes('transport') || cat.includes('moving') || cat.includes('vehicle') || name.includes('truck') || name.includes('bike') || name.includes('courier') || name.includes('shifting') || name.includes('tempo') || name.includes('loading') || name.includes('parcel')) {
      return { icon: <Truck size={24} />, color: '#2563EB', bg: 'rgba(37, 99, 235, 0.15)' };
    }

    // 9. Diagnostics & Health (Blood Test, Doctor, Health Checkup, Pathology)
    if (cat.includes('diagnostic') || name.includes('blood') || name.includes('test') || name.includes('checkup') || name.includes('pathology')) {
      return { icon: <Activity size={24} />, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }
    if (cat.includes('health') || name.includes('patient') || name.includes('doctor') || name.includes('nurse') || name.includes('compounder')) {
      return { icon: <Stethoscope size={24} />, color: '#10B981', bg: 'rgba(168, 185, 129, 0.15)' };
    }

    // 10. Appliances (Washing Machine, Microwave, TV, Chimney)
    if (cat.includes('appliance') || name.includes('machine') || name.includes('microwave') || name.includes('geyser') || name.includes('chimney') || name.includes('tv')) {
      return { icon: <Settings size={24} />, color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' };
    }

    // 11. Painting, Carpentry & Gardening
    if (name.includes('paint') || cat.includes('paint')) {
      return { icon: <Paintbrush size={24} />, color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)' }; 
    }
    if (name.includes('garden') || name.includes('lawn') || cat.includes('garden')) {
      return { icon: <Leaf size={24} />, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.15)' }; 
    }
    if (name.includes('carpent') || name.includes('wood') || cat.includes('carpent')) {
      return { icon: <Ruler size={24} />, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' }; 
    }

    return { icon: <Hammer size={24} />, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' };
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
        <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: '750px', margin: '0 auto 2rem auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Explore Verified Services
          </h2>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Select a service category or filter by name to instantly dispatch top-rated professionals in</span>
            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              📍 {currentLocation.city} {currentLocation.pincode ? `(${currentLocation.pincode})` : ''}
            </span>
          </p>
        </div>

        {/* Integrated Clean Search & Filter Control Bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto 2rem auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '0.45rem 0.6rem 0.45rem 1rem',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-light)'
          }}>
            <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service name, category, or keyword..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                fontWeight: 500
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Service Categories Dynamic Tiles */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: '0.9rem',
            flexWrap: 'wrap',
            maxWidth: '1280px',
            margin: '0 auto'
          }}>
            {/* All Services Tile */}
            {(() => {
              const isSelected = selectedCategory === null;
              const theme = getCategoryTheme('all');
              return (
                <button
                  key="all"
                  onClick={() => setSelectedCategory(null)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: isSelected ? theme.primary : undefined,
                    minWidth: '135px',
                    flex: '0 1 auto'
                  }}
                >
                  <div
                    className="cat-icon-badge"
                    style={{
                      background: theme.accentBg,
                      boxShadow: isSelected ? `0 0 16px ${theme.glow}` : '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className="category-tile-title">
                    All Services
                  </div>
                  <div className="cat-count-badge">
                    {services.length} options
                  </div>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      width: '24px',
                      height: '3px',
                      borderRadius: '3px',
                      backgroundColor: theme.primary,
                      boxShadow: `0 0 10px ${theme.primary}`
                    }} />
                  )}
                </button>
              );
            })()}

            {/* Dynamic Domain-Matched Category Tiles */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const theme = getCategoryTheme(cat.name);
              const catServiceCount = services.filter(s => s.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                  style={{
                    borderColor: isSelected ? theme.primary : undefined,
                    minWidth: '135px',
                    flex: '0 1 auto'
                  }}
                >
                  <div
                    className="cat-icon-badge"
                    style={{
                      background: theme.accentBg,
                      boxShadow: isSelected ? `0 0 16px ${theme.glow}` : '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className="category-tile-title">
                    {cat.name}
                  </div>
                  <div className="cat-count-badge">
                    {catServiceCount} {catServiceCount === 1 ? 'service' : 'services'}
                  </div>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      width: '24px',
                      height: '3px',
                      borderRadius: '3px',
                      backgroundColor: theme.primary,
                      boxShadow: `0 0 10px ${theme.primary}`
                    }} />
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
                const cat = categories.find(c => c.id === service.categoryId);
                const config = getServiceConfig(service.name, cat?.name);
                const priceUnit = service.pricingType === 'HOURLY' ? '/ hr' : service.pricingType === 'PER_KM' ? '/ km' : '';

                return (
                  <div
                    key={service.id}
                    className="service-card"
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <div className="icon-squircle" style={{ backgroundColor: config.bg, color: config.color }}>
                      {config.icon}
                    </div>

                    <h3 className="service-card-title">{service.name}</h3>
                    <p className="service-card-desc">
                      {service.description.length > 85 
                        ? service.description.substring(0, 85) + '...' 
                        : service.description}
                    </p>

                    <div className="service-card-footer">
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          Starting from
                        </div>
                        <span className="service-price">
                          ₹{service.price} {priceUnit}
                        </span>
                      </div>
                      
                      <button className="service-cta" style={{ color: config.color }} onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/services/${service.id}`);
                      }}>
                        <span>View</span> <ArrowRight size={14} />
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
