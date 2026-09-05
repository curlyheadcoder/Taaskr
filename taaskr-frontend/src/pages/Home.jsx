import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Sparkles, Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2, Scissors,
  Radio, Award, AlertTriangle, CheckCircle2, ChevronRight, Phone, MessageSquare, 
  FileText, Plus, Bell, RefreshCw, Send, Check, X, ArrowUpRight, HelpCircle, Briefcase, Clock,
  Bug, Laptop, Car, HeartPulse, Wrench
} from 'lucide-react';

const CANONICAL_CATEGORIES = [
  { 
    id: 'appliances_electrical', 
    name: 'Appliances & Electrical',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('appliance') || c.includes('electric') || 
             s.includes('ac ') || s.includes('air condition') || s.includes('ro ') || s.includes('purifier') || 
             s.includes('switch') || s.includes('wire') || s.includes('fan') || s.includes('refrigerator') || 
             s.includes('washing') || s.includes('microwave') || s.includes('otg') || s.includes('inverter') || 
             s.includes('geyser') || s.includes('water heater');
    }
  },
  { 
    id: 'plumbing_cleaning', 
    name: 'Plumbing & Cleaning',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return (c.includes('plumb') || c.includes('clean')) && !c.includes('pest') || 
             s.includes('tap') || s.includes('faucet') || s.includes('pipe') || s.includes('drain') || 
             s.includes('leak') || s.includes('bathroom') || s.includes('housekeep') || s.includes('sofa') || 
             s.includes('carpet') || s.includes('kitchen deep') || s.includes('chimney') || s.includes('toilet');
    }
  },
  { 
    id: 'pest_control', 
    name: 'Pest Control',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('pest') || 
             s.includes('pest') || s.includes('cockroach') || s.includes('termite') || 
             s.includes('bed bug') || s.includes('mosquito') || s.includes('ant control') || s.includes('borer');
    }
  },
  { 
    id: 'salon_wellness', 
    name: 'Salon & Massage / Wellness',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('salon') || c.includes('massage') || c.includes('wellness') || c.includes('beauty') || 
             s.includes('haircut') || s.includes('beard') || s.includes('shave') || s.includes('spa') || 
             s.includes('grooming') || s.includes('facial') || s.includes('manicure') || s.includes('pedicure') || 
             s.includes('waxing') || s.includes('makeup') || s.includes('bridal') || s.includes('therapy');
    }
  },
  { 
    id: 'civil_maintenance', 
    name: 'Civil & Property Maintenance',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('civil') || c.includes('property') || 
             s.includes('carpenter') || s.includes('carpentry') || s.includes('woodwork') || s.includes('furniture assembly') || 
             s.includes('drilling') || s.includes('hanging') || s.includes('painting') || s.includes('mason') || 
             s.includes('wall') || s.includes('waterproof') || s.includes('tiling') || s.includes('flooring') || 
             s.includes('roof') || s.includes('renovat');
    }
  },
  { 
    id: 'tech_automation', 
    name: 'Tech & Home Automation',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('tech') || c.includes('automation') || 
             s.includes('laptop') || s.includes('pc ') || s.includes('computer') || s.includes('wi-fi') || 
             s.includes('router') || s.includes('mesh') || s.includes('smart tv') || s.includes('printer');
    }
  },
  { 
    id: 'vehicle_autocare', 
    name: 'Vehicle & Auto Care',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('auto') || (c.includes('vehicle') && !c.includes('on-demand vehicle')) || 
             s.includes('car foam') || s.includes('bike foam') || s.includes('detailing') || 
             s.includes('car wash') || s.includes('bike wash') || s.includes('jump start') || s.includes('battery jump');
    }
  },
  { 
    id: 'home_help', 
    name: 'Home Help & Errand Services',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('home help') || c.includes('errand') || 
             s.includes('maid') || s.includes('domestic helper') || s.includes('cook') || s.includes('chef') || 
             s.includes('laundry') || s.includes('steam ironing') || s.includes('medicine') || s.includes('grocery') || 
             s.includes('queue') || s.includes('errand assistance');
    }
  },
  { 
    id: 'security_services', 
    name: 'Security Services',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('security') || 
             s.includes('cctv') || s.includes('lock') || s.includes('guard') || s.includes('doorbell') || 
             s.includes('camera') || s.includes('surveillance');
    }
  },
  { 
    id: 'diagnostic_healthcare', 
    name: 'Diagnostic & Healthcare Services',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('diagnostic') || c.includes('health') || 
             s.includes('blood') || s.includes('doctor') || s.includes('nurse') || s.includes('compounder') || 
             s.includes('sample') || s.includes('checkup') || s.includes('lab') || s.includes('patholog') || 
             s.includes('elderly assistance') || s.includes('hospital escort');
    }
  },
  { 
    id: 'logistics', 
    name: 'Logistics',
    matcher: (cName, sName) => {
      const c = (cName || '').toLowerCase();
      const s = (sName || '').toLowerCase();
      return c.includes('logistics') || c.includes('on-demand vehicle') || 
             s.includes('truck') || s.includes('tempo') || s.includes('courier') || s.includes('cargo') || 
             s.includes('transport') || s.includes('moving') || s.includes('shifting') || s.includes('furniture moving') || 
             s.includes('electric bike') || s.includes('petrol bike') || s.includes('rickshaw');
    }
  }
];

const mapServiceToCanonical = (service, rawCategories = []) => {
  const rawCat = (rawCategories || []).find(c => c && c.id === service.categoryId);
  const catName = rawCat?.name || service.categoryName || '';
  const serviceName = service.name || '';
  
  for (const canon of CANONICAL_CATEGORIES) {
    if (canon.matcher(catName, serviceName)) {
      return {
        ...service,
        canonicalCategoryId: canon.id,
        canonicalCategoryName: canon.name
      };
    }
  }

  return {
    ...service,
    canonicalCategoryId: 'appliances_electrical',
    canonicalCategoryName: 'Appliances & Electrical'
  };
};

const DEFAULT_SERVICES = [
  // Appliances & Electrical
  { id: 1, name: 'AC Repair & Service', description: 'Comprehensive diagnostics, coil cleaning, and cooling optimization.', price: 699, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 2, name: 'RO Water Purifier Service', description: 'Filter replacement, membrane inspection, and complete purification check.', price: 499, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 3, name: 'Switchboard & Wiring Repair', description: 'Quick inspection and repair of loose wiring, burnt sockets, and tripped breakers.', price: 349, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 4, name: 'Ceiling & Exhaust Fan Repair', description: 'Bearing replacement, speed regulator setup, and quiet motor tuning.', price: 299, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 5, name: 'Geyser & Water Heater Servicing', description: 'Element descaling, thermostat inspection, and leak repairs for storage/instant geysers.', price: 449, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 6, name: 'Inverter & Battery Servicing', description: 'Battery distilled water top-up, terminal desulfation, and inverter load testing.', price: 349, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 7, name: 'Microwave & OTG Repair', description: 'Magnetron check, high-voltage fuse change, and rotating plate motor repair.', price: 399, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 8, name: 'Refrigerator Repair', description: 'Compressor troubleshooting, gas charge, and cooling thermostat repair.', price: 599, pricingType: 'FIXED', categoryId: 1, active: true },
  { id: 9, name: 'Washing Machine Repair', description: 'Drum balance, drain pump, motor belt, and PCB diagnostic.', price: 599, pricingType: 'FIXED', categoryId: 1, active: true },

  // Plumbing & Cleaning
  { id: 10, name: 'Tap Leakage & Valve Repair', description: 'Fix dripping faucets, replace internal washers, and ensure seamless water pressure.', price: 299, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 11, name: 'Pipe Leakage Fix', description: 'Detect and repair concealed or open pipe leakages.', price: 499, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 12, name: 'Drain Blockage & Clog Clearance', description: 'Mechanical spring clearing for clogged kitchen sinks, washbasins, and bathroom drain traps.', price: 399, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 13, name: 'Kitchen Deep Cleaning & Chimney Degreasing', description: 'Thorough degreasing of chimney filters, gas stove scrub, and kitchen oil stain removal.', price: 799, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 14, name: 'Sofa & Carpet Shampooing', description: 'High-suction wet extraction shampooing for fabric sofas, cushions, and floor carpets.', price: 699, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 15, name: 'Deep Home & Bathroom Cleaning', description: 'Intensive stain removal, floor sanitization, and eco-friendly disinfection.', price: 1499, pricingType: 'FIXED', categoryId: 3, active: true },

  // Pest Control
  { id: 16, name: 'General Pest & Cockroach Control', description: 'Odorless herbal gel baiting and spray targeting cockroaches, ants, and silverfish with 90-day warranty.', price: 899, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 17, name: 'Termite & Wood Borer Treatment', description: 'Chemical barrier drill-and-fill treatment protecting wooden structures against subterranean termites.', price: 1899, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 18, name: 'Bed Bug Eradication Treatment', description: 'Two-round high-potency chemical spray treatment targeting mattress seams and sofa crevices.', price: 1199, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 19, name: 'Mosquito & Flying Insect Control', description: 'Cold-fogging and residual wall misting to eliminate adult mosquitoes and larvae.', price: 799, pricingType: 'FIXED', categoryId: 16, active: true },

  // Salon & Massage / Wellness (Unisex)
  { id: 20, name: "Men's Haircut & Beard Styling", description: 'Doorstep hygienic haircut, beard trimming, styling, and disposable kit protocol.', price: 349, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 21, name: "Women's Haircut & Hair Spa", description: 'Professional precision haircut, deep conditioning hair spa, and blowout styling at home.', price: 699, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 22, name: 'At-Home Manicure & Pedicure', description: 'Relaxing cuticle care, scrub, foot massage, and polish using sterile tools.', price: 599, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 23, name: 'Full Arms & Legs Waxing', description: 'Hygienic RICA / honey waxing with post-wax soothing lotion application.', price: 499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 24, name: 'Bridal & Party Makeup at Home', description: 'HD glam and party makeover by certified makeup artists using premium cosmetics.', price: 1499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 25, name: 'At-Home Facial & Skin Glow', description: 'Deep pore cleansing, tan removal scrub, steam, and herbal face pack for all skin types.', price: 799, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 26, name: 'Head, Neck & Shoulder Massage', description: 'Stress-relief acupressure therapy using soothing warm herbal oils.', price: 499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 27, name: 'Full Body Stress Relief Therapy', description: 'Rejuvenating full body Swedish / Ayurvedic oil massage by certified wellness therapists.', price: 1299, pricingType: 'FIXED', categoryId: 6, active: true },

  // Civil & Property Maintenance
  { id: 28, name: 'Carpentry & Furniture Repair', description: 'Fixing misaligned cabinet hinges, drawer channels, hydraulic bed lifts, and wooden doors.', price: 399, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 29, name: 'Furniture Assembly & Flatpack Setup', description: 'Assembly of flatpack wardrobes, beds, TV units, and study desks from IKEA/Amazon/Pepperfry.', price: 499, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 30, name: 'Drilling, Hanging & Wall Mounting', description: 'Precision hammer-drilling for wall art, mirrors, curtain rods, and bathroom towel racks.', price: 249, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 31, name: 'Interior Wall Painting & Touch-up', description: 'Putty filling, primer, and premium acrylic emulsion roller painting for rooms or accent walls.', price: 1499, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 32, name: 'General Civil & Wall Repair', description: 'Minor masonry, plaster patching, and tile touch-ups by verified masons.', price: 799, pricingType: 'FIXED', categoryId: 2, active: true },

  // Tech & Home Automation
  { id: 33, name: 'Laptop & PC Diagnostics / OS Setup', description: 'RAM/SSD upgrades, OS installation, virus cleanup, and thermal paste replacement.', price: 499, pricingType: 'FIXED', categoryId: 33, active: true },
  { id: 34, name: 'Wi-Fi Router & Mesh Network Setup', description: 'High-speed fiber router installation, dead zone mesh repeater config, and security tuning.', price: 399, pricingType: 'FIXED', categoryId: 33, active: true },
  { id: 35, name: 'Smart TV & Home Theater Wall Setup', description: 'Wall bracket mounting for 32-75 inch Smart TVs, soundbar setup, and cable concealment.', price: 599, pricingType: 'FIXED', categoryId: 33, active: true },
  { id: 36, name: 'Printer Setup & Troubleshooting', description: 'Driver installation, wireless network printing setup, and paper feed troubleshooting.', price: 349, pricingType: 'FIXED', categoryId: 33, active: true },

  // Vehicle & Auto Care
  { id: 37, name: 'Doorstep Eco Car Foam Wash & Vacuum', description: 'Pressure foam wash, tire shine, and interior carpet/seat high-suction vacuuming at your parking spot.', price: 499, pricingType: 'FIXED', categoryId: 37, active: true },
  { id: 38, name: 'Doorstep Bike Foam Wash & Chain Lube', description: 'Two-wheeler pressure foam wash, degreasing, and synthetic chain lubrication.', price: 249, pricingType: 'FIXED', categoryId: 37, active: true },
  { id: 39, name: 'Deep Car Interior Detailing & Polishing', description: 'Fabric shampooing, leather conditioning, dashboard polish, and AC vent steam sanitization.', price: 1199, pricingType: 'FIXED', categoryId: 37, active: true },
  { id: 40, name: 'Car Battery Jump Start Assistance', description: '15-minute emergency roadside/home jumper cable restart and battery alternator check.', price: 349, pricingType: 'FIXED', categoryId: 37, active: true },

  // Home Help & Errand Services
  { id: 41, name: 'Daily Domestic Helper / Maid on Demand', description: 'Verified on-demand helper for sweeping, mopping, utensil cleaning, and kitchen surface wipe-down.', price: 399, pricingType: 'FIXED', categoryId: 41, active: true },
  { id: 42, name: 'Home Chef & Daily Cook on Demand', description: 'Freshly prepared home-style vegetarian / non-vegetarian meals cooked at your kitchen.', price: 499, pricingType: 'FIXED', categoryId: 41, active: true },
  { id: 43, name: 'Doorstep Laundry & Steam Ironing', description: 'Clothes wash, gentle fabric dry, and crisp wrinkle-free steam press pickup & drop.', price: 299, pricingType: 'FIXED', categoryId: 41, active: true },
  { id: 44, name: 'Urgent Medicine & Prescription Delivery', description: 'Fast doorstep pickup of emergency medications from authorized local pharmacies.', price: 149, pricingType: 'FIXED', categoryId: 41, active: true },
  { id: 45, name: 'Local Grocery & Market Pickup Delivery', description: 'Handpicked vegetables, fruits, and groceries purchased and delivered from nearby markets.', price: 199, pricingType: 'FIXED', categoryId: 41, active: true },
  { id: 46, name: 'Personal Errand & Queue Assistance', description: 'On-demand assistant for document submission, standing in billing queues, and municipal errands.', price: 249, pricingType: 'FIXED', categoryId: 41, active: true },

  // Security Services
  { id: 47, name: 'CCTV Installation & Setup', description: 'HD camera mounting, DVR configuration, and mobile live-view setup.', price: 1199, pricingType: 'FIXED', categoryId: 7, active: true },
  { id: 48, name: 'Smart Lock Installation', description: 'Install and set up a biometric fingerprint and digital keypad smart lock.', price: 799, pricingType: 'FIXED', categoryId: 7, active: true },
  { id: 49, name: 'Security Guard Service', description: 'Professional, verified security guard shift for residential societies and commercial premises.', price: 1499, pricingType: 'FIXED', categoryId: 7, active: true },

  // Diagnostic & Healthcare Services
  { id: 50, name: 'Blood Test & Sample Collection', description: 'Hygienic at-home phlebotomy with certified NABL accredited lab processing.', price: 499, pricingType: 'FIXED', categoryId: 4, active: true },
  { id: 51, name: 'Full Body Health Checkup', description: 'Comprehensive full body preventive health screening covering 60+ vital parameters.', price: 1999, pricingType: 'FIXED', categoryId: 4, active: true },
  { id: 52, name: 'Compounder on Call', description: 'Healthcare assistance for basic patient care, IV infusion, dressing, and prescribed medication support.', price: 599, pricingType: 'FIXED', categoryId: 4, active: true },
  { id: 53, name: 'Elderly Assistance & Hospital Escort', description: 'Companion escort for senior citizens to doctor appointments, mobility aid, and clinic visits.', price: 799, pricingType: 'FIXED', categoryId: 4, active: true },

  // Logistics
  { id: 54, name: 'Mini Truck Goods Transport', description: 'Reliable intra-city tempo transport for furniture, equipment, and shifting.', price: 250, pricingType: 'PER_KM', categoryId: 5, active: true },
  { id: 55, name: 'Electric Bike Express Courier', description: 'Fast eco-friendly two-wheeler for small parcels and urgent documents.', price: 40, pricingType: 'PER_KM', categoryId: 5, active: true },
  { id: 56, name: 'Heavy Truck Commercial Freight', description: 'Heavy-duty commercial vehicle for heavy machinery and bulk items.', price: 1200, pricingType: 'PER_KM', categoryId: 5, active: true }
].map(s => mapServiceToCanonical(s));

export default function Home() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [categories, setCategories] = useState(() => {
    return CANONICAL_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      active: true
    }));
  });
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [selectedCategory, setSelectedCategory] = useState('appliances_electrical');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('taaskr_location');
      return saved ? JSON.parse(saved) : { city: 'Indore', pincode: '452001' };
    } catch (e) {
      return { city: 'Indore', pincode: '452001' };
    }
  });

  // Partner Operations State
  const [isOnline, setIsOnline] = useState(true);
  const [showSkillRequestModal, setShowSkillRequestModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [requestedCategory, setRequestedCategory] = useState('');
  const [requestedSkillExp, setRequestedSkillExp] = useState('3');
  const [requestedSkillNotes, setRequestedSkillNotes] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [escalationType, setEscalationType] = useState('PARTS_REIMBURSEMENT');
  const [escalationAmount, setEscalationAmount] = useState('');
  const [escalationBookingId, setEscalationBookingId] = useState('');
  const [escalationNotes, setEscalationNotes] = useState('');
  const [escalationSubmitted, setEscalationSubmitted] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      try {
        const saved = localStorage.getItem('user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleLocChange = (e) => {
      if (e.detail) setCurrentLocation(e.detail);
    };
    window.addEventListener('taaskr_location_change', handleLocChange);
    return () => window.removeEventListener('taaskr_location_change', handleLocChange);
  }, []);

  // Pagination state for services catalog grid
  const [servicesPage, setServicesPage] = useState(1);
  const servicesPerPage = 8;

  // Reset page when filtering or searching
  useEffect(() => {
    setServicesPage(1);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const [cats, servs] = await Promise.all([
          api.catalog.getCategories(),
          api.catalog.getServices()
        ]);
        
        const rawCats = Array.isArray(cats) ? cats.filter(c => c && c.active !== false) : [];
        const rawServs = Array.isArray(servs) ? servs.filter(s => s && s.active !== false) : [];

        if (rawServs.length > 0) {
          const mappedServices = rawServs.map(s => mapServiceToCanonical(s, rawCats));
          
          // Merge with DEFAULT_SERVICES so newly configured catalog items display even before the remote DB is restarted/reseeded
          const backendNameSet = new Set(mappedServices.map(s => (s.name || '').toLowerCase().trim()));
          const missingDefaults = DEFAULT_SERVICES.filter(d => !backendNameSet.has((d.name || '').toLowerCase().trim()));
          const fullCatalog = [...mappedServices, ...missingDefaults];

          setServices(fullCatalog);

          const mergedCats = CANONICAL_CATEGORIES.map(canon => {
            const count = fullCatalog.filter(s => s.canonicalCategoryId === canon.id).length;
            return {
              id: canon.id,
              name: canon.name,
              count,
              active: true
            };
          });
          setCategories(mergedCats);
        } else {
          setServices(DEFAULT_SERVICES);
          const mergedCats = CANONICAL_CATEGORIES.map(canon => {
            const count = DEFAULT_SERVICES.filter(s => s.canonicalCategoryId === canon.id).length;
            return {
              id: canon.id,
              name: canon.name,
              count,
              active: true
            };
          });
          setCategories(mergedCats);
        }
      } catch (err) {
        console.warn('Backend catalog sync notice:', err);
        setServices(DEFAULT_SERVICES);
        const mergedCats = CANONICAL_CATEGORIES.map(canon => {
          const count = DEFAULT_SERVICES.filter(s => s.canonicalCategoryId === canon.id).length;
          return {
            id: canon.id,
            name: canon.name,
            count,
            active: true
          };
        });
        setCategories(mergedCats);
      } finally {
        setLoading(false);
      }
    };
    loadCatalog();
  }, []);

  // Comprehensive multi-token search matcher across service name, description, category name, and keywords
  const doesServiceMatch = (service, query) => {
    if (!service) return false;
    if (!query || !query.trim()) return true;
    const qTokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const catName = (service.canonicalCategoryName || '').toLowerCase();
    const sName = (service.name || '').toLowerCase();
    const sDesc = (service.description || '').toLowerCase();
    const fullText = `${sName} ${catName} ${sDesc}`;

    return qTokens.every(token => fullText.includes(token));
  };

  // Dropdown searches globally across all services
  const searchDropdownResults = searchQuery.trim() === ''
    ? []
    : (services || []).filter(service => doesServiceMatch(service, searchQuery));

  const filteredServices = (services || []).filter(service => {
    if (!service) return false;
    const matchesCategory = selectedCategory 
      ? (service.canonicalCategoryId === selectedCategory || service.categoryId === selectedCategory) 
      : true;
    const matchesSearch = searchQuery.trim() === '' || doesServiceMatch(service, searchQuery);
    return matchesCategory && matchesSearch;
  });

  const getCategoryTheme = (categoryIdentifier) => {
    const key = (categoryIdentifier || '').toLowerCase();
    
    // 1. Appliances & Electrical
    if (key.includes('appliances_electrical') || key.includes('electric') || key.includes('appliance') || key.includes('wire') || key.includes('switch') || key.includes('power') || key.includes('fan') || key.includes('ac ') || key.includes('geyser') || key.includes('inverter') || key.includes('microwave') || key.includes('purifier')) {
      return {
        icon: <Zap size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
        primary: '#F59E0B',
        secondary: '#EF4444',
        tertiary: '#FBBF24',
        accentBg: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 50%, #EF4444 100%)',
        shadow1: 'rgba(245, 158, 11, 0.42)',
        shadow2: 'rgba(239, 68, 68, 0.32)',
        shadow3: 'rgba(251, 191, 36, 0.28)',
        glow: 'rgba(245, 158, 11, 0.55)',
        badgeBg: 'rgba(245, 158, 11, 0.2)',
        badgeColor: '#FDE047'
      };
    }

    // 2. Plumbing & Cleaning
    if ((key.includes('plumbing_cleaning') || key.includes('plumb') || key.includes('clean') || key.includes('water') || key.includes('pipe') || key.includes('drain') || key.includes('wash') || key.includes('tap') || key.includes('carpet') || key.includes('sofa') || key.includes('chimney')) && !key.includes('pest') && !key.includes('car') && !key.includes('bike')) {
      return {
        icon: <Droplets size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        primary: '#06B6D4',
        secondary: '#10B981',
        tertiary: '#2563EB',
        accentBg: 'linear-gradient(135deg, #06B6D4 0%, #059669 50%, #2563EB 100%)',
        shadow1: 'rgba(6, 182, 212, 0.42)',
        shadow2: 'rgba(16, 185, 129, 0.32)',
        shadow3: 'rgba(37, 99, 235, 0.28)',
        glow: 'rgba(6, 182, 212, 0.55)',
        badgeBg: 'rgba(6, 182, 212, 0.2)',
        badgeColor: '#67E8F9'
      };
    }

    // 3. Pest Control
    if (key.includes('pest') || key.includes('cockroach') || key.includes('termite') || key.includes('bed bug') || key.includes('mosquito')) {
      return {
        icon: <Bug size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=400&q=80',
        primary: '#10B981',
        secondary: '#84CC16',
        tertiary: '#059669',
        accentBg: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #84CC16 100%)',
        shadow1: 'rgba(16, 185, 129, 0.42)',
        shadow2: 'rgba(132, 204, 22, 0.32)',
        shadow3: 'rgba(5, 150, 105, 0.28)',
        glow: 'rgba(16, 185, 129, 0.55)',
        badgeBg: 'rgba(16, 185, 129, 0.2)',
        badgeColor: '#A7F3D0'
      };
    }

    // 4. Salon & Massage / Wellness (Unisex)
    if (key.includes('salon_wellness') || key.includes('salon') || key.includes('massage') || key.includes('wellness') || key.includes('beauty') || key.includes('hair') || key.includes('spa') || key.includes('facial') || key.includes('makeup') || key.includes('waxing') || key.includes('grooming')) {
      return {
        icon: <Sparkles size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
        primary: '#EC4899',
        secondary: '#A855F7',
        tertiary: '#F43F5E',
        accentBg: 'linear-gradient(135deg, #EC4899 0%, #A855F7 50%, #F43F5E 100%)',
        shadow1: 'rgba(236, 72, 153, 0.42)',
        shadow2: 'rgba(168, 85, 247, 0.32)',
        shadow3: 'rgba(244, 63, 94, 0.28)',
        glow: 'rgba(236, 72, 153, 0.55)',
        badgeBg: 'rgba(236, 72, 153, 0.2)',
        badgeColor: '#FBCFE8'
      };
    }

    // 5. Civil & Property Maintenance
    if (key.includes('civil_maintenance') || key.includes('civil') || key.includes('property') || key.includes('carpenter') || key.includes('wood') || key.includes('drilling') || key.includes('mason') || key.includes('roof') || key.includes('floor') || key.includes('paint')) {
      return {
        icon: <Hammer size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
        primary: '#EA580C',
        secondary: '#F59E0B',
        tertiary: '#E11D48',
        accentBg: 'linear-gradient(135deg, #EA580C 0%, #C2410C 50%, #F59E0B 100%)',
        shadow1: 'rgba(234, 88, 12, 0.42)',
        shadow2: 'rgba(245, 158, 11, 0.32)',
        shadow3: 'rgba(225, 29, 72, 0.28)',
        glow: 'rgba(234, 88, 12, 0.55)',
        badgeBg: 'rgba(234, 88, 12, 0.2)',
        badgeColor: '#FDBA74'
      };
    }

    // 6. Tech & Home Automation
    if (key.includes('tech') || key.includes('automation') || key.includes('laptop') || key.includes('computer') || key.includes('router') || key.includes('wifi') || key.includes('printer')) {
      return {
        icon: <Laptop size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
        primary: '#6366F1',
        secondary: '#38BDF8',
        tertiary: '#8B5CF6',
        accentBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #38BDF8 100%)',
        shadow1: 'rgba(99, 102, 241, 0.42)',
        shadow2: 'rgba(56, 189, 248, 0.32)',
        shadow3: 'rgba(139, 92, 246, 0.28)',
        glow: 'rgba(99, 102, 241, 0.55)',
        badgeBg: 'rgba(99, 102, 241, 0.2)',
        badgeColor: '#C7D2FE'
      };
    }

    // 7. Vehicle & Auto Care
    if (key.includes('vehicle_autocare') || key.includes('auto') || key.includes('car') || key.includes('bike wash') || key.includes('detailing') || key.includes('jump start')) {
      return {
        icon: <Car size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80',
        primary: '#0284C7',
        secondary: '#38BDF8',
        tertiary: '#2563EB',
        accentBg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #38BDF8 100%)',
        shadow1: 'rgba(2, 132, 199, 0.42)',
        shadow2: 'rgba(56, 189, 248, 0.32)',
        shadow3: 'rgba(37, 99, 235, 0.28)',
        glow: 'rgba(2, 132, 199, 0.55)',
        badgeBg: 'rgba(2, 132, 199, 0.2)',
        badgeColor: '#BAE6FD'
      };
    }

    // 8. Home Help & Errand Services
    if (key.includes('home_help') || key.includes('help') || key.includes('errand') || key.includes('maid') || key.includes('cook') || key.includes('chef') || key.includes('laundry') || key.includes('grocery') || key.includes('medicine')) {
      return {
        icon: <HeartPulse size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
        primary: '#14B8A6',
        secondary: '#F43F5E',
        tertiary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #F43F5E 100%)',
        shadow1: 'rgba(20, 184, 166, 0.42)',
        shadow2: 'rgba(244, 63, 94, 0.32)',
        shadow3: 'rgba(6, 182, 212, 0.28)',
        glow: 'rgba(20, 184, 166, 0.55)',
        badgeBg: 'rgba(20, 184, 166, 0.2)',
        badgeColor: '#99F6E4'
      };
    }

    // 9. Security Services
    if (key.includes('security') || key.includes('guard') || key.includes('cctv') || key.includes('lock')) {
      return {
        icon: <ShieldCheck size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
        primary: '#8B5CF6',
        secondary: '#EC4899',
        tertiary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 50%, #EC4899 100%)',
        shadow1: 'rgba(139, 92, 246, 0.42)',
        shadow2: 'rgba(236, 72, 153, 0.32)',
        shadow3: 'rgba(99, 102, 241, 0.28)',
        glow: 'rgba(139, 92, 246, 0.55)',
        badgeBg: 'rgba(139, 92, 246, 0.2)',
        badgeColor: '#C4B5FD'
      };
    }

    // 10. Diagnostic & Healthcare Services
    if (key.includes('diagnostic_healthcare') || key.includes('diagnostic') || key.includes('health') || key.includes('patholog') || key.includes('blood') || key.includes('doctor') || key.includes('care') || key.includes('medic') || key.includes('test') || key.includes('elderly')) {
      return {
        icon: <Activity size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
        primary: '#F43F5E',
        secondary: '#14B8A6',
        tertiary: '#A855F7',
        accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 50%, #14B8A6 100%)',
        shadow1: 'rgba(244, 63, 94, 0.42)',
        shadow2: 'rgba(20, 184, 166, 0.32)',
        shadow3: 'rgba(168, 85, 247, 0.28)',
        glow: 'rgba(244, 63, 94, 0.55)',
        badgeBg: 'rgba(244, 63, 94, 0.2)',
        badgeColor: '#FDA4AF'
      };
    }

    // 11. Logistics & Freight
    if (key.includes('logistics') || key.includes('mov') || key.includes('vehicle') || key.includes('transport') || key.includes('truck') || key.includes('cargo') || key.includes('courier') || key.includes('freight')) {
      return {
        icon: <Truck size={28} strokeWidth={2.4} />,
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        tertiary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 50%, #8B5CF6 100%)',
        shadow1: 'rgba(59, 130, 246, 0.42)',
        shadow2: 'rgba(139, 92, 246, 0.32)',
        shadow3: 'rgba(6, 182, 212, 0.28)',
        glow: 'rgba(59, 130, 246, 0.55)',
        badgeBg: 'rgba(59, 130, 246, 0.2)',
        badgeColor: '#93C5FD'
      };
    }

    // Default
    return {
      icon: <LayoutList size={28} strokeWidth={2.4} />,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      primary: '#6366F1',
      secondary: '#EC4899',
      tertiary: '#38BDF8',
      accentBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #EC4899 100%)',
      shadow1: 'rgba(99, 102, 241, 0.42)',
      shadow2: 'rgba(236, 72, 153, 0.32)',
      shadow3: 'rgba(56, 189, 248, 0.28)',
      glow: 'rgba(99, 102, 241, 0.55)',
      badgeBg: 'rgba(99, 102, 241, 0.2)',
      badgeColor: '#C7D2FE'
    };
  };

const EXACT_SERVICE_IMAGES = {
  // Plumbing & Cleaning
  'tap repair': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'tap leakage & valve repair': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'pipe leakage fix': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'drain blockage & clog clearance': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
  'bathroom cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'deep home & bathroom cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'kitchen deep cleaning & chimney degreasing': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  'sofa & carpet shampooing': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
  'full home cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',

  // Appliances & Electrical
  'switch board repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'switchboard & wiring repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'fan repair': 'https://images.unsplash.com/photo-1590725140246-20150937a07a?auto=format&fit=crop&w=600&q=80',
  'ceiling & exhaust fan repair': 'https://images.unsplash.com/photo-1590725140246-20150937a07a?auto=format&fit=crop&w=600&q=80',
  'geyser & water heater servicing': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  'inverter & battery servicing': 'https://images.unsplash.com/photo-1558441719-646b22ad4409?auto=format&fit=crop&w=600&q=80',
  'microwave & otg repair': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
  'ro repair': 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80',
  'ro water purifier service': 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80',
  'ro installation': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
  'ro maintenance': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  'ac repair': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'ac repair & service': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'ac installation': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
  'ac maintenance': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'refrigerator repair': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
  'washing machine repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',

  // Pest Control
  'general pest & cockroach control': 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  'termite & wood borer treatment': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
  'bed bug eradication treatment': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
  'mosquito & flying insect control': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',

  // Salon & Massage / Wellness (Unisex)
  "men's haircut & beard styling": 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  "women's haircut & hair spa": 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'at-home manicure & pedicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  'full arms & legs waxing': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80',
  'bridal & party makeup at home': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  'at-home facial & skin glow': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
  'head, neck & shoulder massage': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  'full body stress relief therapy': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',

  // Civil & Property Maintenance
  'carpentry & furniture repair': 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80',
  'furniture assembly & flatpack setup': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
  'drilling, hanging & wall mounting': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'interior wall painting & touch-up': 'https://images.unsplash.com/photo-1562259949-e8ce0f68d60f?auto=format&fit=crop&w=600&q=80',
  'masonry & brickwork': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'waterproofing': 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80',
  'flooring & tiling': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
  'roof & terrace maintenance': 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80',
  'home renovation': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
  'general civil repairs': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'general civil & wall repair': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',

  // Tech & Home Automation
  'laptop & pc diagnostics / os setup': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  'wi-fi router & mesh network setup': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
  'smart tv & home theater wall setup': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  'printer setup & troubleshooting': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',

  // Vehicle & Auto Care
  'doorstep eco car foam wash & vacuum': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
  'doorstep bike foam wash & chain lube': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  'deep car interior detailing & polishing': 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
  'car battery jump start assistance': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',

  // Home Help & Errand Services
  'daily domestic helper / maid on demand': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'home chef & daily cook on demand': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
  'doorstep laundry & steam ironing': 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80',
  'urgent medicine & prescription delivery': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'local grocery & market pickup delivery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'personal errand & queue assistance': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',

  // Security Services
  'cctv installation': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  'cctv installation & setup': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  'smart lock installation': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80',
  'video doorbell installation': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
  'security guard service': 'https://images.unsplash.com/photo-1581568736305-49a04e012c13?auto=format&fit=crop&w=600&q=80',

  // Diagnostic & Health
  'blood test & sample collection': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
  'full body health checkup': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'home diagnostic test': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  'compounder on call': 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
  'elderly assistance & hospital escort': 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',

  // Logistics & Vehicles
  'electric bike': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  'electric bike express courier': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  'petrol bike': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
  'express courier (local)': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
  'personal items (documents & files)': 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80',
  'electric rickshaw': 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80',
  'loading vehicle (3w)': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
  'loading vehicle': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  'mini truck': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'mini truck (tata ace)': 'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?auto=format&fit=crop&w=600&q=80',
  'mini truck goods transport': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'retail store delivery': 'https://images.unsplash.com/photo-1586528116024-e1b1d7d0a2ec?auto=format&fit=crop&w=600&q=80',
  'truck': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  'truck (14ft / 17ft)': 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
  'furniture moving': '/furniture-moving.jpg',
  'furniture shifting': '/furniture-moving.jpg',
  'furniture transport': '/furniture-moving.jpg',
  'house shifting & furniture': '/furniture-moving.jpg',
  'heavy truck': 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80',
  'heavy truck commercial freight': 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80'
};

  const getServiceConfig = (serviceName, categoryName) => {
    const rawName = (serviceName || '').trim();
    const name = rawName.toLowerCase();
    const cat = (categoryName || '').toLowerCase();
    const theme = getCategoryTheme(cat);
    
    // 1. Direct exact match from curated dictionary
    let serviceImage = EXACT_SERVICE_IMAGES[name];

    // 2. Intelligent keyword fallback if exact name not in map
    if (!serviceImage) {
      if (name.includes('pest') || name.includes('cockroach') || name.includes('termite') || name.includes('bed bug') || name.includes('mosquito')) {
        serviceImage = 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('car ') || name.includes('bike wash') || name.includes('detailing') || name.includes('jump start')) {
        serviceImage = 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('laptop') || name.includes('pc ') || name.includes('computer') || name.includes('router') || name.includes('tv ') || name.includes('printer')) {
        serviceImage = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('maid') || name.includes('cook') || name.includes('chef') || name.includes('laundry') || name.includes('grocery') || name.includes('medicine')) {
        serviceImage = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('hair') || name.includes('spa') || name.includes('facial') || name.includes('manicure') || name.includes('pedicure') || name.includes('waxing') || name.includes('makeup') || name.includes('bridal')) {
        serviceImage = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('massage') || name.includes('therapy')) {
        serviceImage = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('furniture') || name.includes('sofa') || name.includes('shifting') || name.includes('relocation') || name.includes('movers') || name.includes('packers')) {
        serviceImage = '/furniture-moving.jpg';
      } else if (name.includes('ac ') || name.includes('air condition') || name.includes('cooling') || name.includes('hvac')) {
        serviceImage = 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('switch') || name.includes('wire') || name.includes('electric') || name.includes('inverter') || name.includes('fuse') || name.includes('mcb')) {
        serviceImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('fan')) {
        serviceImage = 'https://images.unsplash.com/photo-1590725140246-20150937a07a?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('tap') || name.includes('faucet') || name.includes('basin') || name.includes('sink') || name.includes('valve')) {
        serviceImage = 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('pipe') || name.includes('drain') || name.includes('plumb') || name.includes('tank')) {
        serviceImage = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('ro ') || name.includes('purifier') || name.includes('water filter') || name.includes('water clean')) {
        serviceImage = 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('washing machine')) {
        serviceImage = 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('refrigerator') || name.includes('fridge')) {
        serviceImage = 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('bathroom') || name.includes('toilet') || name.includes('washroom')) {
        serviceImage = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('clean') || name.includes('housekeep') || name.includes('dusting')) {
        serviceImage = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('blood') || name.includes('cbc') || name.includes('lab') || name.includes('pathology') || name.includes('sample')) {
        serviceImage = 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('health') || name.includes('doctor') || name.includes('nurse') || name.includes('compounder') || name.includes('patient') || name.includes('diagnostic') || name.includes('elderly')) {
        serviceImage = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('cctv') || name.includes('camera') || name.includes('surveillance')) {
        serviceImage = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('guard') || name.includes('security') || name.includes('officer')) {
        serviceImage = 'https://images.unsplash.com/photo-1581568736305-49a04e012c13?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('lock') || name.includes('doorbell') || name.includes('key')) {
        serviceImage = 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('carpent') || name.includes('wood') || name.includes('cabinet') || name.includes('assembly') || name.includes('drilling')) {
        serviceImage = 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab98f?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('waterproof')) {
        serviceImage = 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('roof') || name.includes('terrace')) {
        serviceImage = 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mason') || name.includes('brick') || name.includes('civil') || name.includes('plaster') || name.includes('renovat') || name.includes('paint')) {
        serviceImage = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('bike') || name.includes('courier') || name.includes('document') || name.includes('parcel')) {
        serviceImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('rickshaw') || name.includes('loading') || name.includes('3w')) {
        serviceImage = 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mini truck') || name.includes('tata ace') || name.includes('pickup')) {
        serviceImage = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('truck') || name.includes('tempo') || name.includes('logistics') || name.includes('cargo') || name.includes('transport') || name.includes('freight')) {
        serviceImage = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80';
      } else {
        serviceImage = theme.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
      }
    }

    return {
      image: serviceImage,
      icon: theme.icon,
      color: theme.primary,
      secondary: theme.secondary,
      tertiary: theme.tertiary,
      shadow1: theme.shadow1,
      shadow2: theme.shadow2,
      shadow3: theme.shadow3,
      bg: `${theme.primary}18`
    };
  };

  // If logged in as PROVIDER, render the dedicated Partner Operations & Admin Collaboration Nexus
  if (currentUser && currentUser.role === 'PROVIDER') {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
        {/* Partner Executive Operations Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25), 0 0 20px rgba(56, 189, 248, 0.1)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', position: 'relative', zIndex: 2 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  <Radio size={12} className="animate-pulse" />
                  <span>Taaskr Partner Operations Hub</span>
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  ID: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>#TK-IND-{currentUser.id ? String(currentUser.id).padStart(4, '0') : '8842'}</strong>
                </span>
              </div>

              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
                Welcome back, {currentUser.name || 'Partner Specialist'}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                Connected to <strong>Taaskr Central Operations Desk</strong> • Authorized territory: <strong>Indore Metro & East Zone (15 km dispatch radius)</strong>
              </p>
            </div>

            {/* Live Dispatch Toggle & Quick Launch */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setIsOnline(!isOnline)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '30px',
                  border: isOnline ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                  backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: isOnline ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isOnline ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? '#10b981' : '#ef4444',
                  boxShadow: isOnline ? '0 0 8px #10b981' : 'none'
                }} />
                <span>{isOnline ? 'Active on Dispatch Grid' : 'Dispatch Paused (On Break)'}</span>
              </button>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  to="/provider"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', fontSize: '0.825rem', fontWeight: 600 }}
                >
                  <Sparkles size={14} />
                  <span>Open Partner Console</span>
                </Link>
                <button
                  onClick={() => setShowEscalationModal(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.8rem', fontSize: '0.825rem' }}
                >
                  <AlertTriangle size={13} color="#f59e0b" />
                  <span>Admin Help Desk</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: ADMIN OPERATIONS BROADCASTS & NOTICES (Admin -> Provider)      */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Bell size={18} color="var(--primary)" />
              <span>Admin Operational Directives & Live Bulletins</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated 10 mins ago • Taaskr Ops Desk</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Bulletin 1: Monsoon Surge Incentive */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Active Surge</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Indore East & Vijay Nagar</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                ⚡ +₹150 Emergency Surcharge Incentive
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Admin has activated monsoon emergency surge. Earn an extra <strong>₹150 bonus</strong> on every AC, RO & Electrical repair completed within 45 minutes of customer request.
              </p>
            </div>

            {/* Bulletin 2: Security & OTP Protocol */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Compliance Rule</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Operating Procedure</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                🛡️ Mandatory 4-Digit Start OTP & ID Badge
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                All partners must display the digital Taaskr ID and verify the customer's 4-digit start OTP before commencing work to ensure immediate insurance coverage.
              </p>
            </div>

            {/* Bulletin 3: Payout Notice */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '12px',
              padding: '1.15rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>Payout Batch</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weekly Settlement</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                💳 Auto-IMPS Payouts Scheduled
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Next batch settlement will process automatically on <strong>Tuesday 10:00 AM</strong> to your registered bank account. Cash on Delivery collections are reconciled in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: PROVIDER-ADMIN SLA & COMPLIANCE GOVERNANCE                      */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span>Admin-Partner Governance & SLA Compliance Index</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* KYC Card */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                flexShrink: 0
              }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KYC & Verification</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>100% Verified</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 500 }}>Aadhaar & Police Clearance OK</div>
              </div>
            </div>

            {/* SLA Rating */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                <Star size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality & SLA Score</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>4.9 ★ Gold Tier</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>98.6% On-Time • 0 Penalties</div>
              </div>
            </div>

            {/* Revenue Share Split */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                flexShrink: 0
              }}>
                <Award size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Partner Revenue Share</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>85% Net Payout</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>15% Platform & Insurance SLA</div>
              </div>
            </div>

            {/* Payout Bank */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
                flexShrink: 0
              }}>
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Settlement Bank</div>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)' }}>HDFC Bank ****4892</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct IMPS / UPI Enabled</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: AUTHORIZED SERVICE CAPABILITY MATRIX (Admin Approved Trades)   */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <Briefcase size={18} color="var(--primary)" />
                <span>Admin Approved Service Trades & Capabilities</span>
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Services authorized by Taaskr Admin for your technician profile to receive automatic customer dispatches.
              </p>
            </div>

            <button
              onClick={() => {
                setRequestSubmitted(false);
                setShowSkillRequestModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Plus size={14} />
              <span>Request New Trade Approval</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {[
              { id: 1, name: 'AC Repair & Diagnostics', category: 'Appliances', rate: '₹699', status: 'AUTHORIZED', icon: <Snowflake size={20} color="#38bdf8" /> },
              { id: 2, name: 'RO Water Purifier Servicing', category: 'Appliances', rate: '₹499', status: 'AUTHORIZED', icon: <Droplets size={20} color="#06b6d4" /> },
              { id: 3, name: 'Switchboard & Electrical Wiring', category: 'Electrical', rate: '₹349', status: 'AUTHORIZED', icon: <Zap size={20} color="#f59e0b" /> },
              { id: 4, name: 'Deep Home & Bathroom Cleaning', category: 'Cleaning', rate: '₹1,499', status: 'AUTHORIZED', icon: <Sparkles size={20} color="#10b981" /> },
              { id: 5, name: 'Mini Truck Goods Transport', category: 'Logistics', rate: '₹250/km', status: 'AUTHORIZED', icon: <Truck size={20} color="#a855f7" /> },
              { id: 6, name: 'CCTV & Security Camera Setup', category: 'Security Services', rate: '₹1,199', status: 'AUTHORIZED', icon: <ShieldCheck size={20} color="#ec4899" /> }
            ].map((srv) => (
              <div
                key={srv.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {srv.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', margin: '0 0 0.2rem 0' }}>
                      {srv.name}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Category: <span style={{ color: 'var(--text-secondary)' }}>{srv.category}</span> • Base Payout: <strong style={{ color: 'var(--text-main)' }}>{srv.rate}</strong>
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}>
                  ● Approved
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: ADMIN INCIDENT & ESCALATION DESK (Provider -> Admin)           */}
        {/* ========================================================================= */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Admin Operations & Dispute Desk
              </h2>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Facing on-site issues, spare parts extra costs, or customer unavailability? Connect directly with Taaskr Central Operations for rapid resolution.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEscalationType('PARTS_REIMBURSEMENT');
                setEscalationSubmitted(false);
                setShowEscalationModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            >
              <FileText size={14} />
              <span>Claim Extra Parts Cost</span>
            </button>

            <button
              onClick={() => {
                setEscalationType('CUSTOMER_UNREACHABLE');
                setEscalationSubmitted(false);
                setShowEscalationModal(true);
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            >
              <Phone size={14} />
              <span>Report Customer Unreachable</span>
            </button>

            <a
              href="tel:+917314009000"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.85rem', textDecoration: 'none' }}
            >
              <Phone size={14} />
              <span>Priority Admin Hotline</span>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL 1: REQUEST NEW TRADE / SKILL AUTHORIZATION FROM ADMIN               */}
        {/* ========================================================================= */}
        {showSkillRequestModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Briefcase size={18} color="var(--primary)" />
                  <span>Request Trade Authorization</span>
                </h3>
                <button
                  onClick={() => setShowSkillRequestModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {requestSubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1rem auto' }}>
                    <Check size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Application Submitted to Admin Desk
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Taaskr Technical Operations will review your certification and dispatch history. You will be notified within 24 hours upon approval.
                  </p>
                  <button
                    onClick={() => setShowSkillRequestModal(false)}
                    className="btn btn-primary btn-sm"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setRequestSubmitted(true);
                }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Service Category to Authorize</label>
                    <select
                      className="form-control"
                      value={requestedCategory}
                      onChange={(e) => setRequestedCategory(e.target.value)}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      <option value="Solar Inverter Maintenance">Solar Inverter & Renewable Energy</option>
                      <option value="Medical Diagnostic Phlebotomy">Healthcare Sample Collection</option>
                      <option value="Plumbing & Pipe Overhaul">Advanced Commercial Plumbing</option>
                      <option value="Heavy Freight Logistics">Heavy Freight & Interstate Transport</option>
                      <option value="Fire Alarm & Security">Fire Safety & Alarm Setup</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Years of Industry Experience</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="30"
                      value={requestedSkillExp}
                      onChange={(e) => setRequestedSkillExp(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Trade Certification / Notes for Admin</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Mention your ITI certificate, brand certifications (e.g. Daikin, Voltas, Havells) or prior experience..."
                      value={requestedSkillNotes}
                      onChange={(e) => setRequestedSkillNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowSkillRequestModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                    >
                      Submit for Admin Approval
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: ADMIN INCIDENT & MATERIAL REIMBURSEMENT DESK                     */}
        {/* ========================================================================= */}
        {showEscalationModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <span>Admin Operations Ticket</span>
                </h3>
                <button
                  onClick={() => setShowEscalationModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {escalationSubmitted ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1rem auto' }}>
                    <Check size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Ticket #{Math.floor(100000 + Math.random() * 900000)} Created
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    Taaskr Dispatch Supervisor has been assigned to your ticket. A supervisor will call you within 5 minutes.
                  </p>
                  <button
                    onClick={() => setShowEscalationModal(false)}
                    className="btn btn-primary btn-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setEscalationSubmitted(true);
                }}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Issue Category</label>
                    <select
                      className="form-control"
                      value={escalationType}
                      onChange={(e) => setEscalationType(e.target.value)}
                    >
                      <option value="PARTS_REIMBURSEMENT">Extra Spare Parts Reimbursement Claim</option>
                      <option value="CUSTOMER_UNREACHABLE">Customer Not Answering / Door Locked</option>
                      <option value="SCOPE_CHANGE">Customer Requested Additional Heavy Scope</option>
                      <option value="SAFETY_HAZARD">Onsite Electrical / Structural Safety Hazard</option>
                    </select>
                  </div>

                  {escalationType === 'PARTS_REIMBURSEMENT' && (
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label className="form-label">Spare Part Cost (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 450 (Capacitor / Valve replacement)"
                        value={escalationAmount}
                        onChange={(e) => setEscalationAmount(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Booking ID (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. #61 or leave blank for general issue"
                      value={escalationBookingId}
                      onChange={(e) => setEscalationBookingId(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Detailed Notes for Admin Desk</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Describe the issue in detail..."
                      value={escalationNotes}
                      onChange={(e) => setEscalationNotes(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowEscalationModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Regular Customer / Guest Catalog View
  return (
    <div className="animate-fade-in">
      {/* Dynamic Responsive Hero Section */}
      <section className="hero-section">
        {/* Glowing Ambient Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div className="hero-orb-1" style={{
            position: 'absolute', top: '-10%', left: '15%', width: '450px', height: '450px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(37, 99, 235, 0.06) 50%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(50px)'
          }} />
          <div className="hero-orb-2" style={{
            position: 'absolute', bottom: '-15%', right: '10%', width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(99, 102, 241, 0.05) 50%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(60px)'
          }} />
          <div className="hero-grid-pattern" style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* Hero Content Container */}
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, textAlign: 'center', padding: '1rem 0' }}>
          
          <div className="hero-pill-tag" style={{ margin: '0 auto 1.5rem auto' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 10px var(--success)' }} />
            <span>
              Verified Service Marketplace • Real-Time Dispatch
            </span>
          </div>

          <h1 className="hero-title" style={{ maxWidth: '800px', margin: '0 auto 1.25rem auto' }}>
            On-Demand Services.<br />
            <span style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #6366F1 50%, #38BDF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Engineered for Speed.
            </span>
          </h1>

          <p className="hero-desc" style={{ maxWidth: '680px', margin: '0 auto 2.25rem auto' }}>
            Book verified electricians, plumbers, cleaners, and courier specialists in minutes. Upfront pricing, vetted partners, and instant doorstep scheduling.
          </p>

          {/* CTA Button Group */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => {
                const elem = document.getElementById('services-catalog');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary btn-lg"
            >
              <span>Explore Services</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => navigate('/register?role=PROVIDER')}
              className="btn btn-secondary btn-lg"
            >
              Join as Partner
            </button>
          </div>

          {/* Trust Highlights Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2.5rem',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.5rem',
            maxWidth: '750px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>100% Background Checked</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <Zap size={16} color="var(--warning)" />
              <span>Fast Doorstep Dispatch</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <CreditCard size={16} color="var(--primary)" />
              <span>Pay After Completion</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Area with Category Tiles & Integrated Search */}
      <main id="services-catalog" className="app-container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem', maxWidth: '750px', margin: '0 auto 2.5rem auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.6rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Explore Verified Services
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto' }}>
            Select a verified service category to instantly book top-rated, background-checked professionals with upfront pricing and live tracking.
          </p>
        </div>

        {/* Category Header (Explore All Services button removed) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.35rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Service Categories
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: 0 }}>
              Selected category: <strong style={{ color: 'var(--primary)' }}>{categories.find(c => c.id === selectedCategory)?.name || 'Appliances & Electrical'}</strong>
            </p>
          </div>
        </div>

        {/* Enlarged Category Tiles Grid */}
        <div style={{ marginBottom: '2.75rem' }}>
          <div className="category-tiles-grid">
            {(categories || []).map((cat) => {
              if (!cat) return null;
              const isSelected = selectedCategory === cat.id;
              const theme = getCategoryTheme(cat.name);
              const catServiceCount = (services || []).filter(s => s && (s.canonicalCategoryId === cat.id || s.categoryId === cat.id)).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                  style={{
                    '--tile-color': theme.primary,
                    '--tile-secondary': theme.secondary,
                    '--tile-tertiary': theme.tertiary,
                    '--tile-shadow-1': theme.shadow1,
                    '--tile-shadow-2': theme.shadow2,
                    '--tile-shadow-3': theme.shadow3,
                    '--tile-accent': theme.accentBg
                  }}
                >
                  <div
                    className="cat-icon-badge"
                    style={{
                      background: theme.accentBg,
                      color: '#FFFFFF'
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className="category-tile-title">
                    {cat.name || 'Category'}
                  </div>
                  <div className="cat-count-badge">
                    {catServiceCount} {catServiceCount === 1 ? 'service' : 'services'}
                  </div>
                  {isSelected && (
                    <div className="cat-active-indicator" style={{ backgroundColor: theme.primary, boxShadow: `0 0 12px ${theme.primary}` }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Services Grid Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
            Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} in {categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
          </h3>
        </div>

        {/* Services Grid with Dynamic Hover */}
        {loading ? (
          <div className="grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="panel" style={{ height: '220px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton" style={{ width: '44px', height: '44px' }} />
                <div className="skeleton" style={{ width: '70%', height: '18px' }} />
                <div className="skeleton" style={{ width: '100%', height: '14px' }} />
                <div className="skeleton" style={{ width: '40%', height: '14px', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={22} />
            </div>
            <h3 className="empty-state-title">No Services in this Category</h3>
            <p className="empty-state-description">
              No services found for the selected category. Try selecting another category above.
            </p>
          </div>
        ) : (
          <div>
            <div className="grid-cols-4">
              {filteredServices.slice((servicesPage - 1) * servicesPerPage, servicesPage * servicesPerPage).map((service) => {
                if (!service) return null;
                const catName = service.canonicalCategoryName || categories.find(c => c && c.id === service.categoryId)?.name || 'Service';
                const config = getServiceConfig(service.name, catName);
                const priceUnit = service.pricingType === 'HOURLY' ? '/ hr' : service.pricingType === 'PER_KM' ? '/ km' : '';
                const descText = service.description || 'Verified, professional on-demand home and maintenance service.';

                return (
                  <div
                    key={service.id}
                    className="service-card"
                    style={{
                      '--service-color': config.color,
                      '--service-shadow-1': config.shadow1,
                      '--service-shadow-2': config.shadow2,
                      '--service-shadow-3': config.shadow3,
                      '--service-glow': config.shadow1,
                      '--service-bg': config.bg
                    }}
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
                    <div className="service-card-image-box">
                      <img
                        src={config.image}
                        alt={service.name || 'Service'}
                        className="service-card-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <h3 className="service-card-title">{service.name || 'Service'}</h3>
                    </div>

                    <span className="service-category-tag" style={{ color: config.color, backgroundColor: config.bg }}>
                      {catName}
                    </span>

                    <p className="service-card-desc">
                      {descText.length > 85 ? descText.substring(0, 85) + '...' : descText}
                    </p>

                    <div className="service-card-footer">
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>
                          Starting from
                        </div>
                        <span className="service-price">
                          ₹{service.price ?? 0} {priceUnit}
                        </span>
                      </div>
                      
                      <button className="service-cta" onClick={(e) => {
                         e.stopPropagation();
                         navigate(`/services/${service.id}`);
                      }}>
                        <span>Book</span> <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={servicesPage}
              totalItems={filteredServices.length}
              itemsPerPage={servicesPerPage}
              onPageChange={setServicesPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
