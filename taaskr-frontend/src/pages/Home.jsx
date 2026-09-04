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

  // Pagination state for services catalog grid
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 8;

  // Reset page when filtering or searching
  useEffect(() => {
    setServicesPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const checkRoleAndLoadCatalog = async () => {
      try {
        const currentUser = await api.auth.me();
        if (currentUser?.role === 'PROVIDER') {
          navigate('/provider', { replace: true });
          return;
        }
        if (currentUser?.role === 'ADMIN') {
          navigate('/admin', { replace: true });
          return;
        }
      } catch (e) {
        // Guest user
      }

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
    checkRoleAndLoadCatalog();
  }, [navigate]);

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

  const getCategoryIcon = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('clean')) return <Sparkles size={28} />;
    if (cat.includes('plumb')) return <Droplets size={28} />;
    if (cat.includes('electric') || cat.includes('wire')) return <Zap size={28} />;
    if (/\bac\b/.test(cat) || cat.includes('cool') || cat.includes('refrigerat')) return <Snowflake size={28} />;
    if (/\bro\b/.test(cat) || cat.includes('water purifier')) return <Droplets size={28} />;
    if (cat.includes('security') || cat.includes('guard') || cat.includes('cctv') || cat.includes('lock')) return <ShieldCheck size={28} />;
    if (cat.includes('appliance') || cat.includes('repair')) return <Settings size={28} />;
    if (cat.includes('paint')) return <Paintbrush size={28} />;
    if (cat.includes('garden') || cat.includes('lawn')) return <Leaf size={28} />;
    if (cat.includes('logistics') || cat.includes('mov') || cat.includes('vehicle') || cat.includes('transport') || cat.includes('truck') || cat.includes('cargo') || cat.includes('courier') || cat.includes('freight')) return <Truck size={28} />;
    if (cat.includes('carpent') || cat.includes('wood')) return <Ruler size={28} />;
    if (cat.includes('diagnostic') || cat.includes('test') || cat.includes('blood')) return <Activity size={28} />;
    if (cat.includes('health') || cat.includes('care') || cat.includes('compound') || cat.includes('doctor')) return <Stethoscope size={28} />;
    if (cat.includes('civil') || cat.includes('property') || cat.includes('mason') || cat.includes('roof') || cat.includes('floor')) return <Building2 size={28} />;
    return <Hammer size={28} />;
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
      {/* Dynamic Y-Combinator Style Hero Section */}
      <section style={{
        position: 'relative',
        background: 'radial-gradient(ellipse at 30% 15%, #1e1b4b 0%, #0f172a 45%, #020617 100%)',
        overflow: 'hidden',
        padding: '5.5rem 2rem 6rem 2rem',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3.5rem' }}>
          
          {/* Left Column: YC-Style Typography & Primary CTAs */}
          <div style={{ flex: '1 1 540px', maxWidth: '640px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.28)',
              borderRadius: '9999px',
              padding: '0.35rem 0.95rem',
              marginBottom: '1.35rem',
              backdropFilter: 'blur(10px)'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ color: '#93C5FD', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                Instant Dispatch Network • 99.4% On-Time SLA
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.8rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              letterSpacing: '-0.035em'
            }}>
              On-Demand Services.<br />
              <span style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Engineered for Speed.
              </span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#94A3B8',
              marginBottom: '2.25rem',
              lineHeight: 1.6,
              maxWidth: '520px'
            }}>
              The modern platform for verified home repairs, electrical, HVAC cooling, and freight logistics. Upfront pricing, vetted specialists, dispatched to your doorstep in under 60 seconds.
            </p>

            {/* High-Converting CTA Button Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <button
                onClick={() => {
                  const elem = document.getElementById('services-catalog');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-primary"
                style={{
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 0 25px rgba(59, 130, 246, 0.45)',
                  cursor: 'pointer'
                }}
              >
                <span>Explore Services</span>
                <ArrowRight size={17} />
              </button>

              <button
                onClick={() => navigate('/register?role=PROVIDER')}
                className="btn btn-secondary"
                style={{
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#F1F5F9',
                  backdropFilter: 'blur(8px)',
                  cursor: 'pointer'
                }}
              >
                Join as Partner
              </button>
            </div>

            {/* Trust Highlights Strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.75rem',
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#CBD5E1', fontSize: '0.8125rem' }}>
                <ShieldCheck size={16} color="#10B981" />
                <span>100% Background Checked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#CBD5E1', fontSize: '0.8125rem' }}>
                <Zap size={16} color="#EAB308" />
                <span>&lt;45 min Avg Dispatch</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#CBD5E1', fontSize: '0.8125rem' }}>
                <CreditCard size={16} color="#38BDF8" />
                <span>Cash After Service</span>
              </div>
            </div>
          </div>

          {/* Right Column: YC-Style Live Operations Dashboard Widget */}
          <div style={{ flex: '1 1 380px', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px)',
              borderRadius: '18px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Telemetry Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }} />
                  <span style={{ color: '#F8FAFC', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Live Telemetry
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  v2.4 ACTIVE
                </span>
              </div>

              {/* Real-time stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '0.9rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ color: '#38BDF8', fontSize: '1.4rem', fontWeight: 800 }}>5,000+</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Verified Partners</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '0.9rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ color: '#FBBF24', fontSize: '1.4rem', fontWeight: 800 }}>4.92 ★</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 500 }}>Customer Rating</div>
                </div>
              </div>

              {/* Live Dispatch Feed Mockup */}
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                  Recent Live Dispatches
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#E2E8F0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#38BDF8' }}>❄️</span> AC Jet Servicing
                    </span>
                    <span style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 600 }}>Matched (2m ago)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#E2E8F0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#F59E0B' }}>🚚</span> Mini Truck (1 Ton)
                    </span>
                    <span style={{ color: '#38BDF8', fontSize: '0.7rem', fontWeight: 600 }}>In Transit (5m ago)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#E2E8F0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ color: '#EAB308' }}>⚡</span> Circuit Board Repair
                    </span>
                    <span style={{ color: '#A855F7', fontSize: '0.7rem', fontWeight: 600 }}>Completed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shield Insurance Guarantee Pill */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '14px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0 }} />
              <span style={{ color: '#CBD5E1', fontSize: '0.8125rem' }}>
                <strong>Taaskr Shield:</strong> ₹50,000 damage protection guarantee on every job.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Area with Category Tiles & Integrated Search */}
      <main id="services-catalog" className="app-container" style={{ paddingTop: '4rem', paddingBottom: '5rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Explore Verified Services
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Select a service category or filter by name to instantly dispatch top-rated professionals.
          </p>
        </div>

        {/* Integrated Clean Search & Filter Control Bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto 2.5rem auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            borderRadius: '12px',
            padding: '0.45rem 0.6rem 0.45rem 1rem',
            gap: '0.75rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.1)',
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
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`category-tile ${selectedCategory === null ? 'active' : ''}`}
            >
              <div style={{ color: selectedCategory === null ? 'var(--primary)' : 'var(--text-muted)' }}>
                <LayoutList size={28} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: selectedCategory === null ? 'var(--primary)' : 'var(--text-main)' }}>
                All Services
              </div>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                >
                  <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                    {cat.name}
                  </div>
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
