import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import LocationPicker from '../components/LocationPicker';
import { 
  Truck, MapPin, Package, ShieldCheck, CheckCircle2, Clock, 
  AlertCircle, ArrowRight, ChevronRight, RefreshCw, Calendar, 
  Info, Check, Sparkles, Navigation
} from 'lucide-react';

export default function ServiceDetails() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // IST Date and Time helpers
  const getISTDateTime = () => {
    const now = new Date();
    const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateStr = istDateFormatter.format(now); // "YYYY-MM-DD"

    const istTimeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const timeStr = istTimeFormatter.format(now); // "HH:mm"
    const [hStr, mStr] = timeStr.split(':');
    const hour = parseInt(hStr, 10);
    const min = parseInt(mStr, 10);

    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = istDateFormatter.format(tomorrowDate);

    return { dateStr, tomorrowStr, hour, min, currentMinutes: hour * 60 + min };
  };

  const ist = getISTDateTime();
  const todayStr = ist.dateStr;
  const tomorrowStr = ist.tomorrowStr;

  // Default to tomorrow if past operating hours today (> 20:30 IST)
  const defaultDate = ist.currentMinutes > 20 * 60 + 30 ? tomorrowStr : todayStr;
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  // Compute available time slots based on selectedDate and IST current time
  const getAvailableSlots = (date) => {
    const isToday = date === todayStr;
    const currentMins = ist.currentMinutes;

    const standardSlots = [
      { id: 'slot_morning', label: 'Morning (09:00 AM - 11:00 AM)', value: '09:00', cutoffMinutes: 10 * 60 + 30 },
      { id: 'slot_midday', label: 'Midday (11:30 AM - 01:30 PM)', value: '11:30', cutoffMinutes: 13 * 60 },
      { id: 'slot_afternoon', label: 'Afternoon (03:00 PM - 06:00 PM)', value: '15:00', cutoffMinutes: 17 * 60 + 30 },
      { id: 'slot_evening', label: 'Evening (06:30 PM - 08:30 PM)', value: '18:30', cutoffMinutes: 20 * 60 }
    ];

    if (!isToday) {
      return standardSlots;
    }

    const available = [];
    // If within operating hours today (8:00 AM to 8:30 PM IST), offer Immediate dispatch
    if (currentMins >= 8 * 60 && currentMins <= 20 * 60 + 30) {
      // Calculate immediate dispatch time ~20 mins from now rounded to next 5 min
      const dispatchMins = Math.min(currentMins + 20, 21 * 60);
      const disHour = Math.floor(dispatchMins / 60);
      const disMin = Math.ceil((dispatchMins % 60) / 5) * 5;
      const formattedImmediateTime = `${String(disHour).padStart(2, '0')}:${String(disMin === 60 ? 55 : disMin).padStart(2, '0')}`;

      available.push({
        id: 'slot_immediate',
        label: 'Now / Immediate (Fastest Dispatch ~20-30 min)',
        value: formattedImmediateTime,
        isImmediate: true
      });
    }

    // Add upcoming standard slots whose cutoff has not passed
    standardSlots.forEach(slot => {
      if (slot.cutoffMinutes > currentMins) {
        available.push(slot);
      }
    });

    return available;
  };

  const availableSlots = getAvailableSlots(selectedDate);
  const [selectedTime, setSelectedTime] = useState(availableSlots[0]?.value || '09:00');

  // Keep selectedTime synchronized if selectedDate changes or current selection becomes unavailable
  useEffect(() => {
    const slots = getAvailableSlots(selectedDate);
    if (slots.length > 0 && !slots.some(s => s.value === selectedTime)) {
      setSelectedTime(slots[0].value);
    }
  }, [selectedDate]);

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
                          catName.includes('logistics') || catName.includes('cargo') || 
                          catName.includes('courier') || catName.includes('delivery') ||
                          srvName.includes('truck') || srvName.includes('bike') || 
                          srvName.includes('rickshaw') || srvName.includes('loading') ||
                          srvName.includes('moving') || srvName.includes('material') ||
                          srvName.includes('tempo') || srvName.includes('goods');
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

    const freshIst = getISTDateTime();
    let finalStartTime = selectedTime;

    // If booking for today, make sure startTime is not in the past; if it is or was marked immediate, compute fresh dispatch time
    if (selectedDate === freshIst.dateStr) {
      const isImmediate = availableSlots.find(s => s.value === selectedTime)?.isImmediate;
      const [h, m] = (selectedTime || '00:00').split(':').map(Number);
      const selectedMins = (h || 0) * 60 + (m || 0);

      if (isImmediate || selectedMins <= freshIst.currentMinutes) {
        // Dispatch in 10-15 minutes
        const dispatchMins = Math.min(freshIst.currentMinutes + 10, 23 * 60 + 55);
        const disHour = Math.floor(dispatchMins / 60);
        const disMin = dispatchMins % 60;
        finalStartTime = `${String(disHour).padStart(2, '0')}:${String(disMin).padStart(2, '0')}`;
      }
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
          startTime: finalStartTime,
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

    navigate('/booking-flow', {
      state: {
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        bookingDate: selectedDate,
        startTime: finalStartTime
      }
    });
  };

  if (loading) {
    return (
      <div className="app-container" style={{ padding: '3rem 1rem' }}>
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          <div className="panel" style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '40%', height: '24px' }} />
            <div className="skeleton" style={{ width: '80%', height: '18px' }} />
            <div className="skeleton" style={{ width: '100%', height: '80px' }} />
          </div>
          <div className="panel" style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ width: '50%', height: '24px' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px' }} />
            <div className="skeleton" style={{ width: '100%', height: '40px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="app-container" style={{ padding: '3rem 1rem' }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlertCircle size={22} color="var(--error)" />
          </div>
          <h2 className="empty-state-title">Service Not Found</h2>
          <p className="empty-state-description">{error || 'The requested service could not be loaded.'}</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        <Link to="/" style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          Catalog
        </Link>
        <ChevronRight size={13} />
        <span>{service.category?.name || 'Services'}</span>
        <ChevronRight size={13} />
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{service.name}</span>
      </nav>

      {isVehicleCategory ? (
        /* ========================================================================= */
        /* ON-DEMAND LOGISTICS & FREIGHT TRIP BUILDER                               */
        /* ========================================================================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Header Banner */}
          <div className="panel" style={{ borderLeft: '3px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                <Truck size={14} />
                <span>On-Demand Freight & Commercial Transport</span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{service.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
                Select pickup/drop points and cargo weight to calculate live freight rates with matched fleet dispatch.
              </p>
            </div>
            {estimateResult?.distanceKm && (
              <div style={{ background: 'var(--bg-subtle)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Transit Distance</span>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', fontFeatureSettings: 'tnum' }}>
                  {estimateResult.distanceKm} KM
                </div>
              </div>
            )}
          </div>

          <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
            {/* Left Column: Route & Workload Inputs */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <MapPin size={16} color="var(--primary)" />
                  <span>Route & Workload Specifications</span>
                </h3>
              </div>

              {/* Pickup Address */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Pickup Location
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPickupMap(!showPickupMap)} 
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                  >
                    <Navigation size={12} />
                    <span>{showPickupMap ? 'Hide Map' : 'Pick on Map'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Street address, building, or landmark"
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

              {/* Drop-off Address */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Drop-off Destination
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowDropMap(!showDropMap)} 
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}
                  >
                    <Navigation size={12} />
                    <span>{showDropMap ? 'Hide Map' : 'Pick on Map'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Destination street address or business premises"
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

              {/* Workload / Cargo Weight */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    Estimated Cargo Weight (KG)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    className="form-control"
                    value={packageWeightKg}
                    onChange={(e) => setPackageWeightKg(e.target.value)}
                  />
                  <span className="form-hint">Vehicle options will automatically filter to match this payload requirement.</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    Cargo Description (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Construction materials, office furniture, boxes..."
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => fetchEstimates()}
                className="btn btn-secondary"
                style={{ width: '100%' }}
                disabled={estimating}
              >
                <RefreshCw size={14} className={estimating ? 'animate-spin' : ''} />
                <span>{estimating ? 'Recalculating Rates...' : 'Recalculate Route & Rates'}</span>
              </button>
            </div>

            {/* Right Column: Matched Vehicle Types & Booking Action */}
            <div className="panel">
              <div className="panel-header">
                <h3 className="panel-title">
                  <Truck size={16} color="var(--primary)" />
                  <span>Eligible Transport Vehicles</span>
                </h3>
              </div>

              {/* Vehicle Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
                {estimateResult?.options?.map((option) => {
                  const isSelected = selectedVehicleOption?.vehicleType === option.vehicleType;
                  const isEligible = option.isEligible;

                  return (
                    <div
                      key={option.vehicleType}
                      onClick={() => isEligible && setSelectedVehicleOption(option)}
                      style={{
                        padding: '0.875rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                        backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                        cursor: isEligible ? 'pointer' : 'not-allowed',
                        opacity: isEligible ? 1 : 0.6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Truck size={18} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{option.displayName}</strong>
                            {isSelected && <Check size={14} color="var(--primary)" />}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Max Payload: {option.maxCapacityKg} KG • ETA: ~{option.estimatedArrivalMinutes} min
                          </span>
                          {!isEligible && (
                            <div style={{ fontSize: '0.6875rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.1rem' }}>
                              <AlertCircle size={11} /> {option.eligibilityReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                          ₹{option.estimatedFare}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>Total Fare</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schedule Timing */}
              <div style={{ padding: '0.875rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} />
                  <span>Scheduled Pickup Time</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Time Window</label>
                    <select
                      className="form-control"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    >
                      {availableSlots.length === 0 ? (
                        <option value="">No slots left today</option>
                      ) : (
                        availableSlots.map(slot => (
                          <option key={slot.id} value={slot.value}>{slot.label}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceed}
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!selectedVehicleOption || !selectedVehicleOption.isEligible || availableSlots.length === 0}
              >
                <span>Book {selectedVehicleOption?.displayName || 'Vehicle'} (₹{selectedVehicleOption?.estimatedFare || service.price})</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD HOME SERVICES WORKFLOW                                           */
        /* ========================================================================= */
        <div className="grid-cols-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Scope & Deliverables */}
          <div className="panel">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <Sparkles size={14} />
              <span>Standard Service Package</span>
            </div>
            
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
              {service.name}
            </h1>

            <div style={{ display: 'flex', gap: '2rem', padding: '0.875rem 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Base Rate</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                  ₹{service.price}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Est. Duration</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFeatureSettings: 'tnum' }}>
                  {service.durationMinutes} min
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Scope of Work
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              {service.description} Includes standard tools, diagnostics, and inspection fees. Certified professional will diagnose, perform repairs, and guarantee workmanship.
            </p>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <div style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} />
                <span>Taaskr Service Guarantee</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                Up to ₹10,000 protection against accidental damages. 100% verified & approved professionals.
              </p>
            </div>
          </div>

          {/* Right Column: Appointment Schedule & Confirmation */}
          <div className="panel">
            <div className="panel-header">
              <h3 className="panel-title">
                <Calendar size={16} color="var(--primary)" />
                <span>Schedule Appointment</span>
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Select Date (IST)</label>
              <input
                type="date"
                className="form-control"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Available Time Windows</label>
              {availableSlots.length === 0 ? (
                <div style={{ padding: '0.875rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  All time windows for today are closed. Please select tomorrow or a future date to book.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.value;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedTime(slot.value)}
                        style={{
                          padding: '0.65rem 0.875rem',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid',
                          borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                          backgroundColor: isSelected ? 'var(--primary-subtle)' : 'var(--bg-card)',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: isSelected ? 600 : 400,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        <span>{slot.label}</span>
                        {isSelected && <Check size={14} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleProceed}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={availableSlots.length === 0}
            >
              <span>Continue to Checkout</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
