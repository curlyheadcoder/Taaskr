import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation, Check } from 'lucide-react';

// Fix Leaflet's default icon path issues in React
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

function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ onLocationConfirm, onLocationSelect, initialCoords }) {
  const [position, setPosition] = useState(
    initialCoords ? { lat: initialCoords.latitude || 22.7196, lng: initialCoords.longitude || 75.8577 } : { lat: 22.7196, lng: 75.8577 }
  );
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const markerRef = useRef(null);

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        if (onLocationSelect) {
          onLocationSelect({ latitude: lat, longitude: lng }, data.address || { display_name: data.display_name });
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setErrorMsg('Unable to fetch address for this coordinate location.');
    }
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
        setErrorMsg('Unable to retrieve location. Please check browser permissions.');
        setLoading(false);
      }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition({ lat, lng });
        setAddress(data[0].display_name);
        if (onLocationSelect) {
          onLocationSelect({ latitude: lat, longitude: lng }, { display_name: data[0].display_name });
        }
      } else {
        setErrorMsg('Location not found. Please try another search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMsg('Search failed. Please try again.');
    } finally {
      setLoading(false);
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
    <div className="panel" style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, color: 'var(--text-main)' }}>
          <MapPin size={15} color="var(--primary)" />
          <span>Interactive Location Pin</span>
        </h4>
        <button 
          type="button"
          onClick={handleGetCurrentLocation} 
          className="btn btn-secondary btn-sm" 
          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
          disabled={loading}
        >
          <Navigation size={12} />
          <span>Use GPS Location</span>
        </button>
      </div>
      
      {errorMsg && (
        <div style={{ padding: '0.5rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error)', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Search Input */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.35rem' }}>
        <input 
          type="text" 
          placeholder="Search street, landmark, area..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control"
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.65rem' }}
        />
        <button 
          type="submit" 
          className="btn btn-primary btn-sm"
          disabled={loading}
        >
          <Search size={14} />
        </button>
      </form>

      {/* Map Canvas */}
      <div style={{ height: '220px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)', zIndex: 0 }}>
        <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
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
          {address || 'Click map or drag the pin to resolve address'}
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
