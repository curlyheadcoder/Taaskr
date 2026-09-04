import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Zap, CreditCard, LayoutList, 
  Sparkles, Droplets, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, ArrowRight, Activity, Stethoscope, Building2,
  CheckCircle2, Clock
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

  // Search matcher across service name, description, category name
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

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery.trim() === '' || doesServiceMatch(service, searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryName) => {
    const cat = (categoryName || '').toLowerCase();
    if (cat.includes('clean')) return <Sparkles size={18} />;
    if (cat.includes('plumb')) return <Droplets size={18} />;
    if (cat.includes('electric') || cat.includes('wire')) return <Zap size={18} />;
    if (/\bac\b/.test(cat) || cat.includes('cool') || cat.includes('refrigerat')) return <Snowflake size={18} />;
    if (cat.includes('security') || cat.includes('guard') || cat.includes('cctv') || cat.includes('lock')) return <ShieldCheck size={18} />;
    if (cat.includes('appliance') || cat.includes('repair')) return <Settings size={18} />;
    if (cat.includes('paint')) return <Paintbrush size={18} />;
    if (cat.includes('garden') || cat.includes('lawn')) return <Leaf size={18} />;
    if (cat.includes('logistics') || cat.includes('mov') || cat.includes('vehicle') || cat.includes('transport') || cat.includes('truck') || cat.includes('cargo') || cat.includes('courier') || cat.includes('freight')) return <Truck size={18} />;
    if (cat.includes('carpent') || cat.includes('wood')) return <Ruler size={18} />;
    if (cat.includes('diagnostic') || cat.includes('test') || cat.includes('blood')) return <Activity size={18} />;
    if (cat.includes('health') || cat.includes('care') || cat.includes('doctor')) return <Stethoscope size={18} />;
    if (cat.includes('civil') || cat.includes('property') || cat.includes('mason') || cat.includes('roof') || cat.includes('floor')) return <Building2 size={18} />;
    return <LayoutList size={18} />;
  };

  const getServiceIcon = (serviceName, categoryName) => {
    const name = (serviceName || '').toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    
    if (cat.includes('civil') || cat.includes('property') || name.includes('roof') || name.includes('mason') || name.includes('tile') || name.includes('floor')) return <Building2 size={22} />;
    if (cat.includes('security') || name.includes('security') || name.includes('lock') || name.includes('cctv') || name.includes('guard')) return <ShieldCheck size={22} />;
    if (cat.includes('electric') || name.includes('switch') || name.includes('wire') || name.includes('fan') || name.includes('board')) return <Zap size={22} />;
    if (cat.includes('plumb') || name.includes('tap') || name.includes('pipe') || name.includes('leak') || name.includes('drain')) return <Droplets size={22} />;
    if (/\bac\b/.test(name) || name.includes('air condition') || name.includes('refrigerat') || name.includes('cooler')) return <Snowflake size={22} />;
    if (cat.includes('clean') || name.includes('clean') || name.includes('dust') || name.includes('mop')) return <Sparkles size={22} />;
    if (cat.includes('logistics') || cat.includes('truck') || cat.includes('courier') || cat.includes('freight') || name.includes('truck') || name.includes('shifting')) return <Truck size={22} />;
    if (cat.includes('diagnostic') || name.includes('blood') || name.includes('test') || name.includes('pathology')) return <Activity size={22} />;
    if (cat.includes('health') || name.includes('doctor') || name.includes('nurse')) return <Stethoscope size={22} />;
    if (cat.includes('appliance') || name.includes('machine') || name.includes('microwave') || name.includes('tv')) return <Settings size={22} />;
    if (name.includes('paint') || cat.includes('paint')) return <Paintbrush size={22} />;
    if (name.includes('carpent') || name.includes('wood') || cat.includes('carpent')) return <Ruler size={22} />;
    if (name.includes('garden') || cat.includes('garden')) return <Leaf size={22} />;
    
    return <Settings size={22} />;
  };

  return (
    <div className="animate-fade-in" style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh' }}>
      
      {/* Premium Hero Section */}
      <section style={{
        backgroundColor: 'var(--bg-header)',
        borderBottom: '1px solid var(--border-light)',
        padding: '3.75rem 1.5rem 3.5rem 1.5rem',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          
          {/* Trust Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            backgroundColor: 'var(--icon-container)',
            border: '1px solid var(--border-light)',
            borderRadius: '9999px',
            padding: '0.3rem 0.85rem',
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={14} color="var(--secondary-accent)" />
            <span style={{ color: 'var(--secondary-accent)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.02em' }}>
              Verified Professionals • Upfront Pricing
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
            fontWeight: 700,
            color: 'var(--text-main)',
            lineHeight: 1.15,
            marginBottom: '1rem',
            letterSpacing: '-0.03em'
          }}>
            Reliable home services, <span style={{ color: 'var(--primary)' }}>on demand.</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '1.05rem',
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            maxWidth: '580px',
            margin: '0 auto 2rem auto'
          }}>
            Book certified electricians, plumbers, appliance technicians, and home experts with instant dispatch and guaranteed quality.
          </p>

          {/* Central Search Bar */}
          <div style={{
            maxWidth: '580px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-page)',
              borderRadius: '12px',
              padding: '0.55rem 0.85rem 0.55rem 1.1rem',
              gap: '0.75rem',
              border: '1px solid var(--border-light)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
              transition: 'var(--transition-fast)'
            }}>
              <Search size={19} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What service do you need today?"
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  width: '100%',
                  fontSize: '0.92rem',
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

          {/* Trust Value Highlights */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap',
            marginTop: '2rem',
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} color="var(--success)" />
              <span>Background Checked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} color="var(--secondary-accent)" />
              <span>Fast Doorstep Dispatch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CreditCard size={15} color="var(--primary)" />
              <span>Pay After Completion</span>
            </div>
          </div>

        </div>
      </section>

      {/* Main Services Area with Category Horizontal Nav & Grid */}
      <main id="services-catalog" className="app-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        
        {/* Horizontal Category Navigation */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="category-nav-scroll">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
            >
              <LayoutList size={16} />
              <span>All Services</span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-btn ${isSelected ? 'active' : ''}`}
                >
                  {getCategoryIcon(cat.name)}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Catalog Section Header */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600 }}>
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.name || 'Category'} Services` 
              : 'All Available Services'}
          </h2>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
          </span>
        </div>

        {/* Services Grid */}
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
              We couldn't find any services matching your search query. Try adjusting your filters or search for another keyword.
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
                const icon = getServiceIcon(service.name, cat?.name);
                const priceUnit = service.pricingType === 'HOURLY' ? '/ hr' : service.pricingType === 'PER_KM' ? '/ km' : '';

                return (
                  <div
                    key={service.id}
                    className="service-card"
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    {/* Consistent Icon Container */}
                    <div className="service-icon-box">
                      {icon}
                    </div>

                    {/* Service Name */}
                    <h3 className="service-card-title">{service.name}</h3>

                    {/* Short Description */}
                    <p className="service-card-desc">
                      {service.description}
                    </p>

                    {/* Bottom Pricing & CTA */}
                    <div className="service-card-footer">
                      <div>
                        <div className="service-price-label">
                          Starting from
                        </div>
                        <div className="service-price-value">
                          ₹{service.price} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>{priceUnit}</span>
                        </div>
                      </div>
                      
                      <div className="service-card-cta">
                        <span>View</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div style={{ marginTop: '2rem' }}>
              <Pagination
                currentPage={servicesPage}
                totalItems={filteredServices.length}
                itemsPerPage={servicesPerPage}
                onPageChange={setServicesPage}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
