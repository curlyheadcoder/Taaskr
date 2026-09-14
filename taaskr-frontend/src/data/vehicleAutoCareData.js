// Vehicle & Auto Care Umbrella Services & Variant Catalog

export const VEHICLE_AUTO_CARE_SERVICES = [
  {
    id: 'car_cleaning',
    name: 'Car Cleaning',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 150,
    description: 'Professional doorstep car wash, interior vacuuming, foam wash & full deep cleaning.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'ext_wash', name: 'Exterior Wash (Top Wash)', price: 150, duration: '30–45 min', description: 'High-pressure exterior water wash, tyre cleaning & micro-fiber wipe down.' },
      { id: 'int_wash', name: 'Only Interior Wash', price: 150, duration: '45–60 min', description: 'Complete interior vacuuming, dashboard dust removal & footmat cleaning.' },
      { id: 'int_ext_wash', name: 'Interior + Exterior Wash', price: 300, duration: '60–90 min', description: 'Complete top wash + interior vacuuming, dashboard polish & glass cleaning.' },
      { id: 'foam_wash', name: 'Foam Wash', price: 250, duration: '45–60 min', description: 'pH-neutral active snow foam wash, pressure rinse & glossy coat wipe.' },
      { id: 'int_foam_chem', name: 'Interior Foam/Chemical Cleaning', price: 350, duration: '60–90 min', description: 'Stain removal chemical foam treatment for seats, doors & upholstery.' },
      { id: 'deep_int_clean', name: 'Deep Interior Cleaning', price: 700, duration: '2–3 hrs', description: 'Deep shampoo extraction for fabric/leather seats, roof lining & boot cleaning.' },
      { id: 'full_deep_clean', name: 'Full Deep Cleaning (Interior + Exterior)', price: 999, duration: '3–4 hrs', description: 'Complete snow foam wash + deep interior shampooing & engine bay dusting.' }
    ]
  },
  {
    id: 'car_spa_detailing',
    name: 'Car Spa & Detailing',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 799,
    description: 'High-end paint correction, ceramic wax polish, leather conditioning & complete car detailing.',
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'basic_spa', name: 'Basic Car Spa', price: 799, duration: '1.5–2 hrs', description: 'Snow foam wash, dashboard conditioning, tyre shine & liquid wax coat.' },
      { id: 'int_spa', name: 'Interior Spa', price: 999, duration: '2–2.5 hrs', description: 'Steam sanitization, leather conditioning, AC vent cleaning & anti-bacterial spray.' },
      { id: 'ext_polish', name: 'Exterior Polish', price: 999, duration: '2–3 hrs', description: 'Dual-action machine polishing, swirl mark reduction & protective sealant.' },
      { id: 'full_detailing', name: 'Full Car Detailing', price: 1999, duration: '4–6 hrs', description: 'Complete 3-step paint restoration, deep interior spa & ceramic shine coat.' },
      { id: 'premium_detailing', name: 'Premium Detailing', price: 2999, duration: '5–7 hrs', description: 'Showroom finish detailing with clay bar treatment, 9H ceramic shield & interior restoration.' }
    ]
  },
  {
    id: 'car_ac_service',
    name: 'Car AC Service',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 299,
    description: 'Doorstep AC cooling check, refrigerant gas refill, filter cleaning & compressor diagnostics.',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'ac_inspect', name: 'AC Inspection', price: 299, duration: '30–45 min', description: 'Pressure test, vent temperature readout & compressor leak check.' },
      { id: 'ac_clean', name: 'AC Cleaning', price: 699, duration: '1–1.5 hrs', description: 'Cabin filter cleaning, evaporator foam spray & vent disinfectant.' },
      { id: 'ac_gas_refill', name: 'AC Gas Refill', price: 1499, duration: '1–1.5 hrs', description: 'R134a refrigerant gas topping up, oil charge & pressure check.', note: 'Gas quantity or additional part charges may apply for specific high-end vehicles.' },
      { id: 'ac_service_gas', name: 'AC Service + Gas Refill', price: 1799, duration: '1.5–2 hrs', description: 'Complete filter replacement, evaporator foam wash & 100% gas refill.', note: 'Vehicle-dependent parts extra if replacement needed.' },
      { id: 'complete_ac', name: 'Complete AC Service', price: 2499, duration: '2–3 hrs', description: 'Comprehensive AC overhaul, leak detection, condenser flush, cabin filter & gas refill.' }
    ]
  },
  {
    id: 'car_maintenance',
    name: 'Car Maintenance',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 699,
    description: 'Engine oil replacement, oil filter change, coolant flush & comprehensive general periodic maintenance.',
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'engine_oil', name: 'Engine Oil Change', price: 699, duration: '30–45 min', description: 'Drain old engine oil and top-up fresh synthetic/semi-synthetic oil.', note: 'Oil grade & capacity vary by car model; actual oil cost billed per specifications.' },
      { id: 'oil_filter_change', name: 'Engine Oil + Oil Filter Change', price: 999, duration: '45–60 min', description: 'Fresh engine oil fill + replacement of OEM oil filter & sump washer.' },
      { id: 'coolant_replace', name: 'Coolant Replacement', price: 699, duration: '45–60 min', description: 'Radiator coolant drain, system flush & fresh premixed coolant refill.' },
      { id: 'general_service', name: 'General Car Service', price: 1999, duration: '2–3 hrs', description: '40-point inspection, oil & filter replacement, air filter clean & spark plug check.' },
      { id: 'major_service', name: 'Major Car Service', price: 3499, duration: '3–5 hrs', description: 'Complete periodic overhaul: engine oil, oil filter, air filter, fuel filter & full brake check.' }
    ]
  },
  {
    id: 'brake_service',
    name: 'Brake Service',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 299,
    description: 'Brake pad inspection, rotor cleaning, hydraulic fluid replacement & stopping safety servicing.',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'brake_inspect', name: 'Brake Inspection', price: 299, duration: '30–45 min', description: 'Visual thickness check of brake pads, rotors, calipers & fluid moisture level.' },
      { id: 'brake_clean', name: 'Brake Cleaning & Servicing', price: 499, duration: '45–60 min', description: 'High-pressure brake dust removal, caliper greasing & pad sanding.' },
      { id: 'brake_pad_replace', name: 'Brake Pad Replacement', price: 1499, duration: '1–2 hrs', description: 'Front or rear OEM brake pad replacement & caliper piston bleed.' },
      { id: 'brake_fluid_replace', name: 'Brake Fluid Replacement', price: 699, duration: '45–60 min', description: 'DOT3/DOT4 brake line fluid bleeding and fresh reservoir refill.' },
      { id: 'complete_brake', name: 'Complete Brake Service', price: 1999, duration: '1.5–2.5 hrs', description: 'All-4 wheel brake servicing, pad inspection, fluid change & handbrake adjustment.' }
    ]
  },
  {
    id: 'battery_service',
    name: 'Battery Service',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 199,
    description: 'Doorstep battery health check, terminal anti-corrosion cleaning, jump start & new battery installation.',
    image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'battery_check', name: 'Battery Check', price: 199, duration: '15–30 min', description: 'Digital multimeter voltage test & cold-cranking amp (CCA) health rating.' },
      { id: 'battery_terminal', name: 'Battery Terminal Cleaning', price: 199, duration: '15–30 min', description: 'Corrosion scale removal, terminal wire brush clean & anti-oxidant gel application.' },
      { id: 'jump_start', name: 'Jump Start Assistance', price: 249, duration: '20–30 min', description: 'Urgent doorstep booster cable jump start & alternator charging check.' },
      { id: 'battery_replacement', name: 'Battery Replacement', price: 3499, isStartingFrom: true, duration: '30–45 min', description: 'Doorstep delivery & installation of new branded car battery (Exide/Amaron).', note: 'Starting from ₹3,499. Final price depends on battery AH capacity and car model.' },
      { id: 'battery_system_check', name: 'Battery & Charging System Check', price: 399, duration: '30–45 min', description: 'Complete diagnostic of battery load test, starter motor draw & alternator output.' }
    ]
  },
  {
    id: 'tyre_service',
    name: 'Tyre Service',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 99,
    description: 'Doorstep tubeless puncture fix, spare wheel fitting, tyre rotation & pressure check.',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'tyre_pressure', name: 'Tyre Pressure Check', price: 99, duration: '15–20 min', description: 'Digital PSI gauge pressure check & top-up for all 5 tyres.' },
      { id: 'puncture_repair', name: 'Puncture Repair', price: 149, duration: '20–30 min', description: 'Doorstep tubeless puncture repair with rubber strip insertion & leak test.' },
      { id: 'tyre_change', name: 'Tyre Change / Fitting', price: 199, duration: '30–45 min', description: 'Unmounting flat tyre & installing stepney/spare wheel with torque check.' },
      { id: 'tyre_rotation', name: 'Tyre Rotation', price: 399, duration: '45–60 min', description: 'Cross-rotation of all 4 wheels for even tread wear & longer tyre lifespan.' },
      { id: 'emergency_flat_tyre', name: 'Emergency Flat Tyre Assistance', price: 299, duration: '20–45 min', description: 'Rapid doorstep response for flat tyre repair or spare wheel replacement.' }
    ]
  },
  {
    id: 'car_electrical_repair',
    name: 'Car Electrical Repair',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 199,
    description: 'Headlight bulb replacement, blown fuse fix, wiper blade installation & minor electrical troubleshooting.',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'bulb_replace', name: 'Bulb Replacement', price: 199, duration: '20–30 min', description: 'Headlight, taillight, indicator, or fog light bulb replacement.' },
      { id: 'fuse_replace', name: 'Fuse Replacement', price: 199, duration: '20–30 min', description: 'Blown fuse tracing in main fuse box & fresh rated fuse fitting.' },
      { id: 'wiper_replace', name: 'Wiper Replacement', price: 299, duration: '20–30 min', description: 'Front/rear frameless rubber wiper blade replacement.' },
      { id: 'minor_elec_repair', name: 'Minor Electrical Repair', price: 399, isStartingFrom: true, duration: '30–90 min', description: 'Door lock motor, power window switch, horn, or wiring harness repair.', note: 'Starting from ₹399 depending on fault complexity and parts required.' },
      { id: 'starter_battery_check', name: 'Starter/Battery Electrical Check', price: 399, duration: '30–60 min', description: 'Cranking voltage, relay switch, starter solenoid & wiring continuity test.' }
    ]
  },
  {
    id: 'car_diagnostics',
    name: 'Car Diagnostics',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 399,
    description: 'Computerized OBD-II scanner code check, check engine light diagnosis & pre-purchase inspection.',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'bat_charg_diag', name: 'Battery & Charging Diagnosis', price: 399, duration: '30–45 min', description: 'Digital diagnostic report on battery health, alternator current & starter draw.' },
      { id: 'obd_scan', name: 'OBD Diagnostic Scan', price: 499, duration: '30–45 min', description: 'Computerized OBD-II port scanner analysis for ECU trouble codes & sensor data.' },
      { id: 'warning_light_diag', name: 'Warning Light Diagnosis', price: 599, duration: '30–60 min', description: 'Check engine light, ABS, airbag (SRS) or power steering fault code clearing & diagnosis.' },
      { id: 'complete_inspection', name: 'Complete Vehicle Inspection', price: 999, duration: '1–1.5 hrs', description: 'Comprehensive 75-point health check covering engine, brakes, suspension, electricals & fluids.' },
      { id: 'pre_purchase_inspect', name: 'Pre-Purchase Car Inspection', price: 1299, duration: '1–1.5 hrs', description: 'Thorough evaluation for used car buyers including paint meter check, accident history scan & mechanical report.' }
    ]
  },
  {
    id: 'exterior_care',
    name: 'Exterior Care',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 299,
    description: 'Headlight restoration, windshield chip repair, exterior machine polish & scratch touch-ups.',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'windshield_chip', name: 'Windshield Chip Repair', price: 299, duration: '30–60 min', description: 'Resin injection for bullseye or star windshield glass chips to prevent crack spreading.' },
      { id: 'ext_wiper_replace', name: 'Wiper Replacement', price: 299, duration: '20–30 min', description: 'Pair of premium silicon rubber wiper blades installation.' },
      { id: 'headlight_restoration', name: 'Headlight Restoration', price: 699, duration: '1–1.5 hrs', description: 'Oxidation sanding, UV clear coat sealing & yellowed lens clarity restoration.' },
      { id: 'minor_scratch_removal', name: 'Minor Exterior Scratch Removal', price: 699, duration: '1–2 hrs', description: 'Clear coat scratch buffing, compound rub & color matching touch-up.' },
      { id: 'ext_polish_care', name: 'Exterior Polish', price: 999, duration: '2–3 hrs', description: 'Machine gloss buffing with synthetic hydrophobic sealant protection.' }
    ]
  },
  {
    id: 'emergency_car_assistance',
    name: 'Emergency Car Assistance',
    categoryName: 'Vehicle & Auto Care',
    canonicalCategoryId: 'vehicle_autocare',
    startingPrice: 249,
    description: '24/7 doorstep & roadside breakdown assistance: jump start, flat tyre, battery & minor fixes.',
    image: 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80',
    options: [
      { id: 'emg_jump_start', name: 'Jump Start Assistance', price: 249, duration: '20–30 min', description: 'Urgent booster cable jump start for dead car batteries.' },
      { id: 'emg_bat_assist', name: 'Battery Assistance', price: 249, duration: '20–45 min', description: 'On-site battery voltage test, terminal fix or temporary loaner battery setup.' },
      { id: 'emg_flat_tyre', name: 'Flat Tyre Assistance', price: 299, duration: '20–45 min', description: 'Rapid technician dispatch for spare wheel fitting or puncture plug repair.' },
      { id: 'emg_minor_breakdown', name: 'Minor Breakdown Assistance', price: 499, duration: '30–60 min', description: 'On-site troubleshooting for overheating, belt slip, fuse blowout, or fuel line issue.' },
      { id: 'emg_vehicle_inspect', name: 'Emergency Vehicle Inspection', price: 599, duration: '30–60 min', description: 'Urgent comprehensive fault isolation when car fails to start or dies on road.' }
    ]
  }
];
