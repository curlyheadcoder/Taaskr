export const CATEGORY_EXPERTS = [
  // 1. Vehicle & Auto Care Experts
  {
    id: 'exp_veh_1',
    categoryId: 'vehicle_autocare',
    categoryName: 'Vehicle & Auto Care',
    name: 'Vikramaditya Sharma',
    title: 'Senior Automotive Diagnostics Lead',
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
    name: 'Sanjay Verma',
    title: 'Master Car Electrical & Detailing Expert',
    experienceYears: 11,
    rating: 4.8,
    reviewsCount: 245,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    specialties: ['Car Battery & Wiring', 'Ceramic Coating & Paint Repair', 'Transmission Diagnostics', 'On-Call Expert Advice'],
    bio: 'Certified German automobile electrical specialist providing precision diagnosis for luxury and passenger vehicles.'
  },

  // 2. Appliances & Electrical Experts
  {
    id: 'exp_app_1',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    name: 'Rajesh Kumar',
    title: 'Principal HVAC & Electrical Systems Engineer',
    experienceYears: 12,
    rating: 4.9,
    reviewsCount: 412,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    specialties: ['Inverter AC Compressor Repair', 'Main Distribution Board & MCB', 'Washing Machine PCB Diagnostic', 'Ro Purifier Health Check'],
    bio: 'Senior electrical engineer specializing in heavy load distribution, inverter AC PCB diagnostics, and doorstep safety audits.'
  },
  {
    id: 'exp_app_2',
    categoryId: 'appliances_electrical',
    categoryName: 'Appliances & Electrical',
    name: 'Amitabh Roy',
    title: 'Smart Home Appliance & Geyser Specialist',
    experienceYears: 9,
    rating: 4.8,
    reviewsCount: 189,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    specialties: ['Geyser Heating Element', 'Microwave Magnetron Test', 'Double Door Refrigerator Cooling', 'Inverter Battery Health'],
    bio: 'Certified appliance technician with expertise in multi-brand home electronics, power surge protection, and component repair.'
  },

  // 3. Plumbing & Cleaning Experts
  {
    id: 'exp_plumb_1',
    categoryId: 'plumbing_cleaning',
    categoryName: 'Plumbing & Cleaning',
    name: 'Rameshwar Patel',
    title: 'Master Hydraulic & Seepage Inspector',
    experienceYears: 15,
    rating: 4.9,
    reviewsCount: 510,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    specialties: ['Concealed Wall Seepage Detection', 'High-Pressure Pipeline Flushing', 'Sump Pump & Overhead Tank Audit', 'Bathroom Fitting Quotations'],
    bio: 'Thermal imaging seepage inspection consultant with 15 years experience solving complex residential and commercial moisture issues.'
  },

  // 4. Salon & Massage / Wellness Experts
  {
    id: 'exp_wellness_1',
    categoryId: 'salon_wellness',
    categoryName: 'Salon & Massage / Wellness',
    name: 'Dr. Meera Nambiar',
    title: 'Senior Aesthetic & Holistic Wellness Specialist',
    experienceYears: 11,
    rating: 4.9,
    reviewsCount: 365,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    specialties: ['Skin Type & Facial Consultation', 'Therapeutic Body Pain Assessment', 'Hair & Scalp Diagnostics', 'Personalized Grooming Packages'],
    bio: 'Dermatology-certified aesthetic consultant guiding personalized skincare treatments, stress-relief therapies, and salon regimens.'
  },

  // 5. Civil & Property Maintenance Experts
  {
    id: 'exp_civil_1',
    categoryId: 'civil_maintenance',
    categoryName: 'Civil & Property Maintenance',
    name: 'Er. Harish Joshi',
    title: 'Civil & Structural Waterproofing Engineer',
    experienceYears: 16,
    rating: 4.9,
    reviewsCount: 298,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    specialties: ['Roof Waterproofing & Dampness Audit', 'Structural Crack Inspection', 'Carpentry & Woodwork Quotation', 'Interior Painting Estimator'],
    bio: 'Chartered civil engineer offering doorstep property structural evaluations, waterproofing consultations, and architectural estimates.'
  },

  // 6. Tech & Home Automation Experts
  {
    id: 'exp_tech_1',
    categoryId: 'tech_automation',
    categoryName: 'Tech & Home Automation',
    name: 'Nikhil Gupta',
    title: 'Smart Home & Network Infrastructure Lead',
    experienceYears: 8,
    rating: 4.8,
    reviewsCount: 215,
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    specialties: ['Mesh Wi-Fi Dead Zone Audit', 'Laptop/PC Hardware Diagnostics', 'CCTV & Biometric Security Design', 'Smart Lighting & Voice Hub Setup'],
    bio: 'Cisco & CompTIA certified network engineer designing seamless smart home automation and IT hardware solutions.'
  }
];

export const getExpertsByCategory = (categoryId) => {
  if (!categoryId) return CATEGORY_EXPERTS;
  const filtered = CATEGORY_EXPERTS.filter(e => e.categoryId === categoryId || String(e.categoryId).toLowerCase().includes(String(categoryId).toLowerCase()));
  return filtered.length > 0 ? filtered : CATEGORY_EXPERTS.slice(0, 2);
};
