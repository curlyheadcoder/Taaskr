// Taaskr Service Providers & Verified Technicians Catalog with Explicit Service Tags

export const CATEGORY_EXPERTS = [
  // 1. Vehicle & Auto Care
  {
    id: 'exp_veh_1',
    categoryId: 'vehicle_autocare',
    categoryName: 'Vehicle & Auto Care',
    serviceTag: 'Car Engine & ECU Diagnostics',
    serviceProvided: 'Car Engine Diagnostics, AC Gas Leakage, ECU Tuning & Pre-Purchase Car Inspection',
    name: 'Vikramaditya Sharma',
    title: 'Senior Automotive Diagnostics Lead',
    email: 'autocare.lead@taaskr.com',
    phone: '+91 98930 11223',
    city: 'Indore (452001)',
    experienceYears: 14,
    rating: 4.9,
    reviewsCount: 328,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
    specialties: ['Car Engine & ECU', 'AC Diagnostics & Gas Leakage', 'Suspension & Brakes', 'Pre-Purchase Car Inspection'],
    bio: 'Ex-Tata Motors & Mahindra Master Technical Auditor with 14+ years in engine diagnostics, ECU tuning, and multi-brand fleet inspection.'
  },
  {
    id: 'exp_veh_2',
    categoryId: 'vehicle_autocare',
    categoryName: 'Vehicle & Auto Care',
    serviceTag: 'Car Spa & Auto Detailing Specialist',
    serviceProvided: 'Doorstep Car Foam Wash, Ceramic Coating, Battery Replacement & Interior Detailing',
    name: 'Gopal Lodhi',
    title: 'Auto Spa & Detailing Master',
    email: 'autocare@taaskr.com',
    phone: '+91 88800 00013',
    city: 'Indore (452001)',
    experienceYears: 12,
    rating: 4.9,
    reviewsCount: 340,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    specialties: ['Car Foam Wash', 'Ceramic Paint Coating', 'Battery Health & Jump Start', 'Steam Interior Detailing'],
    bio: 'Certified automobile detailing specialist delivering precision doorstep car foam washing, ceramic coating, and battery replacement.'
  },

  // 2. Appliances & Electrical
  {
    id: 'exp_app_1',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    serviceTag: 'AC & HVAC Servicing Specialist',
    serviceProvided: 'Inverter AC Jet Cleaning, Compressor Diagnostics, PCB Repair & Gas Refill',
    name: 'Vikram Singh',
    title: 'Master HVAC & AC Systems Lead',
    email: 'ac@taaskr.com',
    phone: '+91 99999 99995',
    city: 'Indore (452010)',
    experienceYears: 14,
    rating: 4.9,
    reviewsCount: 328,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    specialties: ['Inverter AC Jet Cleaning', 'Gas Leakage Brazing', 'PCB Sensor Repair', 'AC Installation & Uninstallation'],
    bio: 'Certified HVAC engineer specializing in high-pressure foam jet cleaning, nitrogen leak testing, and R32/R410a gas charging.'
  },
  {
    id: 'exp_app_2',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    serviceTag: 'RO & Water Purifier Service',
    serviceProvided: 'Reverse Osmosis Purifier Filter Replacement, Pump Repair & TDS Calibration',
    name: 'Manoj Kumar',
    title: 'RO Water Purifier Specialist',
    email: 'ro@taaskr.com',
    phone: '+91 99999 99994',
    city: 'Indore (452001)',
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 412,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    specialties: ['RO Membrane Replacement', 'Booster Pump Fix', 'TDS Calibration', 'UV Lamp & Filter Service'],
    bio: 'Master technician for multi-brand RO water purifiers (Kent, Aquaguard, Pureit) with 10+ years field experience.'
  },
  {
    id: 'exp_app_3',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    serviceTag: 'Switchboard & Wiring Repair',
    serviceProvided: 'MCB Tripping Fix, Main Distribution Board Wiring, Short Circuit Diagnostics & Earthing',
    name: 'Amit Sharma',
    title: 'Master Electrician & Wireman',
    email: 'electrician@taaskr.com',
    phone: '+91 99999 99996',
    city: 'Indore (452001)',
    experienceYears: 11,
    rating: 4.8,
    reviewsCount: 245,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    specialties: ['Switchboard Installation', 'MCB & ELCB Protection', 'Inverter Wiring', 'Heavy Appliance Cabling'],
    bio: 'Government licensed wireman providing emergency electrical repair, short circuit detection, and home power backup wiring.'
  },
  {
    id: 'exp_app_4',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    serviceTag: 'Washing Machine & Appliance Repair',
    serviceProvided: 'Washing Machine Drum & PCB Repair, Refrigerator Cooling Fix & Microwave Servicing',
    name: 'Suresh Verma',
    title: 'Appliance Repair Expert',
    email: 'appliance@taaskr.com',
    phone: '+91 99999 99998',
    city: 'Indore (452001)',
    experienceYears: 9,
    rating: 4.8,
    reviewsCount: 189,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    specialties: ['Washing Machine Drum & Motor', 'Double Door Refrigerator Gas', 'Microwave Magnetron', 'Geyser Element Repair'],
    bio: 'Comprehensive home appliance expert for front/top load washing machines, refrigerators, microwaves, and instant geysers.'
  },

  // 3. Plumbing & Cleaning
  {
    id: 'exp_plumb_1',
    categoryId: 'plumbing_cleaning',
    categoryName: 'Plumbing & Cleaning',
    serviceTag: 'Plumbing & Pipeline Leakage Repair',
    serviceProvided: 'Concealed Pipeline Seepage Detection, Tap & Mixer Valve Repair, Tank Fittings & Drain Clog Fix',
    name: 'Dinesh Gupta',
    title: 'Senior Master Plumber',
    email: 'plumber@taaskr.com',
    phone: '+91 99999 99997',
    city: 'Indore (452002)',
    experienceYears: 15,
    rating: 4.9,
    reviewsCount: 510,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    specialties: ['Concealed Leakage Fix', 'Shower & Mixer Tap Repair', 'Toilet Commode Fitting', 'Drain Spring Rodding'],
    bio: 'Thermal seepage detection specialist solving complex bathroom leaks, pressure drops, flush tank repairs, and main line drainage blockages.'
  },
  {
    id: 'exp_plumb_2',
    categoryId: 'plumbing_cleaning',
    categoryName: 'Plumbing & Cleaning',
    serviceTag: 'Home & Full House Deep Cleaning',
    serviceProvided: 'Full House Deep Cleaning, Kitchen Degreasing, Bathroom Descaling & Sofa Shampooing',
    name: 'Rajesh Patel',
    title: 'Deep Cleaning & Sanitization Lead',
    email: 'provider@taaskr.com',
    phone: '+91 99999 99993',
    city: 'Indore (452001)',
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 480,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    specialties: ['1-4 BHK Full Home Cleaning', 'Kitchen Chimney & Stove Scrub', 'Bathroom Tile Descaling', 'Sofa Wet Extraction'],
    bio: 'Lead cleaning supervisor equipped with single-disc rotary scrubbers, steam cleaners, and eco-friendly sanitized chemicals.'
  },

  // 4. Salon & Massage / Wellness
  {
    id: 'exp_wellness_1',
    categoryId: 'salon_wellness',
    categoryName: 'Salon & Massage / Wellness',
    serviceTag: 'Salon, Haircut & Beauty at Home',
    serviceProvided: 'Doorstep Hygienic Haircut, Facial, Body Waxing, Manicure/Pedicure & Bridal Makeover',
    name: 'Pooja Sharma',
    title: 'Senior Salon & Wellness Specialist',
    email: 'salon@taaskr.com',
    phone: '+91 99999 99999',
    city: 'Indore (452001)',
    experienceYears: 11,
    rating: 4.9,
    reviewsCount: 365,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    specialties: ['At-Home Haircut & Styling', 'RICA Waxing & Detan', 'Herbal & Organic Facials', 'Acupressure Stress Massage'],
    bio: 'Certified aesthetic cosmetologist delivering hygienic doorstep salon treatments, hair spas, and therapeutic oil body massages.'
  },

  // 5. Pest Control
  {
    id: 'exp_pest_1',
    categoryId: 'pest_control',
    categoryName: 'Pest Control',
    serviceTag: 'Pest & Cockroach Eradication',
    serviceProvided: 'Herbal Gel Cockroach Control, Termite Drill Barrier Treatment & Bed Bug Spray',
    name: 'Pankaj Malviya',
    title: 'Senior Pest Management Officer',
    email: 'pest@taaskr.com',
    phone: '+91 88800 00010',
    city: 'Indore (452001)',
    experienceYears: 8,
    rating: 4.8,
    reviewsCount: 290,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    specialties: ['Odorless Gel Baiting', 'Termite Wall Drilling', 'Bed Bug 2-Round Spray', 'Mosquito Cold Fogging'],
    bio: 'Government certified pest control technician providing 90-day warranty herbal gel baiting and anti-termite chemical treatments.'
  },

  // 6. Civil & Property Maintenance
  {
    id: 'exp_civil_1',
    categoryId: 'civil_maintenance',
    categoryName: 'Civil & Property Maintenance',
    serviceTag: 'Carpentry & Furniture Assembly',
    serviceProvided: 'Cabinet Hinge Repair, IKEA/Amazon Flatpack Assembly, Door Fittings & Wall Mounting',
    name: 'Kailash Sharma',
    title: 'Master Carpenter & Woodwork Lead',
    email: 'carpenter@taaskr.com',
    phone: '+91 88800 00011',
    city: 'Indore (452001)',
    experienceYears: 16,
    rating: 4.9,
    reviewsCount: 298,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
    specialties: ['Furniture Flatpack Setup', 'Door Lock & Hinge Fix', 'Wall Drilling & TV Mounting', 'Custom Cabinetry'],
    bio: 'Master carpenter with 16+ years experience in modular kitchen repairs, furniture assembly, hydraulic beds, and precision drilling.'
  },

  // 7. Tech & Home Automation
  {
    id: 'exp_tech_1',
    categoryId: 'tech_automation',
    categoryName: 'Tech & Home Automation',
    serviceTag: 'Tech, PC & Wi-Fi Network Setup',
    serviceProvided: 'Laptop RAM/SSD Upgrade, OS Installation, Wi-Fi Mesh Network Config & Smart TV Wall Mount',
    name: 'Sunil Jain',
    title: 'Hardware & Network Infrastructure Specialist',
    email: 'tech@taaskr.com',
    phone: '+91 88800 00012',
    city: 'Indore (452001)',
    experienceYears: 8,
    rating: 4.8,
    reviewsCount: 215,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    specialties: ['Laptop/PC Diagnostics', 'Mesh Wi-Fi Deadzone Audit', 'Smart TV & Soundbar Setup', 'Printer Wireless Config'],
    bio: 'Hardware & IT systems specialist for laptop repairs, OS installations, high-speed Wi-Fi router tuning, and home cinema mounting.'
  },

  // 8. Home Help & Errand Services
  {
    id: 'exp_help_1',
    categoryId: 'home_help',
    categoryName: 'Home Help & Errand Services',
    serviceTag: 'Domestic Helper & Home Chef',
    serviceProvided: 'On-Demand Domestic Maid Services, Kitchen Surface Wipe, Home Cooking & Grocery Pickup',
    name: 'Sunita Bai',
    title: 'Domestic Helper & Home Chef',
    email: 'homehelp@taaskr.com',
    phone: '+91 88800 00014',
    city: 'Indore (452001)',
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 410,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    specialties: ['Home Cooking (Veg/Non-Veg)', 'Kitchen Utensil Cleaning', 'Sweeping & Mopping', 'Local Market Purchases'],
    bio: 'Verified on-demand domestic helper and experienced home cook providing clean, hygienic meal preparation and home chores.'
  },

  // 9. Diagnostic & Healthcare Services
  {
    id: 'exp_health_1',
    categoryId: 'health_care',
    categoryName: 'Diagnostic & Healthcare Services',
    serviceTag: 'Elderly Care & Home Nursing',
    serviceProvided: 'Doorstep Nurse Assistance, Elderly Companion Care, Injection & Wound Dressing, Vital Monitoring',
    name: 'Sister Anita Joseph',
    title: 'Senior Home Healthcare Nurse',
    email: 'nurse@taaskr.com',
    phone: '+91 88800 00015',
    city: 'Indore (452001)',
    experienceYears: 18,
    rating: 5.0,
    reviewsCount: 520,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    specialties: ['Elderly Care & Vitals', 'Wound Dressing & IV Drip', 'Hospital Escort', 'Blood Sample Collection'],
    bio: 'Registered nursing officer offering compassionate elderly patient care, post-surgery home nursing, and routine health checkups.'
  },

  // 10. Security Services
  {
    id: 'exp_sec_1',
    categoryId: 'security_services',
    categoryName: 'Security Services',
    serviceTag: 'CCTV & Smart Security Setup',
    serviceProvided: 'CCTV Camera Wall Mount, DVR Network Wiring, Mobile Live Stream Config & Smart Door Locks',
    name: 'Ravi Shankar',
    title: 'CCTV & Surveillance Lead',
    email: 'security@taaskr.com',
    phone: '+91 88800 00001',
    city: 'Indore (452001)',
    experienceYears: 11,
    rating: 4.9,
    reviewsCount: 310,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    specialties: ['CCTV HD & IP Cameras', 'Biometric Lock Fitting', 'Video Door Phone', 'DVR Cloud Backup'],
    bio: 'Electronic security specialist installing high-definition CCTV security camera systems, biometric locks, and smart home alarms.'
  },
  {
    id: 'exp_sec_2',
    categoryId: 'security_services',
    categoryName: 'Security Services',
    serviceTag: 'Verified Security Guard Protection',
    serviceProvided: 'Residential Society Gate Guard, Commercial Office Security & Event Physical Guards',
    name: 'Devendra Rathore',
    title: 'Security Operations Officer',
    email: 'guard@taaskr.com',
    phone: '+91 88800 00002',
    city: 'Indore (452001)',
    experienceYears: 9,
    rating: 4.8,
    reviewsCount: 275,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    specialties: ['Residential Gate Security', 'Visitor Registry Management', 'Night Patrol Safeguard', 'Event Security Management'],
    bio: 'Ex-defense personnel managing background-verified security guards for gated communities, private villas, and commercial properties.'
  },

  // 11. Logistics & Goods Transport
  {
    id: 'exp_log_1',
    categoryId: 'logistics',
    categoryName: 'Logistics',
    serviceTag: 'Mini Truck Goods Transport Driver',
    serviceProvided: 'Intra-City House Shifting, Furniture Moving & Commercial Cargo Delivery with Mini Truck',
    name: 'Ramesh Gurjar',
    title: 'Senior Mini Truck Commercial Driver',
    email: 'driver.ramesh@taaskr.com',
    phone: '+91 88800 00003',
    city: 'Indore (452001)',
    experienceYears: 13,
    rating: 4.9,
    reviewsCount: 430,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    specialties: ['House Shifting Transport', 'Tata Ace / Bolero Cargo', 'Furniture Protection Loading', 'On-Time Doorstep Pickup'],
    bio: 'Licensed commercial logistics driver providing safe intra-city goods transportation, household luggage shifting, and cargo dispatch.'
  },
  {
    id: 'exp_log_2',
    categoryId: 'logistics',
    categoryName: 'Logistics',
    serviceTag: 'Express Parcel & Courier Delivery',
    serviceProvided: 'Same-Day Express Package Delivery, Document Dispatch & Urgent Goods Pickup',
    name: 'Ajay Rathore',
    title: 'Express Parcel & Courier Executive',
    email: 'driver.ajay@taaskr.com',
    phone: '+91 88800 00005',
    city: 'Indore (452001)',
    experienceYears: 6,
    rating: 4.9,
    reviewsCount: 380,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    specialties: ['Express 60-Min Delivery', 'Legal Document Pickup', 'Medicines & Gift Parcels', 'Live GPS Package Tracking'],
    bio: 'Priority express logistics courier ensuring instant doorstep package pickups, document deliveries, and real-time route dispatch.'
  }
];

export const getExpertsByCategory = (categoryId) => {
  if (!categoryId) return CATEGORY_EXPERTS;
  const filtered = CATEGORY_EXPERTS.filter(
    e => e.categoryId === categoryId ||
    String(e.categoryId).toLowerCase().includes(String(categoryId).toLowerCase()) ||
    String(e.categoryName).toLowerCase().includes(String(categoryId).toLowerCase())
  );
  return filtered.length > 0 ? filtered : CATEGORY_EXPERTS;
};
