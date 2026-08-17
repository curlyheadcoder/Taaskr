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

  // Filter services by category and search query
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.categoryId === selectedCategory : true;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get matching category icon/emoji helper
  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'plumbing': return '🪠';
      case 'cleaning': return '🧹';
      case 'electrical': return '⚡';
      default: return '🛠️';
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.08))',
        borderBottom: '1px solid var(--border-glass)',
        padding: '5rem 1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        margin: '1rem'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '60%',
          height: '140%',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            marginBottom: '1rem',
            lineHeight: 1.1,
            background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.04em'
          }}>
            Premium Home Services <br />
            On Demand
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            marginBottom: '2.5rem',
            lineHeight: 1.5
          }}>
            Connect instantly with approved local professionals. Reliable, fast, and fully insured.
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              left: '1.25rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.2rem',
              color: 'var(--text-muted)'
            }}>🔍</span>
            <input
              type="text"
              placeholder="Search for tap repair, home cleaning, electricians..."
              className="form-control"
              style={{
                width: '100%',
                paddingLeft: '3.25rem',
                paddingRight: '1rem',
                height: '3.5rem',
                fontSize: '1.1rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(15, 17, 26, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="app-container">
        {/* Category Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '3rem',
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            All Services
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-full)' }}
            >
              {getCategoryIcon(cat.name)} {cat.name}
            </button>
          ))}
        </div>

        {/* Catalog Section Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span> Available Services
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Showing {filteredServices.length} home maintenance options
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <div style={{
              display: 'inline-block',
              width: '30px',
              height: '30px',
              border: '2.5px solid var(--border-glass)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '1rem' }}>Fetching services catalog...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="glass-panel" style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontSize: '3rem' }}>🔍</span>
            <h3 style={{ color: '#fff', marginTop: '1rem', fontSize: '1.4rem' }}>No Services Found</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
              We couldn't find any services matching your search or filters. Try adjusting your settings.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid-cols-3">
            {filteredServices.map((service) => {
              const cat = categories.find(c => c.id === service.categoryId);
              return (
                <div
                  key={service.id}
                  className="glass-card-interactive"
                  onClick={() => navigate(`/services/${service.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span className="badge badge-assigned" style={{ fontSize: '0.7rem' }}>
                      {cat ? cat.name : 'Service'}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}>
                      ₹{service.price}
                    </span>
                  </div>

                  <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>{service.name}</h3>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    marginBottom: '1.5rem',
                    minHeight: '40px'
                  }}>
                    {service.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-glass)',
                    paddingTop: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>⏱️ {service.durationMinutes} Mins</span>
                    <span style={{
                      color: 'var(--primary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}>
                      Book Now ➔
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
