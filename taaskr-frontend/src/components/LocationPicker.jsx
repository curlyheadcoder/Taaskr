import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Navigation } from 'lucide-react';

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

// Component to recenter map when location changes
function RecenterAutomatically({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ onLocationConfirm }) {
  const [position, setPosition] = useState({ lat: 22.7196, lng: 75.8577 }); // Default: Indore
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const markerRef = useRef(null);

  // Reverse geocode
  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setErrorMsg('Unable to fetch address for this location.');
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
      (err) => {
        setErrorMsg('Unable to retrieve your location. Please ensure location permissions are granted.');
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
      } else {
        setErrorMsg('Location not found. Try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setErrorMsg('Search failed. Please try again later.');
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

  // Click map to set pin
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
    onLocationConfirm({
      lat: position.lat,
      lng: position.lng,
      address: address
    });
  };

  return (
    <div className="location-picker premium-card" style={{ padding: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MapPin className="w-5 h-5" /> Select Service Location
      </h3>
      
      {errorMsg && (
        <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleGetCurrentLocation} 
          className="btn btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '200px' }}
          disabled={loading}
        >
          <Navigation className="w-4 h-4" /> Use My Current Location
        </button>
        
        <form onSubmit={handleSearch} style={{ display: 'flex', flex: '2', minWidth: '250px' }}>
          <input 
            type="text" 
            placeholder="Search your location (Area, City, Pincode)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '0.75rem 1rem', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}
            disabled={loading}
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div style={{ height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', zIndex: 0 }}>
        <MapContainer center={[position.lat, position.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

      <div style={{ background: 'var(--surface-50)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Selected Location</div>
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {address || 'Drag the pin or search to set address'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
        </div>
      </div>

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        onClick={handleConfirm}
        disabled={!address}
      >
        Confirm Location
      </button>
    </div>
  );
}
