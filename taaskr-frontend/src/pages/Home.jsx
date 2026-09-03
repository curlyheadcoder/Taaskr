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

  return (
    <div className="animate-fade-in">
      {/* Premium Hero Section */}
      <section style={{
        position: 'relative',
        background: `linear-gradient(to right, #0F172A 0%, #1E293B 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '5rem 2rem',
        minHeight: '420px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: '650px' }}>
            <span className="badge" style={{ background: 'var(--primary)', color: '#fff', marginBottom: '1.25rem', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
              Premium Quality Guaranteed
            </span>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              Trusted Services.<br />Right at Your Door.
            </h1>
            <p style={{
              fontSize: '1.1rem',
              color: '#cbd5e1',
              marginBottom: '2rem',
              lineHeight: 1.6
            }}>
              Book verified professionals for home repairs, maintenance, and everyday freight services. Experience seamless booking and reliable execution.
            </p>

            {/* Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.5rem 0.4rem 1rem',
              gap: '0.75rem',
              maxWidth: '520px',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
            }}>
              <Search size={18} color="#64748B" />
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
                  color: '#0F172A'
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.4rem'
                  }}
                >
                  Clear
                </button>
              )}
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
