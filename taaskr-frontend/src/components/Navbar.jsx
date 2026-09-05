import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Sun, Moon, Briefcase, ShieldCheck, Calendar, Grid, LogOut, 
  MapPin, Search, ChevronDown, Sparkles, Navigation, X, Check, ArrowRight, Command, AlertCircle
} from 'lucide-react';

const POPULAR_LOCATIONS = [
  { city: 'Indore', pincode: '452001', area: 'Vijay Nagar & Palasia' },
  { city: 'Bhopal', pincode: '462001', area: 'MP Nagar & Arera' },
  { city: 'Mumbai', pincode: '400001', area: 'South Mumbai & Andheri' },
  { city: 'Delhi', pincode: '110001', area: 'Connaught Place & South Ext' },
  { city: 'Bengaluru', pincode: '560001', area: 'Koramangala & Indiranagar' },
  { city: 'Pune', pincode: '411001', area: 'Kothrud & Hinjewadi' },
  { city: 'Hyderabad', pincode: '500001', area: 'Banjara Hills & Hitech' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Location Selector State
  const [locationOpen, setLocationOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('taaskr_location');
      return saved ? JSON.parse(saved) : { city: 'Select Location', pincode: '', area: 'All Service Zones' };
    } catch (e) {
      return { city: 'Select Location', pincode: '', area: 'All Service Zones' };
    }
  });
  const [customCity, setCustomCity] = useState('');
  const [customPincode, setCustomPincode] = useState('');
  const [locDetecting, setLocDetecting] = useState(false);
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

  // Keyboard shortcut (Ctrl+K / Cmd+K / /) to focus search
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
    setSearchResults(results.slice(0, 6));
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

  const handleApplyCustomLocation = (e) => {
    e.preventDefault();
    if (!customCity.trim()) return;
    const loc = {
      city: customCity.trim(),
      pincode: customPincode.trim() || '452001',
      area: `${customCity.trim()} Area`
    };
    handleSelectLocation(loc);
    setCustomCity('');
    setCustomPincode('');
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.state_district || addr.state || 'Indore';
          const pincode = addr.postcode || '452001';
          const area = addr.suburb || addr.neighbourhood || addr.road || `${city} Central`;
          handleSelectLocation({ city, pincode, area });
        } catch (e) {
          handleSelectLocation({ city: 'Indore', pincode: '452001', area: 'Current Location' });
        } finally {
          setLocDetecting(false);
        }
      },
      () => {
        alert('Could not detect location. Please select a city manually.');
        setLocDetecting(false);
      }
    );
  };

  const handleTriggerTaaskyWithPrompt = (promptText) => {
    setSearchOpen(false);
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('open_taasky_with_prompt', { detail: { prompt: promptText } }));
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
          to={user?.role === 'PROVIDER' ? '/provider' : '/'} 
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
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                backgroundColor: locationOpen ? 'var(--icon-container)' : 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              <MapPin size={14} color="var(--primary)" />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentLocation.pincode ? `${currentLocation.city} • ${currentLocation.pincode}` : (currentLocation.city || 'Select Location')}
              </span>
              <ChevronDown size={13} style={{ opacity: 0.7, transform: locationOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Location Dropdown Modal */}
            {locationOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                width: '300px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.85rem',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Service City
                  </span>
                  <button 
                    onClick={() => setLocationOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* GPS Auto Detect */}
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locDetecting}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                    borderRadius: '8px',
                    border: '1px dashed var(--primary)',
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <Navigation size={14} className={locDetecting ? 'animate-spin' : ''} />
                  <span>{locDetecting ? 'Detecting Location...' : 'Use Current GPS Location'}</span>
                </button>

                {/* Popular Cities List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '180px', overflowY: 'auto', marginBottom: '0.75rem' }}>
                  {POPULAR_LOCATIONS.map((loc) => {
                    const isSelected = currentLocation.city.toLowerCase() === loc.city.toLowerCase();
                    return (
                      <button
                        key={loc.city}
                        onClick={() => handleSelectLocation(loc)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.45rem 0.6rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: isSelected ? 'var(--icon-container)' : 'transparent',
                          color: isSelected ? 'var(--secondary-accent)' : 'var(--text-main)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{loc.city} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({loc.pincode})</span></div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loc.area}</div>
                        </div>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Input */}
                <form onSubmit={handleApplyCustomLocation} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.65rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <input
                      type="text"
                      placeholder="Other City"
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      style={{
                        flex: 2,
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-main)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={customPincode}
                      onChange={(e) => setCustomPincode(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.4rem 0.5rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-main)'
                      }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0.4rem 0.6rem', fontSize: '0.78rem' }}
                    >
                      Set
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Workspace Navigation Links */}
        <nav style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {isCustomerView && (
            <>
              <Link 
                to="/" 
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: location.pathname === '/' ? 600 : 500,
                  color: location.pathname === '/' ? 'var(--secondary-accent)' : 'var(--text-secondary)',
                  backgroundColor: location.pathname === '/' ? 'var(--icon-container)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  textDecoration: 'none',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Grid size={15} />
                <span>Services</span>
              </Link>
              {user && (
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
            </>
          )}

          {user && user.role === 'PROVIDER' && (
            <Link 
              to="/provider" 
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--secondary-accent)',
                backgroundColor: 'var(--icon-container)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <Briefcase size={15} />
              <span>Partner Console</span>
            </Link>
          )}

          {user && user.role === 'ADMIN' && (
            <Link 
              to="/admin" 
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none'
              }}
            >
              <ShieldCheck size={15} />
              <span>Admin Center</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Center Section: Compact Global Service Search (User / Guest Only) */}
      {isCustomerView ? (
        <div ref={searchContainerRef} style={{ position: 'relative', flex: '0 1 240px', maxWidth: '260px' }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: searchOpen ? 'var(--bg-card)' : 'var(--bg-subtle)',
            borderRadius: '8px',
            border: searchOpen ? '1px solid var(--primary)' : '1px solid var(--border-light)',
            boxShadow: searchOpen ? '0 0 0 2px var(--primary-subtle)' : 'none',
            transition: 'var(--transition-fast)'
          }}>
            <Search 
              size={13} 
              style={{ position: 'absolute', left: '0.65rem', color: searchOpen ? 'var(--primary)' : 'var(--text-muted)', pointerEvents: 'none' }} 
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search services..."
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
                padding: '0.35rem 1.75rem 0.35rem 1.9rem',
                fontSize: '0.8125rem',
                borderRadius: '8px',
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
                  right: '0.45rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              padding: '0.65rem',
              zIndex: 100,
              maxHeight: '380px',
              overflowY: 'auto',
              animation: 'fadeIn 0.15s ease'
            }}>
              {searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Available Services ({searchResults.length})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Press ↵ to select</span>
                  </div>
                  {searchResults.map((srv) => {
                    const cat = categories.find(c => c.id === srv.categoryId);
                    return (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setSearchOpen(false);
                          navigate(`/services/${srv.id}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid transparent',
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-main)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{srv.name}</span>
                            {cat && (
                              <span style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: 'var(--icon-container)',
                                color: 'var(--secondary-accent)',
                                fontWeight: 600
                              }}>
                                {cat.name}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {srv.description}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                            ₹{srv.basePrice || srv.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                    No exact services found matching "{searchQuery}"
                  </p>
                </div>
              )}

              {/* Smart Taasky Recommendation Trigger */}
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleTriggerTaaskyWithPrompt(searchQuery)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--primary)',
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} />
                    <span>Ask Taasky AI: "{searchQuery}"</span>
                  </div>
                  <ArrowRight size={14} />
                </button>
              </div>
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
