import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

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
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'plumbing': return '💧';
      case 'cleaning': return '✨';
      case 'electrical': return '🔌';
      case 'appliances': return '❄️';
      default: return '🛠️';
    }
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

            {/* Search bar */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-card)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
                <input
                  type="text"
                  placeholder="What do you need help with?"
                  style={{
                    width: '100%', border: 'none', padding: '1rem 1rem 1rem 3.5rem',
                    fontSize: '1.05rem', outline: 'none', borderRadius: 'var(--radius-md)'
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" style={{ padding: '0 2rem' }}>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section style={{ background: 'var(--bg-card)', padding: '3rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          {[
            { icon: '🛡️', title: 'Verified Professionals', desc: 'Background checked & highly rated' },
            { icon: '🏷️', title: 'Transparent Pricing', desc: 'No hidden fees or surprise charges' },
            { icon: '💳', title: 'Secure Booking', desc: 'Pay safely online or after service' },
            { icon: '⭐', title: 'Reliable Service', desc: 'Guaranteed quality execution' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '2rem', background: 'var(--bg-page)', padding: '1.25rem', borderRadius: '50%' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>{item.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <main className="app-container" style={{ paddingTop: '4rem' }}>
        {/* Service Discovery Section */}
        <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--primary)' }}>What do you need help with?</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className="premium-card premium-card-hover"
              style={{
                border: selectedCategory === null ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                padding: '1.5rem', cursor: 'pointer', minWidth: '150px'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>All Services</div>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="premium-card premium-card-hover"
                style={{
                  border: selectedCategory === cat.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  padding: '1.5rem', cursor: 'pointer', minWidth: '150px'
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{getCategoryIcon(cat.name)}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Services Grid */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Popular Services
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>
            Showing {filteredServices.length} home maintenance options
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div style={{
              display: 'inline-block', width: '30px', height: '30px',
              border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '1rem', fontWeight: 500 }}>Fetching available services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="premium-card" style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '4rem' }}>🔍</span>
            <h3 style={{ marginTop: '1rem', fontSize: '1.5rem' }}>No Services Found</h3>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              We couldn't find any services matching your search. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid-cols-3">
            {filteredServices.map((service) => {
              const cat = categories.find(c => c.id === service.categoryId);
              return (
                <div
                  key={service.id}
                  className="premium-card premium-card-hover"
                  onClick={() => navigate(`/services/${service.id}`)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <span className="badge" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                      {cat ? cat.name.toUpperCase() : 'SERVICE'}
                    </span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{service.price}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{service.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem', flex: 1 }}>
                    {service.description}
                  </p>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ⏱️ {service.durationMinutes} Mins
                    </span>
                    <button className="btn btn-accent btn-small" onClick={(e) => {
                       e.stopPropagation();
                       navigate(`/services/${service.id}`);
                    }}>
                      Book Now
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
