import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Sun, Moon, Briefcase, ShieldCheck, Calendar, Grid, LogOut, 
  MapPin, Search, ChevronDown, Bot, Navigation, X, Check, ArrowRight, Command, AlertCircle, MessageSquare
} from 'lucide-react';

const ACTIVE_CITY = { city: 'Indore', area: 'Indore Metro (All Service Zones)', status: 'ACTIVE' };
const COMING_SOON_CITIES = [
  { city: 'Bhopal', area: 'MP Nagar & Arera Colony' },
  { city: 'Ujjain', area: 'Freeganj & Mahakal Zone' },
  { city: 'Gwalior', area: 'City Centre & Lashkar' },
  { city: 'Jabalpur', area: 'Wright Town & Civil Lines' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Location Selector State
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationToast, setLocationToast] = useState('');
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('taaskr_location');
      return saved ? JSON.parse(saved) : ACTIVE_CITY;
    } catch (e) {
      return ACTIVE_CITY;
    }
  });
  const locationDropdownRef = useRef(null);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [allServices, setAllServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Keyboard shortcut (Ctrl+K / Cmd+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load catalog for search autocomplete
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const [cats, servs] = await Promise.all([
          api.catalog.getCategories(),
          api.catalog.getServices()
        ]);
        if (isMounted) {
          setCategories(cats || []);
          setAllServices((servs || []).filter(s => s.active !== false));
        }
      } catch (err) {
        console.error('Failed to pre-load catalog for search:', err);
      }
    };
    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // Filter search results dynamically
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const qTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const results = allServices.filter(service => {
      const cat = categories.find(c => c.id === service.categoryId);
      const catName = (cat?.name || '').toLowerCase();
      const sName = (service.name || '').toLowerCase();
      const sDesc = (service.description || '').toLowerCase();
      const fullText = `${sName} ${catName} ${sDesc}`;
      return qTokens.every(token => fullText.includes(token));
    });
    setSearchResults(results.slice(0, 8));
  }, [searchQuery, allServices, categories]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  const checkUser = async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
      document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
      if (profile.role === 'PROVIDER') {
        document.body.classList.add('theme-provider');
      } else if (profile.role === 'ADMIN') {
        document.body.classList.add('theme-admin');
      } else {
        document.body.classList.add('theme-user');
      }
    } catch (e) {
      setUser(null);
      document.body.classList.remove('theme-user', 'theme-provider', 'theme-admin');
      document.body.classList.add('theme-user');
    }
  };

  useEffect(() => {
    checkUser();
  }, [location.pathname]);

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    document.body.classList.remove('theme-provider', 'theme-admin');
    document.body.classList.add('theme-user');
    navigate('/login');
  };

  const handleSelectLocation = (loc) => {
    setCurrentLocation(loc);
    localStorage.setItem('taaskr_location', JSON.stringify(loc));
    window.dispatchEvent(new CustomEvent('taaskr_location_change', { detail: loc }));
    setLocationOpen(false);
  };

  const handleComingSoonClick = (cityName) => {
    setLocationToast(`Launching soon in ${cityName}! Currently serving all Indore zones.`);
    setTimeout(() => {
      setLocationToast('');
    }, 3500);
  };

  const isCustomerView = !user || user.role === 'USER';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-light)',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      height: '58px'
    }}>
      {/* Left Section: Brand Logo & Navigation Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
        <Link 
          to={user?.role === 'PROVIDER' ? '/provider' : user?.role === 'ADMIN' ? '/admin' : '/'} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', textDecoration: 'none' }}
        >
          <img
            src="/taaskr-logo.png"
            alt="Taaskr"
            width="26"
            height="26"
            style={{ display: 'block', objectFit: 'contain' }}
          />
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.03em'
          }}>Taaskr</span>
        </Link>

        {/* Location Selector (User / Guest Only) */}
        {isCustomerView && (
          <div ref={locationDropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setLocationOpen(!locationOpen)}
              className="btn btn-ghost btn-sm"
              title="Change service location"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: locationOpen ? 'var(--icon-container)' : 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <MapPin size={14} color="var(--primary)" />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentLocation.city || 'Indore'}
              </span>
              <ChevronDown size={13} style={{ opacity: 0.7, transform: locationOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Location Dropdown Modal */}
            {locationOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '320px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-xl)',
                padding: '1rem',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Service Locations
                  </span>
                  <button 
                    onClick={() => setLocationOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {locationToast && (
                  <div style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#D97706',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    marginBottom: '0.75rem',
                    lineHeight: 1.35
                  }}>
                    {locationToast}
                  </div>
                )}

                {/* Active Operating City: Indore */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                    Currently Live
                  </div>
                  <button
                    onClick={() => handleSelectLocation(ACTIVE_CITY)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.8rem',
                      borderRadius: '10px',
                      border: '1.5px solid var(--primary)',
                      background: 'var(--primary-subtle)',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span>Indore</span>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10B981',
                          fontWeight: 700
                        }}>
                          ● Active Hub
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Live Dispatch across all Metro Zones
                      </div>
                    </div>
                    <Check size={16} color="var(--primary)" />
                  </button>
                </div>

                {/* Coming Soon Cities: Bhopal, Ujjain, Gwalior, Jabalpur */}
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                    Expanding Soon
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {COMING_SOON_CITIES.map((item) => (
                      <div
                        key={item.city}
                        onClick={() => handleComingSoonClick(item.city)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-subtle)',
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.city}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {item.area}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(245, 158, 11, 0.12)',
                          color: '#F59E0B',
                          border: '1px solid rgba(245, 158, 11, 0.25)'
                        }}>
                          Coming Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workspace Navigation Links */}
        <nav style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {isCustomerView && user && (
            <Link 
              to="/bookings" 
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: location.pathname === '/bookings' ? 600 : 500,
                color: location.pathname === '/bookings' ? 'var(--secondary-accent)' : 'var(--text-secondary)',
                backgroundColor: location.pathname === '/bookings' ? 'var(--icon-container)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                transition: 'var(--transition-fast)'
              }}
            >
              <Calendar size={15} />
              <span>My Bookings</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Center Section: Admin Console (Admin) | Provider Console & Connect with Admin (Provider) | Global Service Search (Customer) */}
      {user && user.role === 'ADMIN' ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Link
            to="/admin"
            style={{
              padding: '0.45rem 1.35rem',
              borderRadius: '24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: location.pathname === '/admin' ? '#818cf8' : 'var(--text-main)',
              backgroundColor: location.pathname === '/admin' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
              border: location.pathname === '/admin' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-light)',
              textDecoration: 'none',
              letterSpacing: '0.01em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
              boxShadow: location.pathname === '/admin' ? '0 0 12px rgba(99, 102, 241, 0.15)' : 'none'
            }}
          >
            <ShieldCheck size={16} />
            <span>Admin Console</span>
          </Link>
        </div>
      ) : user && user.role === 'PROVIDER' ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
          <Link
            to="/provider"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('switch-provider-tab', { detail: 'tasks' }));
            }}
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: '24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: location.pathname === '/provider' ? '#38bdf8' : 'var(--text-main)',
              backgroundColor: location.pathname === '/provider' ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-subtle)',
              border: location.pathname === '/provider' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-light)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              letterSpacing: '0.01em',
              transition: 'all 0.2s ease',
              boxShadow: location.pathname === '/provider' ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none'
            }}
          >
            <Briefcase size={15} />
            <span>Provider Console</span>
          </Link>
          <button
            onClick={() => {
              if (location.pathname !== '/provider') {
                navigate('/provider');
              }
              window.dispatchEvent(new CustomEvent('switch-provider-tab', { detail: 'discussions' }));
            }}
            style={{
              padding: '0.45rem 1.15rem',
              borderRadius: '24px',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease',
              boxShadow: 'none'
            }}
          >
            <MessageSquare size={15} />
            <span>Connect with Admin</span>
          </button>
        </div>
      ) : isCustomerView ? (
        <div ref={searchContainerRef} style={{ position: 'relative', flex: '0 1 320px', maxWidth: '380px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: searchOpen ? 'var(--bg-card)' : 'var(--bg-subtle)',
            borderRadius: '999px',
            border: searchOpen ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
            boxShadow: searchOpen ? '0 0 0 3px var(--primary-subtle)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <Search 
              size={14} 
              style={{ position: 'absolute', left: '0.85rem', color: searchOpen ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none' }} 
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search services (e.g. AC Repair, Cleaning)..."
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              style={{
                width: '100%',
                padding: '0.45rem 2rem 0.45rem 2.2rem',
                fontSize: '0.8125rem',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={{
                  position: 'absolute',
                  right: '0.65rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Spacious Responsive Search Results Tile Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 'min(640px, 92vw)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
              padding: '1rem',
              zIndex: 100,
              maxHeight: '440px',
              overflowY: 'auto',
              animation: 'fadeIn 0.15s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.45rem', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Matching Services ({searchResults.length})
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click tile to view details</span>
              </div>

              {searchResults.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '0.65rem'
                }}>
                  {searchResults.map((srv) => {
                    const cat = categories.find(c => c.id === srv.categoryId);
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/services/${srv.id}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.65rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                          backgroundColor: 'var(--bg-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {srv.name}
                          </div>
                          {cat && (
                            <div style={{
                              fontSize: '0.68rem',
                              color: 'var(--secondary-accent)',
                              fontWeight: 600,
                              marginTop: '0.1rem'
                            }}>
                              {cat.name}
                            </div>
                          )}
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                            ₹{srv.basePrice || srv.price}
                          </div>
                        </div>
                        <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                    No services found matching "{searchQuery}"
                  </p>
                  <p style={{ fontSize: '0.75rem' }}>
                    Try searching for keywords like AC, Cleaning, Plumbing, Electrician, or Shifting.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Right Controls: Theme Toggle & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        {/* Subtle Dark/Light Mode Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="btn btn-ghost btn-sm"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Dark / Light Theme"
          style={{
            padding: '0.4rem',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-card)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          {isDark ? <Sun size={15} color="#F59E0B" /> : <Moon size={15} color="#6366F1" />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Link
              to={user.role === 'PROVIDER' ? '/provider' : user.role === 'ADMIN' ? '/admin' : '/profile'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}
              title={
                !user.emailVerified && !user.phoneVerified
                  ? "Your email and phone are not verified yet. Click to view profile."
                  : !user.emailVerified
                  ? "Your email is not verified yet. Click to view profile."
                  : !user.phoneVerified
                  ? "Your phone is not verified yet. Click to view profile."
                  : "Verified Profile"
              }
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--icon-container)',
                color: 'var(--secondary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid var(--border-light)'
              }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {user.name}
                  </span>
                  {user.emailVerified && user.phoneVerified ? (
                    <span title="Verified Account" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--success)' }}>
                      <ShieldCheck size={14} />
                    </span>
                  ) : (
                    <span
                      title={
                        !user.emailVerified && !user.phoneVerified
                          ? "Your email and phone are not verified yet"
                          : !user.emailVerified
                          ? "Your email is not verified yet"
                          : "Your phone is not verified yet"
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#EF4444'
                      }}
                    >
                      <AlertCircle size={15} color="#EF4444" />
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {user.role}
                  </span>
                </div>
              </div>
            </Link>

            <button 
              onClick={handleLogout} 
              className="btn btn-secondary btn-sm"
              title="Logout"
              aria-label="Logout"
              style={{ padding: '0.4rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
