import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Check, Sparkles, Loader2 } from 'lucide-react';

// Fix Leaflet default marker icon in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Popular Indore Landmark Presets
const INDORE_LANDMARKS = [
  { name: 'Nipania', lat: 22.7667, lng: 75.9083, pincode: '452010' },
  { name: 'Vijay Nagar', lat: 22.7533, lng: 75.8937, pincode: '452010' },
  { name: 'Palasia', lat: 22.7244, lng: 75.8839, pincode: '452001' },
  { name: 'Railway Station', lat: 22.7177, lng: 75.8682, pincode: '452001' },
  { name: '56 Dukan', lat: 22.7230, lng: 75.8790, pincode: '452001' },
  { name: 'Rajwada', lat: 22.7186, lng: 75.8554, pincode: '452002' },
  { name: 'Bhawarkua', lat: 22.6926, lng: 75.8676, pincode: '452001' },
  { name: 'Airport (IDR)', lat: 22.7218, lng: 75.8011, pincode: '452005' },
  { name: 'Super Corridor', lat: 22.7750, lng: 75.8200, pincode: '452005' }
];

function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ onLocationConfirm, onLocationSelect, initialCoords }) {
  const [position, setPosition] = useState(
    initialCoords ? { lat: initialCoords.latitude || 22.7196, lng: initialCoords.longitude || 75.8577 } : { lat: 22.7196, lng: 75.8577 }
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        if (onLocationSelect) {
          const pincode = data.address?.postcode || (data.display_name.match(/\b\d{6}\b/) ? data.display_name.match(/\b\d{6}\b/)[0] : '452001');
          const city = data.address?.city || data.address?.town || data.address?.state_district || 'Indore';
          onLocationSelect(
            { latitude: lat, longitude: lng }, 
            { display_name: data.display_name, city, pincode, address: data.address }
          );
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setErrorMsg('Unable to fetch address details for this coordinate.');
    }
  };

  // Live Autocomplete Search for Local Spots (Biased to Indore, MP, India)
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // Query with Indore bias first
        const q = searchQuery.toLowerCase().includes('indore') ? searchQuery : `${searchQuery}, Indore`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&viewbox=75.70,22.60,76.05,22.85&bounded=0&q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          setSearchResults(data);
          setShowDropdown(true);
        } else {
          // Fallback search across India
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(searchQuery)}&limit=4`);
          const fallbackData = await fallbackRes.json();
          setSearchResults(fallbackData || []);
          setShowDropdown((fallbackData || []).length > 0);
        }
      } catch (err) {
        console.error('Map search error:', err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition({ lat, lng });
    setAddress(result.display_name);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowDropdown(false);

    const pincodeMatch = result.display_name.match(/\b\d{6}\b/);
    if (onLocationSelect) {
      onLocationSelect(
        { latitude: lat, longitude: lng },
        { display_name: result.display_name, city: 'Indore', pincode: pincodeMatch ? pincodeMatch[0] : '452001' }
      );
    }
  };

  const handleSelectLandmark = (landmark) => {
    setPosition({ lat: landmark.lat, lng: landmark.lng });
    setSearchQuery(landmark.name);
    setShowDropdown(false);
    fetchAddress(landmark.lat, landmark.lng);
  };

  const handleGetCurrentLocation = () => {
    setErrorMsg('');
    setLoading(true);
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition({ lat, lng });
        fetchAddress(lat, lng);
        setLoading(false);
      },
      () => {
        setErrorMsg('Unable to retrieve GPS location. Please check browser permissions.');
        setLoading(false);
      }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
    }
  };

  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition({ lat: newPos.lat, lng: newPos.lng });
      fetchAddress(newPos.lat, newPos.lng);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        fetchAddress(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  const handleConfirm = () => {
    if (onLocationConfirm) {
      onLocationConfirm({
        lat: position.lat,
        lng: position.lng,
        address: address
      });
    }
  };

  return (
    <div className="panel" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, color: 'var(--text-main)' }}>
          <MapPin size={15} color="var(--primary)" />
          <span>Select Spot on Map</span>
        </h4>
        <button 
          type="button"
          onClick={handleGetCurrentLocation} 
          className="btn btn-secondary btn-sm" 
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          disabled={loading}
        >
          <Navigation size={12} />
          <span>Use My GPS</span>
        </button>
      </div>

      {/* Indore Quick Landmark Chips */}
      <div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Sparkles size={11} color="var(--primary)" />
          <span>Popular Indore Spots:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {INDORE_LANDMARKS.map((lm) => (
            <button
              key={lm.name}
              type="button"
              onClick={() => handleSelectLandmark(lm)}
              style={{
                fontSize: '0.6875rem',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-light)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              📍 {lm.name}
            </button>
          ))}
        </div>
      </div>
      
      {errorMsg && (
        <div style={{ padding: '0.5rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Search Input with Live Autocomplete */}
      <div style={{ position: 'relative' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.35rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Type any Indore street, colony, or landmark (e.g. Nipania, 56 Dukan)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="form-control"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.65rem 0.45rem 2rem' }}
            />
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            {loading && (
              <Loader2 size={14} color="var(--primary)" className="animate-spin" style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            Find
          </button>
        </form>

        {/* Autocomplete Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 1000,
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            {searchResults.map((item) => (
              <div
                key={item.place_id || item.lat + item.lon}
                onClick={() => handleSelectSearchResult(item)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-subtle)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <MapPin size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.display_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div style={{ height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', zIndex: 0 }}>
        <MapContainer center={[position.lat, position.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={[position.lat, position.lng]} 
            draggable={true} 
            ref={markerRef}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          />
          <RecenterAutomatically lat={position.lat} lng={position.lng} />
          <MapEvents />
        </MapContainer>
      </div>

      <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Resolved Address:</span>
        <div style={{ color: 'var(--text-main)', marginTop: '0.15rem' }}>
          {address || 'Click any spot on map, pick a preset landmark, or type a location to resolve'}
        </div>
      </div>

      {onLocationConfirm && (
        <button 
          type="button"
          className="btn btn-primary btn-sm" 
          onClick={handleConfirm}
          disabled={!address}
        >
          <Check size={14} />
          <span>Confirm Pin Location</span>
        </button>
      )}
    </div>
  );
}
