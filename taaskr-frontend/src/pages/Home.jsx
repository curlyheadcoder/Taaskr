import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Clock, Activity, Stethoscope, Building2
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const cats = await api.catalog.getCategories();
        setCategories(cats);
        
        const servs = await api.catalog.getServices();
        setServices(servs);
      } catch (err) {
        console.error('Error loading catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  const filteredServices = services.filter(service => {
    return selectedCategory ? service.categoryId === selectedCategory : true;
  });

  const getCategoryIcon = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('clean')) return <Sparkles className="w-8 h-8" />;
    if (cat.includes('plumb')) return <Droplets className="w-8 h-8" />;
    if (cat.includes('electric') || cat.includes('wire')) return <Zap className="w-8 h-8" />;
    if (cat.includes('ac ') || cat.includes('cool') || cat.includes('refrigerat')) return <Snowflake className="w-8 h-8" />;
    if (cat.includes('ro ') || cat.includes('water')) return <Droplets className="w-8 h-8" />;
    if (cat.includes('security') || cat.includes('guard') || cat.includes('cctv')) return <ShieldCheck className="w-8 h-8" />;
    if (cat.includes('appliance') || cat.includes('repair')) return <Settings className="w-8 h-8" />;
    if (cat.includes('paint')) return <Paintbrush className="w-8 h-8" />;
    if (cat.includes('garden') || cat.includes('lawn')) return <Leaf className="w-8 h-8" />;
    if (cat.includes('mov')) return <Truck className="w-8 h-8" />;
    if (cat.includes('carpent') || cat.includes('wood')) return <Ruler className="w-8 h-8" />;
    if (cat.includes('diagnostic') || cat.includes('test')) return <Activity className="w-8 h-8" />;
    if (cat.includes('health') || cat.includes('care') || cat.includes('compound')) return <Stethoscope className="w-8 h-8" />;
    if (cat.includes('civil') || cat.includes('property') || cat.includes('mason') || cat.includes('roof')) return <Building2 className="w-8 h-8" />;
    return <Hammer className="w-8 h-8" />;
  };

  const getServiceConfig = (serviceName, categoryName) => {
    const name = serviceName.toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    
    if (cat.includes('clean') || name.includes('clean')) return { icon: <Sparkles className="service-icon" />, color: '#3B82F6', bg: '#EFF6FF' };
    if (cat.includes('plumb') || name.includes('tap') || name.includes('pipe') || name.includes('leak')) return { icon: <Droplets className="service-icon" />, color: '#06B6D4', bg: '#ECFEFF' };
    if (cat.includes('electric') || name.includes('switch') || name.includes('fan') || name.includes('wire')) return { icon: <Zap className="service-icon" />, color: '#EAB308', bg: '#FEFCE8' };
    if (name.includes('ac') || name.includes('refrigerator') || name.includes('cool')) return { icon: <Snowflake className="service-icon" />, color: '#0EA5E9', bg: '#F0F9FF' };
    if (name.includes('ro ') || name.startsWith('ro') || name.includes('water')) return { icon: <Droplets className="service-icon" />, color: '#38BDF8', bg: '#F0F9FF' };
    if (cat.includes('security') || name.includes('cctv') || name.includes('lock') || name.includes('guard')) return { icon: <ShieldCheck className="service-icon" />, color: '#A855F7', bg: '#FAF5FF' };
    if (cat.includes('appliance') || name.includes('machine') || name.includes('repair')) return { icon: <Settings className="service-icon" />, color: '#64748B', bg: '#F8FAFC' };
    if (cat.includes('diagnostic') || name.includes('blood') || name.includes('checkup')) return { icon: <Activity className="service-icon" />, color: '#EF4444', bg: '#FEF2F2' };
    if (cat.includes('health') || name.includes('patient') || name.includes('compounder')) return { icon: <Stethoscope className="service-icon" />, color: '#14B8A6', bg: '#F0FDFA' };
    if (cat.includes('civil') || name.includes('masonry') || name.includes('roof') || name.includes('floor')) return { icon: <Building2 className="service-icon" />, color: '#F97316', bg: '#FFF7ED' };
    
    if (name.includes('paint')) return { icon: <Paintbrush className="service-icon" />, color: '#A855F7', bg: '#FAF5FF' }; 
    if (name.includes('garden') || name.includes('lawn')) return { icon: <Leaf className="service-icon" />, color: '#22C55E', bg: '#F0FDF4' }; 
    if (name.includes('mov')) return { icon: <Truck className="service-icon" />, color: '#F97316', bg: '#FFF7ED' }; 
    if (name.includes('carpent') || name.includes('wood')) return { icon: <Ruler className="service-icon" />, color: '#8B5CF6', bg: '#F5F3FF' }; 
    return { icon: <Hammer className="service-icon" />, color: '#6366F1', bg: '#EEF2FF' };
  };

  return (
    <div className="animate-fade-in">
      {/* Premium Hero Section */}
      <section style={{
        position: 'relative',
        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 60%, transparent 100%), url('/hero-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '8rem 2rem',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: '650px' }}>
            <span className="badge" style={{ background: 'var(--secondary)', color: '#fff', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Premium Quality Guaranteed
            </span>
            <h1 style={{
              fontSize: '4rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Trusted Services.<br />Right at Your Door.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#e2e8f0',
              marginBottom: '2.5rem',
              lineHeight: 1.6
            }}>
              Book verified professionals for home repairs, maintenance, and everyday services. Experience seamless booking and reliable execution.
            </p>

            {/* Call to Action button */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="#catalog-section"
                className="btn btn-primary"
                style={{
                  padding: '1rem 2.25rem',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#2563EB',
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)'
                }}
              >
                Explore Services <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ background: 'var(--bg-card)', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          {[
            { icon: <ShieldCheck size={32} color="var(--success)" />, title: 'Verified Professionals', desc: 'Background checked & highly rated' },
            { icon: <Tag size={32} color="var(--primary)" />, title: 'Transparent Pricing', desc: 'No hidden fees or surprise charges' },
            { icon: <CreditCard size={32} color="var(--info)" />, title: 'Secure Booking', desc: 'Pay safely online or after service' },
            { icon: <Star size={32} color="var(--warning)" />, title: 'Reliable Service', desc: 'Guaranteed quality execution' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
              <div style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: '50%' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Services Area with Premium Background */}
      <div id="catalog-section" className="services-section-bg">
        <main className="app-container" style={{ paddingTop: '5rem', paddingBottom: '6rem' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem', maxWidth: '800px', margin: '0 auto 4rem' }}>
            <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--primary)' }}>
              Services That Make Life Easier
            </h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Find trusted professionals for your everyday needs — from home repairs to maintenance and more.
            </p>
          </div>

          {/* Service Categories */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                className="premium-card premium-card-hover"
                style={{
                  border: selectedCategory === null ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  padding: '1.5rem', cursor: 'pointer', minWidth: '150px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}
              >
                <div style={{ marginBottom: '1rem', color: selectedCategory === null ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <LayoutList size={32} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>All Services</div>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="premium-card premium-card-hover"
                  style={{
                    border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    padding: '1.5rem', cursor: 'pointer', minWidth: '150px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}
                >
                  <div style={{ marginBottom: '1rem', color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Services Grid */}
          <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 700 }}>
              Showing {filteredServices.length} {selectedCategory ? 'services' : 'options'}
            </h3>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--text-muted)' }}>
              <div style={{
                display: 'inline-block', width: '40px', height: '40px',
                border: '4px solid var(--border-light)', borderTopColor: 'var(--primary)',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: '1.5rem', fontWeight: 500, fontSize: '1.1rem' }}>Fetching available services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="premium-card" style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: '24px' }}>
              <div style={{ color: 'var(--text-light)', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Search size={64} />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>No Services Found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                We couldn't find any services matching your search. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid-cols-4">
              {filteredServices.map((service) => {
                const cat = categories.find(c => c.id === service.categoryId);
                const config = getServiceConfig(service.name, cat?.name);
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
                      {service.description.length > 80 
                        ? service.description.substring(0, 80) + '...' 
                        : service.description}
                    </p>

                    <div className="service-card-footer">
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                          Starting from
                        </div>
                        <div className="service-price">
                          ₹{service.price}
                        </div>
                      </div>
                      
                      <button className="service-cta" style={{ color: config.color }} onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/services/${service.id}`);
                      }}>
                        View Service <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

