import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
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

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery.trim() === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
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
      return { icon: <Stethoscope size={24} />, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
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

  const [searchFocused, setSearchFocused] = useState(false);

  // Trending search chips
  const trendingSearches = [
    { label: 'Electrician', icon: '⚡' },
    { label: 'AC Repair', icon: '❄️' },
    { label: 'Mini Truck', icon: '🚚' },
    { label: 'Plumbing', icon: '🚰' },
    { label: 'Deep Cleaning', icon: '✨' },
    { label: 'Diagnostics', icon: '🩺' }
  ];

  return (
    <div className="animate-fade-in">
      {/* Dynamic Production-Grade Hero Section */}
      <section style={{
        position: 'relative',
        background: 'radial-gradient(ellipse at 30% 20%, #1e1b4b 0%, #0f172a 50%, #020617 100%)',
        overflow: 'hidden',
        padding: '5rem 2rem 5.5rem 2rem',
        minHeight: '480px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Dynamic Glowing Ambient Orbs */}
        <div className="hero-orb-1" style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: '420px',
          height: '420px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
        
        <div className="hero-orb-2" style={{
          position: 'absolute',
          bottom: '-15%',
          right: '10%',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div className="hero-orb-3" style={{
          position: 'absolute',
          top: '20%',
          right: '35%',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(45px)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Blueprint Grid Overlay */}
        <div className="hero-grid-pattern" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 2
        }} />

        {/* Hero Content Container */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
          
          {/* Left Column: Headline & Search */}
          <div style={{ flex: '1 1 540px', maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '9999px', padding: '0.35rem 0.9rem', marginBottom: '1.25rem', backdropFilter: 'blur(8px)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38BDF8', display: 'inline-block', boxShadow: '0 0 10px #38BDF8' }} />
              <span style={{ color: '#93C5FD', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                Verified On-Demand Service Network
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2.3rem, 4vw, 3.4rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.12,
              marginBottom: '1.15rem',
              letterSpacing: '-0.03em'
            }}>
              Trusted Services.<br />
              <span style={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Right at Your Door.
              </span>
            </h1>

            <p style={{
              fontSize: '1.08rem',
              color: '#94A3B8',
              marginBottom: '2rem',
              lineHeight: 1.6,
              maxWidth: '520px'
            }}>
              Book top-rated verified professionals for home repairs, electrical, AC servicing, and freight logistics in under 60 seconds.
            </p>

            {/* Upgraded Command-Center Search Bar */}
            <div style={{ position: 'relative', maxWidth: '540px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.45rem 0.6rem 0.45rem 1rem',
                gap: '0.75rem',
                boxShadow: searchFocused
                  ? '0 0 0 3px rgba(96, 165, 250, 0.5), 0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  : '0 12px 28px -5px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Search size={20} color="#64748B" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services (e.g. Electrician, Mini Truck, AC Repair)..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.9375rem',
                    color: '#0F172A',
                    fontWeight: 500
                  }}
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'rgba(100, 116, 139, 0.12)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#475569',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.3rem 0.6rem',
                      flexShrink: 0
                    }}
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderRadius: '8px', flexShrink: 0 }}
                  >
                    Search
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions Dropdown */}
              {searchFocused && searchQuery.trim().length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 20px 30px -8px rgba(0, 0, 0, 0.35)',
                  border: '1px solid #E2E8F0',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  zIndex: 50,
                  padding: '0.5rem'
                }}>
                  {filteredServices.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                      No services found for "{searchQuery}"
                    </div>
                  ) : (
                    <div>
                      <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94A3B8' }}>
                        Matching Services ({filteredServices.length})
                      </div>
                      {filteredServices.slice(0, 6).map((service) => {
                        const cat = categories.find(c => c.id === service.categoryId);
                        const cfg = getServiceConfig(service.name, cat?.name);
                        return (
                          <div
                            key={service.id}
                            className="search-dropdown-card"
                            onMouseDown={() => navigate(`/services/${service.id}`)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.6rem 0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              gap: '0.75rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: cfg.bg,
                                color: cfg.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {React.cloneElement(cfg.icon, { size: 16 })}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                                  {service.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                  {cat?.name || 'General Service'}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                ₹{service.price}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quick Trending Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 500, marginRight: '0.2rem' }}>
                  Popular:
                </span>
                {trendingSearches.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(chip.label);
                      const matchedCat = categories.find(c => c.name.toLowerCase().includes(chip.label.toLowerCase()));
                      if (matchedCat) setSelectedCategory(matchedCat.id);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#E2E8F0',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      transition: 'all 0.15s ease',
                      backdropFilter: 'blur(4px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Glassmorphic Stats Grid */}
          <div style={{ flex: '1 1 360px', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              padding: '1.4rem',
              boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Zap size={22} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Instant Dispatch</h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.78rem', margin: '2px 0 0 0' }}>Average 45 mins arrival time</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ color: '#38BDF8', fontSize: '1.35rem', fontWeight: 800 }}>5,000+</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Verified Partners</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ color: '#FBBF24', fontSize: '1.35rem', fontWeight: 800 }}>4.9 ★</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Service Rating</div>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              padding: '0.85rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <ShieldCheck size={20} color="#10B981" style={{ flexShrink: 0 }} />
              <span style={{ color: '#CBD5E1', fontSize: '0.8125rem' }}>
                <strong>Taaskr Shield:</strong> 100% background checked & insured work.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Highlights Strip */}
      <section style={{ background: 'var(--bg-card)', padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          {[
            { icon: <ShieldCheck size={24} color="var(--success)" />, title: 'Verified Professionals', desc: 'Background checked & highly rated' },
            { icon: <Tag size={24} color="var(--primary)" />, title: 'Transparent Pricing', desc: 'No hidden fees or surprise charges' },
            { icon: <CreditCard size={24} color="#0284C7" />, title: 'Secure Booking', desc: 'Pay safely online or after service' },
            { icon: <Star size={24} color="#D97706" />, title: 'Reliable Service', desc: 'Guaranteed quality execution' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: '220px' }}>
              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.15rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Services Area with Category Tiles */}
      <main className="app-container" style={{ paddingTop: '3.5rem', paddingBottom: '5rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Services That Make Life Easier
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Find trusted professionals for your everyday needs — from home repairs to maintenance and transport.
          </p>
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
          <div className="grid-cols-4">
            {filteredServices.map((service) => {
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
        )}
      </main>
    </div>
  );
}
