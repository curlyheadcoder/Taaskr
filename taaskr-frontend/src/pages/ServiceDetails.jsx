import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { Truck, MapPin, Package, ShieldCheck, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date and Time picker states
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Vehicle Transport Specific State
  const [isVehicleCategory, setIsVehicleCategory] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCity, setPickupCity] = useState('Indore');
  const [pickupPincode, setPickupPincode] = useState('452001');
  const [pickupCoords, setPickupCoords] = useState({ latitude: 22.7196, longitude: 75.8577 });
  const [showPickupMap, setShowPickupMap] = useState(false);

  const [dropAddress, setDropAddress] = useState('');
  const [dropCity, setDropCity] = useState('Indore');
  const [dropPincode, setDropPincode] = useState('452010');
  const [dropCoords, setDropCoords] = useState({ latitude: 22.7533, longitude: 75.8937 });
  const [showDropMap, setShowDropMap] = useState(false);

  const [packageWeightKg, setPackageWeightKg] = useState('15');
  const [packageDescription, setPackageDescription] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [selectedVehicleOption, setSelectedVehicleOption] = useState(null);

  // Static/Standard slots for home services
  const timeSlots = [
    { label: 'Now / Immediate (Fastest Available)', value: '09:00' },
    { label: 'Morning (09:00 AM - 11:00 AM)', value: '09:00' },
    { label: 'Midday (11:30 AM - 01:30 PM)', value: '11:30' },
    { label: 'Afternoon (03:00 PM - 06:00 PM)', value: '15:00' },
    { label: 'Evening (06:30 PM - 08:30 PM)', value: '18:30' }
  ];

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.catalog.getServiceById(serviceId);
        setService(res);
        
        const catName = (res.category?.name || res.categoryName || '').toLowerCase();
        const srvName = (res.name || '').toLowerCase();
        const isVehicle = catName.includes('vehicle') || catName.includes('transport') || 
                          srvName.includes('truck') || srvName.includes('bike') || 
                          srvName.includes('rickshaw') || srvName.includes('loading');
        setIsVehicleCategory(isVehicle);

        if (isVehicle) {
          fetchEstimates(res);
        }
      } catch (err) {
        setError(err.message || 'Failed to load service details');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const fetchEstimates = async (currentService = service) => {
    setEstimating(true);
    try {
      const estimate = await api.vehicle.estimate({
        pickupCity,
        pickupPincode,
        pickupLatitude: pickupCoords?.latitude,
        pickupLongitude: pickupCoords?.longitude,
        dropCity,
        dropPincode,
        dropLatitude: dropCoords?.latitude,
        dropLongitude: dropCoords?.longitude,
        packageWeightKg: parseFloat(packageWeightKg) || 10,
        packageDescription
      });
      setEstimateResult(estimate);

      // Auto-select option matching current service name or first eligible option
      if (estimate?.options?.length > 0) {
        const matching = estimate.options.find(o => 
          currentService && (o.serviceId === currentService.id || o.displayName?.toLowerCase() === currentService.name?.toLowerCase())
        );
        setSelectedVehicleOption(matching || estimate.options.find(o => o.isEligible) || estimate.options[0]);
      }
    } catch (err) {
      console.error('Estimate error:', err);
    } finally {
      setEstimating(false);
    }
  };

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both a date and a time slot');
      return;
    }

    if (isVehicleCategory) {
      if (!pickupAddress || !dropAddress) {
        alert('Please provide both Pickup Address and Drop-off Address');
        return;
      }
      if (!selectedVehicleOption) {
        alert('Please select a vehicle option');
        return;
      }

      navigate('/booking-flow', {
        state: {
          serviceId: selectedVehicleOption.serviceId || service.id,
          serviceName: selectedVehicleOption.displayName || service.name,
          price: selectedVehicleOption.estimatedFare || service.price,
          bookingDate: selectedDate,
          startTime: selectedTime,
          isVehicle: true,
          pickupAddress,
          pickupCity,
          pickupPincode,
          pickupLatitude: pickupCoords?.latitude,
          pickupLongitude: pickupCoords?.longitude,
          dropAddress,
          dropCity,
          dropPincode,
          dropLatitude: dropCoords?.latitude,
          dropLongitude: dropCoords?.longitude,
          packageWeightKg: parseFloat(packageWeightKg) || 10,
          packageDescription,
          distanceKm: estimateResult?.distanceKm || 5.0,
          vehicleType: selectedVehicleOption.vehicleType
        }
      });
      return;
    }

    // Standard Home Service Flow
    navigate('/booking-flow', {
      state: {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        bookingDate: selectedDate,
        startTime: selectedTime
      }
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        <div style={{
          display: 'inline-block',
          width: '30px',
          height: '30px',
          border: '2.5px solid var(--border-glass)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '1rem' }}>Loading service details...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem' }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ color: 'var(--text-main)', marginTop: '1rem' }}>Error Loading Service</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{error || 'Service not found.'}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Back to Services</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          ← Back to Catalog
        </Link>
      </div>

      {isVehicleCategory ? (
        /* ========================================================================= */
        /* ON-DEMAND VEHICLE TRANSPORT TRIP BUILDER & ESTIMATOR                      */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Banner */}
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-assigned" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Truck className="w-4 h-4" /> On-Demand Intra-City Vehicle Service
              </span>
              <h1 style={{ fontSize: '2.2rem', color: 'var(--text-main)', margin: '0.25rem 0' }}>{service.name}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Book a verified commercial vehicle with driver to your location. Fast intra-city pickup & delivery.
              </p>
            </div>
            {estimateResult?.distanceKm && (
              <div style={{ background: 'rgba(37,99,235,0.1)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(37,99,235,0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Transit Distance</span>
                <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>{estimateResult.distanceKm} KM</p>
              </div>
            )}
          </div>

          <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
            {/* Left Column: Route & Package Specifications */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin className="w-5 h-5 text-blue-500" /> Route & Package Details
              </h3>

              {/* Pickup Location */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    📍 1. Pickup Location
                  </label>
                  <button type="button" onClick={() => setShowPickupMap(!showPickupMap)} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                    {showPickupMap ? 'Hide Map' : '🗺️ Pick on Map'}
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Pickup street address / landmark"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="City (e.g. Indore)"
                    value={pickupCity}
                    onChange={(e) => setPickupCity(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pincode"
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                  />
                </div>

                {showPickupMap && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <LocationPicker
                      initialCoords={pickupCoords}
                      onLocationSelect={(coords, addr) => {
                        setPickupCoords(coords);
                        if (addr?.city) setPickupCity(addr.city);
                        if (addr?.pincode) setPickupPincode(addr.pincode);
                        if (addr?.display_name && !pickupAddress) setPickupAddress(addr.display_name.substring(0, 100));
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Drop Location */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, color: '#F97316', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🏁 2. Drop-off Destination
                  </label>
                  <button type="button" onClick={() => setShowDropMap(!showDropMap)} className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}>
                    {showDropMap ? 'Hide Map' : '🗺️ Pick on Map'}
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Drop-off destination address"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="City (e.g. Indore)"
                    value={dropCity}
                    onChange={(e) => setDropCity(e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Pincode"
                    value={dropPincode}
                    onChange={(e) => setDropPincode(e.target.value)}
                  />
                </div>

                {showDropMap && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <LocationPicker
                      initialCoords={dropCoords}
                      onLocationSelect={(coords, addr) => {
                        setDropCoords(coords);
                        if (addr?.city) setDropCity(addr.city);
                        if (addr?.pincode) setDropPincode(addr.pincode);
                        if (addr?.display_name && !dropAddress) setDropAddress(addr.display_name.substring(0, 100));
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Package Details */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Package className="w-4 h-4 text-blue-500" /> 3. Package & Cargo Details
                </label>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approx. Weight (KG)</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    className="form-control"
                    value={packageWeightKg}
                    onChange={(e) => setPackageWeightKg(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cargo Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Office chairs, boxes, electronics, appliances"
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchEstimates()}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.85rem' }}
                disabled={estimating}
              >
                {estimating ? 'Recalculating Fares...' : '🔄 Update Fare Calculations'}
              </button>
            </div>

            {/* Right Column: Vehicle Selection & Schedule */}
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Choose Vehicle Type</span>
                {estimating && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Calculating...</span>}
              </h3>

              {/* Vehicle Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {estimateResult?.options?.map((option) => {
                  const isSelected = selectedVehicleOption?.vehicleType === option.vehicleType;
                  const isEligible = option.isEligible;

                  return (
                    <div
                      key={option.vehicleType}
                      onClick={() => isEligible && setSelectedVehicleOption(option)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                        background: isSelected ? 'rgba(37,99,235,0.08)' : isEligible ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.2)',
                        cursor: isEligible ? 'pointer' : 'not-allowed',
                        opacity: isEligible ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)'
                        }}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{option.displayName}</strong>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.15rem 0' }}>
                            Max Capacity: {option.maxCapacityKg} KG • ETA: ~{option.estimatedArrivalMinutes} min
                          </p>
                          {!isEligible && (
                            <span style={{ fontSize: '0.75rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <AlertCircle className="w-3 h-3" /> {option.eligibilityReason}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isEligible ? 'var(--primary)' : 'var(--text-muted)' }}>
                          ₹{option.estimatedFare}
                        </span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Estimated Fare</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schedule Timing */}
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock className="w-4 h-4 text-blue-500" /> When do you need the vehicle?
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Trip Date</label>
                    <input
                      type="date"
                      className="form-control"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Preferred Slot</label>
                    <select
                      className="form-control"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      {timeSlots.map(slot => (
                        <option key={slot.label} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceed}
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={!selectedVehicleOption || !selectedVehicleOption.isEligible}
              >
                <span>Book {selectedVehicleOption?.displayName || 'Vehicle'}</span>
                <span>(₹{selectedVehicleOption?.estimatedFare || service.price})</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD HOME SERVICES FLOW                                               */
        /* ========================================================================= */
        <div className="grid-cols-2" style={{ gap: '2rem', alignItems: 'flex-start' }}>
          {/* Left Side: Service Details */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <span className="badge badge-assigned" style={{ marginBottom: '1rem' }}>Active Service</span>
            <h1 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>{service.name}</h1>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Service Charge</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>₹{service.price}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Duration</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>{service.durationMinutes} min</p>
              </div>
            </div>

            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Service Description</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', marginBottom: '2rem' }}>
              {service.description} Includes standard tools and inspection fees. Our certified technician will examine the issues, provide an expert fix, and offer tips to prevent recurrence.
            </p>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-glass)' }}>
              <h4 style={{ color: 'var(--emerald)', fontSize: '0.9rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck className="w-4 h-4" /> Taaskr Guarantee Included
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                We cover damages up to ₹10,000. All professionals are fully verified and approved.
              </p>
            </div>
          </div>

          {/* Right Side: Appointment Scheduling */}
          <div className="glass-panel" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem' }}>Select Date & Time</h2>

            <div className="form-group">
              <label className="form-label">Choose Service Date</label>
              <input
                type="date"
                className="form-control"
                min={tomorrowStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Available Time Slots</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                {timeSlots.slice(1).map((slot) => {
                  const isSelected = selectedTime === slot.value;
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => setSelectedTime(slot.value)}
                      style={{
                        padding: '1rem',
                        textAlign: 'left',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                        background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{slot.label}</span>
                      {isSelected && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleProceed}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.05rem' }}
            >
              Continue to Booking Flow →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
