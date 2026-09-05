import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Pagination from '../components/Pagination';
import { 
  Search, ShieldCheck, Tag, CreditCard, Star, LayoutList, 
  Droplets, Zap, Paintbrush, Leaf, Truck, Settings, 
  Snowflake, Ruler, Hammer, ArrowRight, Activity, Stethoscope, Building2, Scissors,
  Radio, Award, AlertTriangle, CheckCircle2, ChevronRight, Phone, MessageSquare, 
  FileText, Plus, Bell, RefreshCw, Send, Check, X, ArrowUpRight, HelpCircle, Briefcase, Clock,
  Bug, Laptop, Car, HeartPulse, Wrench, MapPin, TrendingUp, Lock, UserCheck, Layers
} from 'lucide-react';

const canonicalizeServiceName = (rawName) => {
  if (!rawName) return null;
  const s = rawName.toLowerCase().trim();

  // 0. Exclude unwanted / vague entries
  if (s.includes('general civil') || s.includes('minor civil') || s === 'civil repair') {
    return null;
  }

  // 1. Appliances & Electrical
  if (s.includes('switch') || s.includes('switchboard') || s.includes('wiring') || s.includes('mcb')) {
    return 'Switchboard & Wiring Repair';
  }
  if (s.includes('fan') || s.includes('cooler motor')) {
    return 'Ceiling & Exhaust Fan Repair';
  }
  if (s.includes('geyser') || s.includes('water heater')) {
    return 'Geyser & Water Heater Servicing';
  }
  if (s.includes('inverter') || s.includes('battery servic')) {
    return 'Inverter & Battery Servicing';
  }
  if (s.includes('microwave') || s.includes('otg')) {
    return 'Microwave & OTG Repair';
  }
  if (s.includes('ro ') || s.includes('purifier') || s.includes('reverse osmosis')) {
    return 'RO Water Purifier Service';
  }
  if (s.includes('ac ') || s.includes('air condition')) {
    return 'AC Repair & Service';
  }
  if (s.includes('refrigerator') || s.includes('fridge')) {
    return 'Refrigerator Repair';
  }
  if (s.includes('washing machine') || s.includes('washing')) {
    return 'Washing Machine Repair';
  }

  // 2. Plumbing & Cleaning
  if (s.includes('tap') || s.includes('faucet') || s.includes('valve')) {
    return 'Tap Leakage & Valve Repair';
  }
  if (s.includes('pipe') || s.includes('pipeline')) {
    return 'Pipe Leakage Fix';
  }
  if (s.includes('drain') || s.includes('clog') || s.includes('blockage')) {
    return 'Drain Blockage & Clog Clearance';
  }
  if (s.includes('bathroom') || s.includes('toilet cleaning')) {
    return 'Bathroom Deep Cleaning & Sanitization';
  }
  if (s.includes('kitchen deep') || s.includes('kitchen cleaning') || s.includes('chimney')) {
    return 'Kitchen Deep Cleaning & Chimney Degreasing';
  }
  if (s.includes('sofa') || s.includes('carpet')) {
    return 'Sofa & Carpet Shampooing';
  }
  if (s.includes('home cleaning') || s.includes('full home') || s.includes('house clean')) {
    return 'Full Home Cleaning';
  }

  // 3. Pest Control
  if (s.includes('cockroach') || (s.includes('pest') && !s.includes('termite') && !s.includes('bed bug') && !s.includes('mosquito'))) {
    return 'General Pest & Cockroach Control';
  }
  if (s.includes('termite') || s.includes('borer')) {
    return 'Termite & Wood Borer Treatment';
  }
  if (s.includes('bed bug')) {
    return 'Bed Bug Eradication Treatment';
  }
  if (s.includes('mosquito') || s.includes('insect control')) {
    return 'Mosquito & Flying Insect Control';
  }

  // 4. Unisex Salon & Wellness
  if (s.includes("men's haircut") || s.includes('beard') || s.includes('men haircut')) {
    return "Men's Haircut & Beard Styling";
  }
  if (s.includes("women's haircut") || s.includes('hair spa') || s.includes('women haircut')) {
    return "Women's Haircut & Hair Spa";
  }
  if (s.includes('manicure') || s.includes('pedicure')) {
    return 'At-Home Manicure & Pedicure';
  }
  if (s.includes('waxing') || s.includes('wax')) {
    return 'Full Arms & Legs Waxing';
  }
  if (s.includes('bridal') || s.includes('makeup') || s.includes('party makeover')) {
    return 'Bridal & Party Makeup at Home';
  }
  if (s.includes('facial') || s.includes('skin glow') || s.includes('cleanup')) {
    return 'At-Home Facial & Skin Glow';
  }
  if (s.includes('head') || s.includes('shoulder massage') || s.includes('neck massage')) {
    return 'Head, Neck & Shoulder Massage';
  }
  if (s.includes('body massage') || s.includes('full body') || s.includes('therapy')) {
    return 'Full Body Stress Relief Therapy';
  }

  // 5. Civil & Maintenance
  if (s.includes('carpenter') || s.includes('woodwork') || s.includes('furniture repair')) {
    return 'Carpentry & Furniture Repair';
  }
  if (s.includes('assembly') || s.includes('flatpack')) {
    return 'Furniture Assembly & Flatpack Setup';
  }
  if (s.includes('drill') || s.includes('hanging') || s.includes('mounting')) {
    return 'Drilling, Hanging & Wall Mounting';
  }
  if (s.includes('paint') || s.includes('touch-up')) {
    return 'Interior Wall Painting & Touch-up';
  }

  // 6. Tech & Automation
  if (s.includes('laptop') || s.includes('pc ') || s.includes('computer')) {
    return 'Laptop & PC Diagnostics / OS Setup';
  }
  if (s.includes('wi-fi') || s.includes('router') || s.includes('mesh network')) {
    return 'Wi-Fi Router & Mesh Network Setup';
  }
  if (s.includes('smart tv') || s.includes('theater')) {
    return 'Smart TV & Home Theater Wall Setup';
  }
  if (s.includes('printer')) {
    return 'Printer Setup & Troubleshooting';
  }

  // 7. Auto Care
  if (s.includes('car foam') || s.includes('car wash') || s.includes('eco car')) {
    return 'Doorstep Eco Car Foam Wash & Vacuum';
  }
  if (s.includes('bike foam') || s.includes('bike wash') || s.includes('chain lube')) {
    return 'Doorstep Bike Foam Wash & Chain Lube';
  }
  if (s.includes('interior detailing') || s.includes('car interior') || s.includes('auto detailing')) {
    return 'Deep Car Interior Detailing & Polishing';
  }
  if (s.includes('jump start') || s.includes('battery jump') || s.includes('car battery')) {
    return 'Car Battery Jump Start Assistance';
  }

  // 8. Home Help
  if (s.includes('maid') || s.includes('domestic helper')) {
    return 'Daily Domestic Helper / Maid on Demand';
  }
  if (s.includes('cook') || s.includes('chef')) {
    return 'Home Chef & Daily Cook on Demand';
  }
  if (s.includes('laundry') || s.includes('steam ironing')) {
    return 'Doorstep Laundry & Steam Ironing';
  }
  if (s.includes('medicine') || s.includes('prescription')) {
    return 'Urgent Medicine & Prescription Delivery';
  }
  if (s.includes('grocery') || s.includes('market pickup')) {
    return 'Local Grocery & Market Pickup Delivery';
  }
  if (s.includes('errand') || s.includes('queue')) {
    return 'Personal Errand & Queue Assistance';
  }

  // 9. Security
  if (s.includes('cctv') || s.includes('camera')) {
    return 'CCTV Installation & Setup';
  }
  if (s.includes('smart lock')) {
    return 'Smart Lock Installation';
  }
  if (s.includes('security guard') || s.includes('guard')) {
    return 'Security Guard Service';
  }

  // 10. Healthcare
  if (s.includes('blood test') || s.includes('sample collection') || s.includes('phlebotomy')) {
    return 'Blood Test & Sample Collection';
  }
  if (s.includes('full body') || s.includes('health checkup')) {
    return 'Full Body Health Checkup';
  }
  if (s.includes('compounder') || s.includes('nursing')) {
    return 'Compounder on Call';
  }
  if (s.includes('elderly') || s.includes('hospital escort')) {
    return 'Elderly Assistance & Hospital Escort';
  }

  // 11. Logistics
  if (s.includes('mini truck') || s.includes('tempo') || s.includes('furniture moving')) {
    return 'Mini Truck Goods Transport';
  }
  if (s.includes('electric bike') || s.includes('express courier')) {
    return 'Electric Bike Express Courier';
  }
  if (s.includes('heavy truck') || s.includes('commercial freight') || s.includes('truck')) {
    return 'Heavy Truck Commercial Freight';
  }

  return rawName.trim();
};



const CANONICAL_CATEGORIES = [
  { 
    id: 'appliances_electrical', 
    name: 'Appliances & Electrical',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('switch') || s.includes('wire') || s.includes('mcb') || s.includes('fan') || 
          s.includes('ac ') || s.includes('air condition') || s.includes('ro ') || s.includes('purifier') || 
          s.includes('geyser') || s.includes('water heater') || s.includes('inverter') || 
          s.includes('microwave') || s.includes('refrigerator') || s.includes('washing machine')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return (c.includes('appliance') || c.includes('electric')) && 
             !s.includes('tap') && !s.includes('pipe') && !s.includes('drain') && !s.includes('clean');
    }
  },
  { 
    id: 'plumbing_cleaning', 
    name: 'Plumbing & Cleaning',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      // Strictly prevent electrical items from matching here
      if (s.includes('switch') || s.includes('wire') || s.includes('mcb') || s.includes('fan') || 
          s.includes('ac ') || s.includes('air condition') || s.includes('ro ') || s.includes('purifier') || 
          s.includes('geyser') || s.includes('inverter') || s.includes('microwave') || 
          s.includes('refrigerator') || s.includes('washing machine')) {
        return false;
      }
      if (s.includes('tap') || s.includes('pipe') || s.includes('drain') || s.includes('leak') || 
          s.includes('bathroom') || s.includes('clean') || s.includes('sofa') || s.includes('carpet') || s.includes('chimney')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return (c.includes('plumb') || c.includes('clean')) && !c.includes('pest');
    }
  },
  { 
    id: 'pest_control', 
    name: 'Pest Control',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('pest') || s.includes('cockroach') || s.includes('termite') || 
          s.includes('bed bug') || s.includes('mosquito') || s.includes('insect')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('pest');
    }
  },
  { 
    id: 'salon_wellness', 
    name: 'Salon & Massage / Wellness',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('haircut') || s.includes('beard') || s.includes('spa') || s.includes('grooming') || 
          s.includes('facial') || s.includes('manicure') || s.includes('pedicure') || s.includes('waxing') || 
          s.includes('makeup') || s.includes('bridal') || s.includes('massage') || s.includes('therapy')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('salon') || c.includes('massage') || c.includes('wellness') || c.includes('beauty');
    }
  },
  { 
    id: 'civil_maintenance', 
    name: 'Civil & Property Maintenance',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('carpenter') || s.includes('carpentry') || s.includes('woodwork') || 
          s.includes('furniture assembly') || s.includes('drilling') || s.includes('hanging') || 
          s.includes('painting') || s.includes('mason') || s.includes('waterproof') || 
          s.includes('tiling') || s.includes('flooring') || s.includes('roof') || s.includes('renovat')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('civil') || c.includes('property');
    }
  },
  { 
    id: 'tech_automation', 
    name: 'Tech & Home Automation',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('laptop') || s.includes('pc ') || s.includes('computer') || s.includes('wi-fi') || 
          s.includes('router') || s.includes('mesh') || s.includes('smart tv') || s.includes('printer')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('tech') || c.includes('automation');
    }
  },
  { 
    id: 'vehicle_autocare', 
    name: 'Vehicle & Auto Care',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('car foam') || s.includes('bike foam') || s.includes('detailing') || 
          s.includes('car wash') || s.includes('bike wash') || s.includes('jump start') || s.includes('battery jump')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('auto') || (c.includes('vehicle') && !c.includes('on-demand vehicle'));
    }
  },
  { 
    id: 'home_help', 
    name: 'Home Help & Errand Services',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('maid') || s.includes('domestic helper') || s.includes('cook') || s.includes('chef') || 
          s.includes('laundry') || s.includes('steam ironing') || s.includes('medicine') || s.includes('grocery') || 
          s.includes('queue') || s.includes('errand')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('home help') || c.includes('errand');
    }
  },
  { 
    id: 'security_services', 
    name: 'Security Services',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('cctv') || s.includes('smart lock') || s.includes('security guard') || s.includes('guard') || 
          s.includes('doorbell') || s.includes('camera') || s.includes('surveillance')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('security');
    }
  },
  { 
    id: 'diagnostic_healthcare', 
    name: 'Diagnostic & Healthcare Services',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('blood') || s.includes('doctor') || s.includes('nurse') || s.includes('compounder') || 
          s.includes('sample') || s.includes('checkup') || s.includes('diagnostic') || s.includes('phlebotomy') || 
          s.includes('elderly assistance') || s.includes('hospital escort')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('diagnostic') || c.includes('health');
    }
  },
  { 
    id: 'logistics', 
    name: 'Logistics',
    matcher: (cName, sName) => {
      const s = (sName || '').toLowerCase();
      if (s.includes('truck') || s.includes('tempo') || s.includes('courier') || s.includes('cargo') || 
          s.includes('transport') || s.includes('moving') || s.includes('shifting') || s.includes('furniture moving') || 
          s.includes('electric bike') || s.includes('petrol bike') || s.includes('rickshaw')) {
        return true;
      }
      const c = (cName || '').toLowerCase();
      return c.includes('logistics') || c.includes('on-demand vehicle');
    }
  }
];

const mapServiceToCanonical = (service, rawCategories = []) => {
  if (!service) return null;
  const canonicalName = canonicalizeServiceName(service.name);
  if (!canonicalName) return null;

  const rawCat = (rawCategories || []).find(c => c && c.id === service.categoryId);
  const catName = rawCat?.name || service.categoryName || '';

  const serviceWithCanonicalName = {
    ...service,
    name: canonicalName
  };
  
  for (const canon of CANONICAL_CATEGORIES) {
    if (canon.matcher(catName, canonicalName)) {
      return {
        ...serviceWithCanonicalName,
        canonicalCategoryId: canon.id,
        canonicalCategoryName: canon.name
      };
    }
  }

  return {
    ...serviceWithCanonicalName,
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
  { id: 15, name: 'Bathroom Deep Cleaning & Sanitization', description: 'Deep tile scrub, lime stain removal, and sanitaryware disinfection.', price: 399, pricingType: 'FIXED', categoryId: 3, active: true },
  { id: 16, name: 'Full Home Cleaning', description: 'Complete multi-room deep cleaning, floor scrubbing, and dusting.', price: 1499, pricingType: 'FIXED', categoryId: 3, active: true },

  // Pest Control
  { id: 17, name: 'General Pest & Cockroach Control', description: 'Odorless herbal gel baiting and spray targeting cockroaches, ants, and silverfish with 90-day warranty.', price: 899, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 18, name: 'Termite & Wood Borer Treatment', description: 'Chemical barrier drill-and-fill treatment protecting wooden structures against subterranean termites.', price: 1899, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 19, name: 'Bed Bug Eradication Treatment', description: 'Two-round high-potency chemical spray treatment targeting mattress seams and sofa crevices.', price: 1199, pricingType: 'FIXED', categoryId: 16, active: true },
  { id: 20, name: 'Mosquito & Flying Insect Control', description: 'Cold-fogging and residual wall misting to eliminate adult mosquitoes and larvae.', price: 799, pricingType: 'FIXED', categoryId: 16, active: true },

  // Salon & Massage / Wellness (Unisex)
  { id: 21, name: "Men's Haircut & Beard Styling", description: 'Doorstep hygienic haircut, beard trimming, styling, and disposable kit protocol.', price: 349, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 22, name: "Women's Haircut & Hair Spa", description: 'Professional precision haircut, deep conditioning hair spa, and blowout styling at home.', price: 699, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 23, name: 'At-Home Manicure & Pedicure', description: 'Relaxing cuticle care, scrub, foot massage, and polish using sterile tools.', price: 599, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 24, name: 'Full Arms & Legs Waxing', description: 'Hygienic RICA / honey waxing with post-wax soothing lotion application.', price: 499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 25, name: 'Bridal & Party Makeup at Home', description: 'HD glam and party makeover by certified makeup artists using premium cosmetics.', price: 1499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 26, name: 'At-Home Facial & Skin Glow', description: 'Deep pore cleansing, tan removal scrub, steam, and herbal face pack for all skin types.', price: 799, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 27, name: 'Head, Neck & Shoulder Massage', description: 'Stress-relief acupressure therapy using soothing warm herbal oils.', price: 499, pricingType: 'FIXED', categoryId: 6, active: true },
  { id: 28, name: 'Full Body Stress Relief Therapy', description: 'Rejuvenating full body Swedish / Ayurvedic oil massage by certified wellness therapists.', price: 1299, pricingType: 'FIXED', categoryId: 6, active: true },

  // Civil & Property Maintenance
  { id: 29, name: 'Carpentry & Furniture Repair', description: 'Fixing misaligned cabinet hinges, drawer channels, hydraulic bed lifts, and wooden doors.', price: 399, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 30, name: 'Furniture Assembly & Flatpack Setup', description: 'Assembly of flatpack wardrobes, beds, TV units, and study desks from IKEA/Amazon/Pepperfry.', price: 499, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 31, name: 'Drilling, Hanging & Wall Mounting', description: 'Precision hammer-drilling for wall art, mirrors, curtain rods, and bathroom towel racks.', price: 249, pricingType: 'FIXED', categoryId: 2, active: true },
  { id: 32, name: 'Interior Wall Painting & Touch-up', description: 'Putty filling, primer, and premium acrylic emulsion roller painting for rooms or accent walls.', price: 1499, pricingType: 'FIXED', categoryId: 2, active: true },

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
  { id: 54, name: 'Mini Truck Goods Transport', description: 'Reliable intra-city tempo transport for furniture, equipment, and shifting.', price: 250, pricingType: 'FIXED', categoryId: 5, active: true },
  { id: 55, name: 'Electric Bike Express Courier', description: 'Fast eco-friendly two-wheeler for small parcels and urgent documents.', price: 40, pricingType: 'FIXED', categoryId: 5, active: true },
  { id: 56, name: 'Heavy Truck Commercial Freight', description: 'Heavy-duty commercial vehicle for heavy machinery and bulk items.', price: 1200, pricingType: 'FIXED', categoryId: 5, active: true }
];

// Helper to strictly sanitize and deduplicate catalog items
const cleanAndDeduplicateCatalog = (servicesList) => {
  if (!Array.isArray(servicesList)) return [];
  const seenKeys = new Set();
  const result = [];

  for (const s of servicesList) {
    if (!s || !s.name || s.active === false) continue;
    const nameLower = (s.name || '').toLowerCase().trim();

    const normalizedKey = nameLower.replace(/\s+/g, ' ');
    if (seenKeys.has(normalizedKey)) {
      continue;
    }
    seenKeys.add(normalizedKey);
    result.push(s);
  }

  return result;
};

const HERO_PALETTES = [
  {
    name: 'Sapphire Horizon',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #6366F1 50%, #38BDF8 100%)',
    orb1: 'radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(168, 85, 247, 0.06) 50%, transparent 70%)',
    badgeColor: '#0284C7'
  },
  {
    name: 'Oceanic Emerald',
    gradient: 'linear-gradient(135deg, #0D9488 0%, #0284C7 50%, #10B981 100%)',
    orb1: 'radial-gradient(circle, rgba(20, 184, 166, 0.28) 0%, rgba(2, 132, 199, 0.08) 50%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.06) 50%, transparent 70%)',
    badgeColor: '#0D9488'
  },
  {
    name: 'Cyber Violet',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #A855F7 100%)',
    orb1: 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, rgba(37, 99, 235, 0.08) 50%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(124, 58, 237, 0.24) 0%, rgba(56, 189, 248, 0.06) 50%, transparent 70%)',
    badgeColor: '#7C3AED'
  },
  {
    name: 'Electric Cyan',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #4F46E5 50%, #06B6D4 100%)',
    orb1: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, rgba(79, 70, 229, 0.08) 50%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(8, 145, 178, 0.24) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 70%)',
    badgeColor: '#0891B2'
  },
  {
    name: 'Royal Sapphire',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #0D9488 50%, #60A5FA 100%)',
    orb1: 'radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(13, 148, 136, 0.08) 50%, transparent 70%)',
    orb2: 'radial-gradient(circle, rgba(96, 165, 250, 0.24) 0%, rgba(2, 132, 199, 0.06) 50%, transparent 70%)',
    badgeColor: '#2563EB'
  }
];

const BOUNCING_PHYSICS_CATEGORIES = [
  {
    id: 'diagnostic_healthcare',
    name: 'Health & Diagnostics',
    tag: 'Doorstep Lab',
    icon: <HeartPulse size={18} strokeWidth={2.2} />,
    color: '#F43F5E',
    glow: 'rgba(244, 63, 94, 0.4)',
    accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
    startX: 0.05,
    startY: 0.08,
    vx: 0.40,
    vy: 0.34
  },
  {
    id: 'appliances_electrical',
    name: 'Electrical & AC',
    tag: 'Quick Repair',
    icon: <Zap size={18} strokeWidth={2.2} />,
    color: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.4)',
    accentBg: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
    startX: 0.82,
    startY: 0.12,
    vx: -0.37,
    vy: 0.44
  },
  {
    id: 'logistics',
    name: 'Logistics Fleet',
    tag: 'Direct Shifting',
    icon: <Truck size={18} strokeWidth={2.2} />,
    color: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.4)',
    accentBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    startX: 0.06,
    startY: 0.78,
    vx: 0.44,
    vy: -0.34
  },
  {
    id: 'salon_wellness',
    name: 'Salon & Wellness',
    tag: 'At-Home Spa',
    icon: <Scissors size={18} strokeWidth={2.2} />,
    color: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.4)',
    accentBg: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
    startX: 0.84,
    startY: 0.76,
    vx: -0.37,
    vy: -0.40
  },
  {
    id: 'plumbing_cleaning',
    name: 'Plumbing & Clean',
    tag: 'Deep Sanitization',
    icon: <Droplets size={18} strokeWidth={2.2} />,
    color: '#06B6D4',
    glow: 'rgba(6, 182, 212, 0.4)',
    accentBg: 'linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)',
    startX: 0.42,
    startY: 0.04,
    vx: -0.30,
    vy: 0.37
  },
  {
    id: 'civil_maintenance',
    name: 'Civil & Woodwork',
    tag: 'Carpenter & Paint',
    icon: <Hammer size={18} strokeWidth={2.2} />,
    color: '#F97316',
    glow: 'rgba(249, 115, 22, 0.4)',
    accentBg: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
    startX: 0.54,
    startY: 0.86,
    vx: 0.34,
    vy: -0.40
  }
];

function BouncingHeroPhysics({ onWallHit, onSelectCategory }) {
  const containerRef = useRef(null);
  const tilesRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animId;
    let lastColorChangeTime = 0;
    const tileWidth = 178;
    const tileHeight = 72;

    const state = BOUNCING_PHYSICS_CATEGORIES.map((cat) => ({
      ...cat,
      x: 0,
      y: 0,
      vx: cat.vx,
      vy: cat.vy
    }));

    const updateBounds = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const maxX = Math.max(10, rect.width - tileWidth);
      const maxY = Math.max(10, rect.height - tileHeight);

      state.forEach((tile) => {
        if (tile.x === 0 && tile.y === 0) {
          tile.x = tile.startX * maxX;
          tile.y = tile.startY * maxY;
        }
      });
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);

    const step = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const maxX = Math.max(10, rect.width - tileWidth);
      const maxY = Math.max(10, rect.height - tileHeight);
      const now = performance.now();

      // 1. Move and check wall bounces
      state.forEach((tile, index) => {
        tile.x += tile.vx;
        tile.y += tile.vy;

        let hit = false;

        // Bounce horizontally
        if (tile.x <= 0) {
          tile.x = 0;
          tile.vx = Math.abs(tile.vx);
          hit = true;
        } else if (tile.x >= maxX) {
          tile.x = maxX;
          tile.vx = -Math.abs(tile.vx);
          hit = true;
        }

        // Bounce vertically
        if (tile.y <= 0) {
          tile.y = 0;
          tile.vy = Math.abs(tile.vy);
          hit = true;
        } else if (tile.y >= maxY) {
          tile.y = maxY;
          tile.vy = -Math.abs(tile.vy);
          hit = true;
        }

        const el = tilesRef.current[index];
        if (el) {
          el.style.transform = `translate3d(${tile.x}px, ${tile.y}px, 0)`;
        }

        if (hit && now - lastColorChangeTime > 4000) {
          lastColorChangeTime = now;
          if (onWallHit) {
            onWallHit(tile);
          }
        }
      });

      // 2. Tile-to-Tile Collision Avoidance (prevent overlapping)
      const numTiles = state.length;
      for (let i = 0; i < numTiles; i++) {
        for (let j = i + 1; j < numTiles; j++) {
          const t1 = state[i];
          const t2 = state[j];
          const dx = (t2.x + tileWidth / 2) - (t1.x + tileWidth / 2);
          const dy = (t2.y + tileHeight / 2) - (t1.y + tileHeight / 2);
          const distSq = dx * dx + dy * dy;
          const minDist = 185; // safe distance between tile centers
          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Simple elastic separation
            const overlap = (minDist - dist) * 0.5;
            t1.x -= nx * overlap;
            t1.y -= ny * overlap;
            t2.x += nx * overlap;
            t2.y += ny * overlap;

            // Reflect velocities along normal
            const kx = t1.vx - t2.vx;
            const ky = t1.vy - t2.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;
            t1.vx -= p * nx * 0.5;
            t1.vy -= p * ny * 0.5;
            t2.vx += p * nx * 0.5;
            t2.vy += p * ny * 0.5;
          }
        }
      }

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateBounds);
    };
  }, [onWallHit]);

  return (
    <div ref={containerRef} className="hero-physics-container">
      {BOUNCING_PHYSICS_CATEGORIES.map((cat, index) => (
        <div
          key={cat.id}
          ref={(el) => (tilesRef.current[index] = el)}
          className="hero-physics-tile"
          style={{
            '--tile-color': cat.color,
            '--tile-border': cat.color,
            '--tile-glow': cat.glow
          }}
          onClick={() => {
            if (onSelectCategory) onSelectCategory(cat.id);
            const el = document.getElementById('services-catalog');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          title={`Click to explore ${cat.name}`}
        >
          <div
            className="physics-tile-icon"
            style={{
              background: cat.accentBg,
              boxShadow: `0 4px 12px ${cat.glow}`
            }}
          >
            {cat.icon}
          </div>
          <div className="physics-tile-content">
            <span className="physics-tile-title">{cat.name}</span>
            <span className="physics-tile-tag">{cat.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const ROTATING_HIGHLIGHTS = [
  'AC Repair & Servicing',
  'Deep Home Cleaning',
  'Express Goods Transport',
  'At-Home Salon & Hair Spa',
  'Tap Leak & Pipe Repair',
  'Pest Eradication & Gel Bait',
  'Doorstep Car Foam Detailing',
  'Smart Lock & CCTV Setup'
];

const INITIAL_SERVICES = cleanAndDeduplicateCatalog(DEFAULT_SERVICES.map(s => mapServiceToCanonical(s)).filter(Boolean));

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

  const [heroPalette] = useState(() => {
    return HERO_PALETTES[Math.floor(Math.random() * HERO_PALETTES.length)];
  });

  const [ambientHeroColor, setAmbientHeroColor] = useState(heroPalette);

  const handleHeroWallHit = useCallback((tile) => {
    setAmbientHeroColor({
      primary: tile.color,
      glow: tile.glow,
      gradient: `linear-gradient(135deg, ${tile.color} 0%, #2563EB 50%, #0284C7 100%)`,
      orb1: `radial-gradient(circle, ${tile.glow} 0%, transparent 70%)`,
      orb2: `radial-gradient(circle, ${tile.glow} 0%, transparent 70%)`,
      badgeColor: tile.color
    });
  }, []);

  const [highlightIndex, setHighlightIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlightIndex(prev => (prev + 1) % ROTATING_HIGHLIGHTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const [categories, setCategories] = useState(() => {
    return CANONICAL_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      active: true
    }));
  });
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [selectedCategory, setSelectedCategory] = useState(null);
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
          
          // Merge with DEFAULT_SERVICES so newly configured catalog items display even before remote DB is restarted/reseeded
          const backendNameSet = new Set(mappedServices.map(s => (s.name || '').toLowerCase().trim().replace(/\s+/g, ' ')));
          const missingDefaults = INITIAL_SERVICES.filter(d => !backendNameSet.has((d.name || '').toLowerCase().trim().replace(/\s+/g, ' ')));
          const fullCatalog = cleanAndDeduplicateCatalog([...mappedServices, ...missingDefaults]);

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
          setServices(INITIAL_SERVICES);
          const mergedCats = CANONICAL_CATEGORIES.map(canon => {
            const count = INITIAL_SERVICES.filter(s => s.canonicalCategoryId === canon.id).length;
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
        setServices(INITIAL_SERVICES);
        const mergedCats = CANONICAL_CATEGORIES.map(canon => {
          const count = INITIAL_SERVICES.filter(s => s.canonicalCategoryId === canon.id).length;
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
    const hasSearch = searchQuery.trim() !== '';
    if (hasSearch) {
      const matchesSearch = doesServiceMatch(service, searchQuery);
      if (selectedCategory) {
        const matchesCategory = (service.canonicalCategoryId === selectedCategory || service.categoryId === selectedCategory);
        return matchesSearch && matchesCategory;
      }
      return matchesSearch;
    }
    if (!selectedCategory) {
      return false;
    }
    return (service.canonicalCategoryId === selectedCategory || service.categoryId === selectedCategory);
  });

  const getCategoryTheme = (categoryIdentifier) => {
    const key = (categoryIdentifier || '').toLowerCase().trim();
    
    // 1. Appliances & Electrical
    if (key === 'appliances_electrical' || key.includes('appliance') || key.includes('electric') || key.includes('wire') || key.includes('switch') || key.includes('fan') || key.includes('geyser') || key.includes('inverter') || key.includes('microwave') || key.includes('purifier')) {
      return {
        icon: <Zap size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
        primary: '#F59E0B',
        accentBg: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
        glow: 'rgba(245, 158, 11, 0.32)',
        color: '#D97706',
        bg: 'rgba(245, 158, 11, 0.08)'
      };
    }

    // 2. Plumbing & Cleaning
    if (key === 'plumbing_cleaning' || ((key.includes('plumb') || key.includes('clean') || key.includes('drain') || key.includes('tap') || key.includes('carpet') || key.includes('sofa') || key.includes('chimney')) && !key.includes('pest'))) {
      return {
        icon: <Droplets size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
        primary: '#06B6D4',
        accentBg: 'linear-gradient(135deg, #06B6D4 0%, #0D9488 100%)',
        glow: 'rgba(6, 182, 212, 0.32)',
        color: '#0891B2',
        bg: 'rgba(6, 182, 212, 0.08)'
      };
    }

    // 3. Pest Control
    if (key === 'pest_control' || key.includes('pest') || key.includes('cockroach') || key.includes('termite') || key.includes('bed bug') || key.includes('mosquito')) {
      return {
        icon: <Bug size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=400&q=80',
        primary: '#10B981',
        accentBg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        glow: 'rgba(16, 185, 129, 0.32)',
        color: '#059669',
        bg: 'rgba(16, 185, 129, 0.08)'
      };
    }

    // 4. Salon & Massage / Wellness (Unisex)
    if (key === 'salon_wellness' || key.includes('salon') || key.includes('massage') || key.includes('wellness') || key.includes('hair') || key.includes('spa') || key.includes('facial') || key.includes('makeup') || key.includes('waxing') || key.includes('grooming')) {
      return {
        icon: <Scissors size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
        primary: '#A855F7',
        accentBg: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        glow: 'rgba(168, 85, 247, 0.32)',
        color: '#9333EA',
        bg: 'rgba(168, 85, 247, 0.08)'
      };
    }

    // 5. Civil & Property Maintenance
    if (key === 'civil_maintenance' || key.includes('civil') || key.includes('property') || key.includes('carpenter') || key.includes('wood') || key.includes('drilling') || key.includes('mason') || key.includes('roof') || key.includes('floor') || key.includes('paint')) {
      return {
        icon: <Hammer size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
        primary: '#F97316',
        accentBg: 'linear-gradient(135deg, #F97316 0%, #C2410C 100%)',
        glow: 'rgba(249, 115, 22, 0.32)',
        color: '#EA580C',
        bg: 'rgba(249, 115, 22, 0.08)'
      };
    }

    // 6. Tech & Home Automation
    if (key === 'tech_automation' || key.includes('tech') || key.includes('automation') || key.includes('laptop') || key.includes('computer') || key.includes('router') || key.includes('wifi') || key.includes('printer')) {
      return {
        icon: <Laptop size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80',
        primary: '#6366F1',
        accentBg: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        glow: 'rgba(99, 102, 241, 0.32)',
        color: '#4F46E5',
        bg: 'rgba(99, 102, 241, 0.08)'
      };
    }

    // 7. Vehicle & Auto Care
    if (key === 'vehicle_autocare' || key.includes('vehicle') || key.includes('auto care') || key.includes('car wash') || key.includes('bike wash') || key.includes('jump start') || key.includes('detailing')) {
      return {
        icon: <Car size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80',
        primary: '#0284C7',
        accentBg: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
        glow: 'rgba(2, 132, 199, 0.32)',
        color: '#0284C7',
        bg: 'rgba(2, 132, 199, 0.08)'
      };
    }

    // 8. Home Help & Errand Services
    if (key === 'home_help' || key.includes('home help') || key.includes('errand') || key.includes('maid') || key.includes('cook') || key.includes('chef') || key.includes('laundry') || key.includes('grocery') || key.includes('queue')) {
      return {
        icon: <Clock size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=400&q=80',
        primary: '#14B8A6',
        accentBg: 'linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)',
        glow: 'rgba(20, 184, 166, 0.32)',
        color: '#0D9488',
        bg: 'rgba(20, 184, 166, 0.08)'
      };
    }

    // 9. Security Services
    if (key === 'security_services' || key.includes('security') || key.includes('guard') || key.includes('cctv') || key.includes('lock')) {
      return {
        icon: <ShieldCheck size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80',
        primary: '#8B5CF6',
        accentBg: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
        glow: 'rgba(139, 92, 246, 0.32)',
        color: '#7C3AED',
        bg: 'rgba(139, 92, 246, 0.08)'
      };
    }

    // 10. Diagnostic & Healthcare Services
    if (key === 'diagnostic_healthcare' || key.includes('diagnostic') || key.includes('health') || key.includes('blood') || key.includes('doctor') || key.includes('nurse') || key.includes('checkup') || key.includes('phlebotomy') || key.includes('compounder') || key.includes('elderly')) {
      return {
        icon: <HeartPulse size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=400&q=80',
        primary: '#F43F5E',
        accentBg: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
        glow: 'rgba(244, 63, 94, 0.32)',
        color: '#E11D48',
        bg: 'rgba(244, 63, 94, 0.08)'
      };
    }

    // 11. Logistics
    if (key === 'logistics' || key.includes('logistics') || key.includes('truck') || key.includes('tempo') || key.includes('courier') || key.includes('cargo') || key.includes('freight')) {
      return {
        icon: <Truck size={24} strokeWidth={2.2} />,
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=400&q=80',
        primary: '#3B82F6',
        accentBg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        glow: 'rgba(59, 130, 246, 0.32)',
        color: '#2563EB',
        bg: 'rgba(59, 130, 246, 0.08)'
      };
    }

    return {
      icon: <Wrench size={24} strokeWidth={2.2} />,
      image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      primary: '#0284C7',
      accentBg: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
      glow: 'rgba(2, 132, 199, 0.32)',
      color: '#0284C7',
      bg: 'rgba(2, 132, 199, 0.08)'
    };
  };

const EXACT_SERVICE_IMAGES = {
  // 1. Appliances & Electrical
  'ac repair & service': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'ac repair': 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80',
  'ac installation': 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
  'ac maintenance': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  'ro water purifier service': 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80',
  'ro repair': 'https://images.unsplash.com/photo-1662647343432-a8710bfd6162?auto=format&fit=crop&w=600&q=80',
  'ro installation': 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80',
  'ro maintenance': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  'switchboard & wiring repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'switch board repair': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'ceiling & exhaust fan repair': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
  'fan repair': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
  'exhaust fan repair': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
  'geyser & water heater servicing': 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
  'inverter & battery servicing': 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80',
  'microwave & otg repair': 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
  'refrigerator repair': 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=600&q=80',
  'washing machine repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80',

  // 2. Plumbing & Cleaning
  'tap leakage & valve repair': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'tap repair': 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80',
  'pipe leakage fix': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
  'drain blockage & clog clearance': 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=600&q=80',
  'kitchen deep cleaning & chimney degreasing': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
  'sofa & carpet shampooing': 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80',
  'bathroom deep cleaning & sanitization': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'bathroom cleaning': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
  'full home cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'deep home & bathroom cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',

  // 3. Pest Control
  'general pest & cockroach control': 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  'termite & wood borer treatment': 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
  'bed bug eradication treatment': 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=600&q=80',
  'mosquito & flying insect control': 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',

  // 4. Salon & Massage / Wellness
  "men's haircut & beard styling": 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80',
  "women's haircut & hair spa": 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'at-home manicure & pedicure': 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  'full arms & legs waxing': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80',
  'bridal & party makeup at home': 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  'at-home facial & skin glow': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
  'head, neck & shoulder massage': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  'full body stress relief therapy': 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',

  // 5. Civil & Property Maintenance
  'carpentry & furniture repair': 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80',
  'furniture assembly & flatpack setup': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
  'drilling, hanging & wall mounting': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'interior wall painting & touch-up': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'interior wall painting': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'masonry & brickwork': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'waterproofing': 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80',
  'flooring & tiling': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
  'roof & terrace maintenance': 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80',
  'home renovation': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=80',
  'general civil repairs': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
  'general civil & wall repair': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',

  // 6. Tech & Home Automation
  'laptop & pc diagnostics / os setup': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  'wi-fi router & mesh network setup': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
  'smart tv & home theater wall setup': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80',
  'printer setup & troubleshooting': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80',

  // 7. Vehicle & Auto Care
  'doorstep eco car foam wash & vacuum': 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
  'doorstep bike foam wash & chain lube': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
  'deep car interior detailing & polishing': 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=600&q=80',
  'car battery jump start assistance': 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=600&q=80',

  // 8. Home Help & Errand Services
  'daily domestic helper / maid on demand': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'home chef & daily cook on demand': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80',
  'doorstep laundry & steam ironing': 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80',
  'urgent medicine & prescription delivery': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'local grocery & market pickup delivery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
  'personal errand & queue assistance': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80',

  // 9. Security Services
  'cctv installation & setup': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  'cctv installation': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80',
  'smart lock installation': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80',
  'video doorbell installation': 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80',
  'security guard service': 'https://images.unsplash.com/photo-1581568736305-49a04e012c13?auto=format&fit=crop&w=600&q=80',

  // 10. Diagnostic & Healthcare Services
  'blood test & sample collection': 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=600&q=80',
  'full body health checkup': 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
  'home diagnostic test': 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
  'compounder on call': 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
  'elderly assistance & hospital escort': 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=600&q=80',

  // 11. Logistics & Vehicles
  'mini truck goods transport': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'mini truck': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'mini truck (tata ace)': 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
  'electric bike express courier': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  'electric bike': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
  'petrol bike': 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=600&q=80',
  'express courier (local)': 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=600&q=80',
  'personal items (documents & files)': 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80',
  'electric rickshaw': 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80',
  'loading vehicle (3w)': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80',
  'loading vehicle': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
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
        serviceImage = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80';
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
        serviceImage = 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('waterproof')) {
        serviceImage = 'https://images.unsplash.com/photo-1674485169641-bcb2bf6f1df9?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('roof') || name.includes('terrace')) {
        serviceImage = 'https://images.unsplash.com/photo-1635424709845-3a85ad5e1f5e?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mason') || name.includes('brick') || name.includes('civil') || name.includes('plaster') || name.includes('renovat') || name.includes('paint')) {
        serviceImage = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('bike') || name.includes('courier') || name.includes('document') || name.includes('parcel')) {
        serviceImage = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('rickshaw') || name.includes('loading') || name.includes('3w')) {
        serviceImage = 'https://images.unsplash.com/photo-1517330357046-3ab5a5dd42a1?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('mini truck') || name.includes('tata ace') || name.includes('pickup')) {
        serviceImage = 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80';
      } else if (name.includes('truck') || name.includes('tempo') || name.includes('logistics') || name.includes('cargo') || name.includes('transport') || name.includes('freight')) {
        serviceImage = 'https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?auto=format&fit=crop&w=600&q=80';
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
                  <LayoutList size={14} />
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
              { id: 4, name: 'Deep Home & Bathroom Cleaning', category: 'Cleaning', rate: '₹1,499', status: 'AUTHORIZED', icon: <Droplets size={20} color="#10b981" /> },
              { id: 5, name: 'Mini Truck Goods Transport', category: 'Logistics', rate: '₹250', status: 'AUTHORIZED', icon: <Truck size={20} color="#a855f7" /> },
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
      {/* Dynamic Responsive Hero Section with Bouncing Category Physics */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden', minHeight: '480px' }}>
        {/* Dynamic Glowing Ambient Orbs that smoothly morph when category tiles hit walls */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div className="hero-orb-1" style={{
            position: 'absolute', top: '-10%', left: '12%', width: '520px', height: '520px',
            background: ambientHeroColor.orb1,
            borderRadius: '50%', filter: 'blur(60px)',
            transition: 'background 2s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          <div className="hero-orb-2" style={{
            position: 'absolute', bottom: '-15%', right: '10%', width: '540px', height: '540px',
            background: ambientHeroColor.orb2,
            borderRadius: '50%', filter: 'blur(70px)',
            transition: 'background 2s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          <div className="hero-grid-pattern" style={{ position: 'absolute', inset: 0 }} />
        </div>

        {/* 2D Physics Bouncing Category Tiles Engine */}
        <BouncingHeroPhysics
          onWallHit={handleHeroWallHit}
          onSelectCategory={setSelectedCategory}
        />

        {/* Hero Content Container */}
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, textAlign: 'center', padding: '2rem 1rem' }}>
          
          <div className="hero-pill-tag" style={{ margin: '0 auto 1.25rem auto' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', boxShadow: '0 0 10px var(--success)' }} />
            <span>
              Verified Service Marketplace • Real-Time Dispatch
            </span>
          </div>

          <h1 className="hero-title" style={{ maxWidth: '820px', margin: '0 auto 1.25rem auto' }}>
            On-Demand Services.<br />
            <span
              className="hero-gradient-text"
              style={{
                backgroundImage: ambientHeroColor.gradient || 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                color: ambientHeroColor.badgeColor || 'var(--primary)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Engineered for Speed.
            </span>
          </h1>

          {/* Dynamic Live Cycling Service Highlight Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 1.15rem',
            borderRadius: '999px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
            marginBottom: '1.25rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Need fast
            </span>
            <span
              key={highlightIndex}
              className="animate-fade-in"
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: ambientHeroColor.badgeColor || 'var(--primary)',
                display: 'inline-block',
                transition: 'color 1.5s ease'
              }}
            >
              {ROTATING_HIGHLIGHTS[highlightIndex]}?
            </span>
            <span style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10B981', fontWeight: 600 }}>
              Book in 60s
            </span>
          </div>

          <p className="hero-desc" style={{ maxWidth: '680px', margin: '0 auto 2rem auto' }}>
            Book verified electricians, plumbers, cleaners, wellness therapists, and logistics specialists in minutes. Upfront pricing, vetted partners, and instant doorstep scheduling.
          </p>

          {/* Hero Direct Exploration CTA Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              type="button"
              onClick={() => {
                const elem = document.getElementById('services-catalog');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary"
              style={{
                borderRadius: '999px',
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                boxShadow: `0 8px 24px ${ambientHeroColor.glow || 'rgba(56, 189, 248, 0.25)'}`,
                transition: 'all 0.3s ease'
              }}
            >
              <span>Explore Verified Services</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Authentic Core Guarantees Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.75rem',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.35rem',
            maxWidth: '820px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-main)', fontSize: '0.8125rem', fontWeight: 600 }}>
              <ShieldCheck size={16} color="var(--success)" />
              <span>Aadhaar Verified Pros</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <CreditCard size={16} color="var(--primary)" />
              <span>Upfront Fixed Quotes</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <Clock size={16} color="var(--warning)" />
              <span>Instant Doorstep Slot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <span>Job Completion Guarantee</span>
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

        {/* Category Header */}
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
              {selectedCategory ? (
                <>Selected category: <strong style={{ color: 'var(--primary)' }}>{categories.find(c => c.id === selectedCategory)?.name}</strong></>
              ) : (
                <span>Click on any category tile below to view its available services</span>
              )}
            </p>
          </div>
        </div>

        {/* Clean Responsive Category Tiles Grid with Squircle Icon Badge */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="category-tiles-grid">
            {(categories || []).map((cat) => {
              if (!cat) return null;
              const isSelected = selectedCategory === cat.id;
              const theme = getCategoryTheme(cat.id || cat.name);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(prev => prev === cat.id ? null : cat.id)}
                  className={`category-tile ${isSelected ? 'active' : ''}`}
                  style={{
                    '--tile-primary': theme.primary,
                    '--tile-glow': theme.glow
                  }}
                >
                  <div
                    className="cat-squircle-badge"
                    style={{
                      background: theme.accentBg,
                      boxShadow: `0 4px 14px ${theme.glow}`
                    }}
                  >
                    {theme.icon}
                  </div>
                  <div className="category-tile-title">
                    {cat.name || 'Category'}
                  </div>
                  {isSelected && (
                    <div className="cat-active-dot" style={{ backgroundColor: theme.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Services Grid Header */}
        {selectedCategory ? (
          <div id="services-catalog-grid-top" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', scrollMarginTop: '100px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Showing {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} in {categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
            </h3>
          </div>
        ) : searchQuery.trim() !== '' ? (
          <div id="services-catalog-grid-top" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', scrollMarginTop: '100px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 700 }}>
              Search results for "{searchQuery}" ({filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'})
            </h3>
          </div>
        ) : null}

        {/* Services Grid with Dynamic Hover */}
        {!selectedCategory && searchQuery.trim() === '' ? (
          <div className="empty-state" style={{ padding: '3.5rem 1.5rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', color: 'var(--primary)' }}>
              <Layers size={28} />
            </div>
            <h3 className="empty-state-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Select a Category to View Services
            </h3>
            <p className="empty-state-description" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
              Click on any service category tile above to view available verified professionals, transparent pricing, and instant booking options.
            </p>
          </div>
        ) : loading ? (
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
                const priceUnit = service.pricingType === 'HOURLY' ? '/ hr' : '';
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
              onPageChange={(newPage) => {
                setServicesPage(newPage);
                const target = document.getElementById('services-catalog-grid-top') || document.getElementById('services-catalog');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            />
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* HOW TAASKR WORKS — 3 STEP SEAMLESS EXECUTION                             */}
      {/* ========================================================================= */}
      <section style={{ backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '4.5rem 1rem' }}>
        <div className="app-container">
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem auto' }}>
            <div className="hero-pill-tag" style={{ margin: '0 auto 1rem auto' }}>
              <Award size={14} color="var(--primary)" />
              <span>Simple 3-Step Experience</span>
            </div>
            <h2 style={{ fontSize: '2.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
              How Taaskr Works
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              From instant request to verified doorstep service delivery with complete transparency at every stage.
            </p>
          </div>

          {/* 3 Step Workflow Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {/* Step 1 */}
            <div className="yc-architecture-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={22} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.4 }}>01</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Select Your Service
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Explore verified home, wellness, or logistics categories with upfront transparent quotes and zero hidden charges.
              </p>
            </div>

            {/* Step 2 */}
            <div className="yc-architecture-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={22} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.4 }}>02</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Doorstep Partner Arrival
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                A background-verified professional arrives at your preferred slot equipped with standardized equipment and original spares.
              </p>
            </div>

            {/* Step 3 */}
            <div className="yc-architecture-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={22} />
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', opacity: 0.4 }}>03</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Inspect & Pay Securely
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Review the completed job, verify satisfaction, and pay seamlessly via UPI, Debit/Credit Cards, or Cash on Delivery.
              </p>
            </div>
          </div>

          {/* Genuine Trust Features Strip */}
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Escrow & Safe Payments</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>UPI, Cards, and Net Banking</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Standardized Pricing</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Fixed digital rate cards</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Phone size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Dedicated Support</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time admin assistance</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

