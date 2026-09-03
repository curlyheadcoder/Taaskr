import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2,
  CheckCircle2, Clock, ChevronLeft, ChevronRight, Zap as Flash, Box, Wrench
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const categoryScrollRef = useRef(null);
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

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getServiceConfig = (serviceName, categoryName) => {
    const name = (serviceName || '').toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    
    if (cat.includes('logistics') || cat.includes('cargo') || cat.includes('courier') || cat.includes('vehicle') || cat.includes('transport') || cat.includes('delivery') || name.includes('bike') || name.includes('truck') || name.includes('rickshaw') || name.includes('loading') || name.includes('tempo')) {
      return { icon: <Truck size={20} />, color: '#2563EB', bg: 'var(--primary-subtle)' };
    }
    if (cat.includes('clean') || name.includes('clean')) return { icon: <Sparkles size={20} />, color: '#2563EB', bg: 'var(--primary-subtle)' };
    if (cat.includes('plumb') || name.includes('tap') || name.includes('pipe') || name.includes('leak')) return { icon: <Droplets size={20} />, color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)' };
    if (cat.includes('electric') || name.includes('switch') || name.includes('fan') || name.includes('wire')) return { icon: <Zap size={20} />, color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' };
    if (name.includes('ac') || name.includes('refrigerator') || name.includes('cool')) return { icon: <Snowflake size={20} />, color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)' };
    if (name.includes('ro ') || name.startsWith('ro') || name.includes('water')) return { icon: <Droplets size={20} />, color: '#0284C7', bg: 'rgba(2, 132, 199, 0.1)' };
    if (cat.includes('security') || name.includes('cctv') || name.includes('lock') || name.includes('guard')) return { icon: <ShieldCheck size={20} />, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' };
    if (cat.includes('appliance') || name.includes('machine') || name.includes('repair')) return { icon: <Settings size={20} />, color: '#475569', bg: 'rgba(71, 85, 105, 0.1)' };
    if (cat.includes('diagnostic') || name.includes('blood') || name.includes('checkup')) return { icon: <Activity size={20} />, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' };
    if (cat.includes('health') || name.includes('patient') || name.includes('compounder')) return { icon: <Stethoscope size={20} />, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' };
    if (cat.includes('civil') || name.includes('masonry') || name.includes('roof') || name.includes('floor')) return { icon: <Building2 size={20} />, color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' };
    if (name.includes('paint')) return { icon: <Paintbrush size={20} />, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' }; 
    if (name.includes('garden') || name.includes('lawn')) return { icon: <Leaf size={20} />, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' }; 
    if (name.includes('carpent') || name.includes('wood')) return { icon: <Ruler size={20} />, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' }; 
    return { icon: <Hammer size={20} />, color: '#475569', bg: 'rgba(71, 85, 105, 0.1)' };
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-light)',
        padding: '3rem 1.5rem 2.5rem 1.5rem'
      }}>
        <div className="app-container" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2.5rem', alignItems: 'center' }}>
            
            {/* Left Side: Headline & Search */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.875rem' }}>
                <ShieldCheck size={14} />
                <span>Verified On-Demand Platform</span>
              </div>
              
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                lineHeight: 1.2,
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem'
              }}>
                Professional Services & Logistics, Simplified.
              </h1>
              
              <p style={{
                fontSize: '0.9375rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: '1.5rem'
              }}>
                Book vetted electricians, technicians, home specialists, and on-demand freight transport with upfront pricing and live tracking.
              </p>

              {/* Search Input Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-page)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.35rem 0.5rem 0.35rem 1rem',
                gap: '0.75rem',
                maxWidth: '520px',
                boxShadow: 'var(--shadow-xs)',
                marginBottom: '1rem'
              }}>
                <Search size={18} color="var(--text-light)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services (e.g. Electrician, Mini Truck, AC Repair)..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.4rem'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Quick Search Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Popular:</span>
                {['Electrician', 'Mini Truck', 'AC Repair', 'Plumbing', 'Cleaning'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchQuery(term)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side: Instant Dispatch & Live Highlights Widget */}
            <div className="panel" style={{ background: 'var(--bg-subtle)', padding: '1.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                  <Flash size={15} color="#D97706" />
                  <span>Express Dispatch Available</span>
                </div>
                <span className="badge badge-completed" style={{ fontSize: '0.6875rem' }}>
                  Avg ETA &lt; 15 mins
                </span>
              </div>

              {/* Express Service Shortcuts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { title: 'Emergency Electrician', desc: 'Short circuit, switch & wiring fix', price: '₹199', icon: <Zap size={14} color="#D97706" />, query: 'Electric' },
                  { title: 'Intra-City Mini Truck Freight', desc: 'Commercial transport & furniture moving', price: '₹350', icon: <Truck size={14} color="var(--primary)" />, query: 'Truck' },
                  { title: 'AC Servicing & Repair', desc: 'Gas refill, cleaning & compressor repair', price: '₹499', icon: <Snowflake size={14} color="#0284C7" />, query: 'AC' },
                  { title: 'Plumbing & Water Leak Fix', desc: 'Tap, pipe, drain & bathroom repair', price: '₹199', icon: <Droplets size={14} color="#0284C7" />, query: 'Plumb' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const matched = services.find(s => s.name.toLowerCase().includes(item.query.toLowerCase()));
                      if (matched) {
                        navigate(`/services/${matched.id}`);
                      } else {
                        setSearchQuery(item.query);
                      }
                    }}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>{item.title}</div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>{item.price}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--primary)', display: 'block', fontWeight: 600 }}>Book &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Trust Highlights Strip */}
      <section style={{
        backgroundColor: 'var(--bg-page)',
        borderBottom: '1px solid var(--border-light)',
        padding: '1.25rem 1.5rem'
      }}>
        <div className="app-container" style={{ padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {[
            { icon: <ShieldCheck size={18} color="var(--primary)" />, title: 'Vetted Experts', desc: 'Background & skill verified' },
            { icon: <Tag size={18} color="var(--primary)" />, title: 'Transparent Quotes', desc: 'Standardized rate cards' },
            { icon: <CreditCard size={18} color="var(--primary)" />, title: 'Secure Escrow', desc: 'Pay online or cash upon service' },
            { icon: <Clock size={18} color="var(--primary)" />, title: 'Flexible Scheduling', desc: 'Instant dispatch or scheduled slots' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Catalog & Services Grid */}
      <main className="app-container" style={{ paddingTop: '2rem' }}>
        
        {/* Category Filter Horizontal Bar with Clean Controls */}
        <div style={{ marginBottom: '1.75rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            
            <button
              onClick={() => scrollCategories('left')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.5rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Scroll categories left"
            >
              <ChevronLeft size={14} />
            </button>

            <div 
              ref={categoryScrollRef}
              className="no-scrollbar"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                overflowX: 'auto', 
                scrollBehavior: 'smooth',
                padding: '0.2rem 0'
              }}
            >
              <button
                onClick={() => setSelectedCategory(null)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: selectedCategory === null ? 600 : 500,
                  border: '1px solid',
                  borderColor: selectedCategory === null ? 'var(--primary)' : 'var(--border-light)',
                  backgroundColor: selectedCategory === null ? 'var(--primary-subtle)' : 'var(--bg-card)',
                  color: selectedCategory === null ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'var(--transition-fast)'
                }}
              >
                <LayoutList size={14} />
                <span>All Services</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({services.length})</span>
              </button>

              {categories.map((cat) => {
                const count = services.filter(s => s.categoryId === cat.id).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 600 : 500,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                      backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({count})</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.35rem 0.5rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Scroll categories right"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Section Header with Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'All Available Services'}
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
            </p>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="panel" style={{ height: '200px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '40px', height: '40px' }} />
                <div className="skeleton" style={{ width: '70%', height: '18px' }} />
                <div className="skeleton" style={{ width: '100%', height: '14px' }} />
                <div className="skeleton" style={{ width: '40%', height: '14px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={20} />
            </div>
            <h3 className="empty-state-title">No services found</h3>
            <p className="empty-state-description">
              We couldn't find any services matching your filter criteria. Try searching with a different term or reset filters.
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
                    {service.description.length > 90 
                      ? service.description.substring(0, 90) + '...' 
                      : service.description}
                  </p>

                  <div className="service-card-footer">
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        Base rate
                      </span>
                      <span className="service-price">
                        ₹{service.price} {priceUnit}
                      </span>
                    </div>
                    
                    <span className="service-cta">
                      Book <ArrowRight size={14} />
                    </span>
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
