// Plumbing & Cleaning Services & Variant Catalog

export const PLUMBING_CLEANING_SERVICES = [
  // =========================================================================
  // CLEANING SERVICES
  // =========================================================================
  {
    id: 'bathroom_cleaning',
    name: 'Bathroom Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 399,
    description: 'Deep tile scrubbing, lime stain removal, hard water descaling, and sanitaryware disinfection.',
    image: '/bathroom-cleaning.jpg',
    images: ['/bathroom-cleaning.jpg'],
    options: [
      {
        id: 'bath_basic',
        name: 'Basic Bathroom Cleaning',
        price: 399,
        duration: '30–45 min',
        description: 'Sanitaryware scrubbing, mirror wipe, floor mopping & light descaling.'
      },
      {
        id: 'bath_deep',
        name: 'Deep Bathroom Cleaning',
        price: 599,
        duration: '45–60 min',
        description: 'Hard water stain removal, grout scrub, shower panel descaling & full sanitization.'
      },
      {
        id: 'bath_intensive',
        name: 'Intensive Bathroom Cleaning',
        price: 799,
        duration: '60–90 min',
        description: 'High-pressure steam sanitization, chemical stain extraction, exhaust fan & tile degreasing.'
      }
    ]
  },
  {
    id: 'full_home_cleaning',
    name: 'Full Home Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 1499,
    description: 'Complete multi-room deep cleaning, floor scrubbing, furniture dusting, and sanitization.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'home_1bhk',
        name: '1 BHK Full Home Cleaning',
        price: 1499,
        duration: '2–3 hrs',
        description: 'Complete deep cleaning for 1 Bedroom, 1 Hall, Kitchen & 1 Bathroom.'
      },
      {
        id: 'home_2bhk',
        name: '2 BHK Full Home Cleaning',
        price: 2499,
        duration: '3–4 hrs',
        description: 'Complete deep cleaning for 2 Bedrooms, 1 Hall, Kitchen & 2 Bathrooms.'
      },
      {
        id: 'home_3bhk',
        name: '3 BHK Full Home Cleaning',
        price: 3499,
        duration: '4–5 hrs',
        description: 'Complete deep cleaning for 3 Bedrooms, 1 Hall, Kitchen & 3 Bathrooms.'
      },
      {
        id: 'home_4bhk',
        name: '4 BHK+ Full Home Cleaning',
        price: 4499,
        duration: '5–6 hrs',
        description: 'Comprehensive deep cleaning for 4+ Bedrooms, Hall, Kitchen, Balconies & Bathrooms.'
      }
    ]
  },
  {
    id: 'kitchen_cleaning',
    name: 'Kitchen Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Thorough oil degreasing, counter scrub, cabinet exterior wipe, and sink sanitization.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'kitchen_basic',
        name: 'Basic Kitchen Cleaning',
        price: 499,
        duration: '45–60 min',
        description: 'Countertop wiping, stove top scrub, sink sanitization & floor mop.'
      },
      {
        id: 'kitchen_deep',
        name: 'Deep Kitchen Cleaning',
        price: 799,
        duration: '60–90 min',
        description: 'Oil stain degreasing, tile scrub, cabinet exterior wipe & appliance surface cleaning.'
      },
      {
        id: 'kitchen_intensive',
        name: 'Intensive Kitchen Cleaning',
        price: 1199,
        duration: '90–120 min',
        description: 'Full interior/exterior cabinet degreasing, chimney exterior, exhaust fan & window scrub.'
      }
    ]
  },
  {
    id: 'sofa_cleaning',
    name: 'Sofa Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Deep cleaning and stain treatment for fabric, suede, and upholstered sofas.',
    image: '/carpet-cleaning.jpg',
    images: ['/carpet-cleaning.jpg'],
    options: [
      {
        id: 'sofa_1_2',
        name: '1–2 Seater Sofa Cleaning',
        price: 499,
        duration: '30–45 min',
        description: 'High-suction vacuuming, stain treatment & wet extraction shampooing for 1-2 seater sofas.'
      },
      {
        id: 'sofa_3',
        name: '3 Seater Sofa Cleaning',
        price: 699,
        duration: '45–60 min',
        description: 'Foam extraction cleaning and fabric sanitization for 3-seater sofas.'
      },
      {
        id: 'sofa_4_5',
        name: '4–5 Seater Sofa Cleaning',
        price: 999,
        duration: '60–90 min',
        description: 'Deep shampoo extraction and deodorization for 4 to 5 seater couch sets.'
      },
      {
        id: 'sofa_l_shaped',
        name: 'L-Shaped Sofa Cleaning',
        price: 1299,
        duration: '90–120 min',
        description: 'Intensive deep cleaning for sectional and L-shaped upholstered sofas.'
      }
    ]
  },
  {
    id: 'carpet_cleaning',
    name: 'Carpet Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 399,
    description: 'Deep carpet cleaning to remove dust, tough stains, allergens, and accumulated dirt.',
    image: '/carpet-cleaning.jpg',
    images: ['/carpet-cleaning.jpg'],
    options: [
      {
        id: 'carpet_small',
        name: 'Small Carpet (up to 3x5 ft)',
        price: 399,
        duration: '30–45 min',
        description: 'Dry vacuuming, spot stain treatment & wet extraction shampooing for small carpets.'
      },
      {
        id: 'carpet_medium',
        name: 'Medium Carpet (up to 5x7 ft)',
        price: 599,
        duration: '45–60 min',
        description: 'Deep foam shampooing and fiber sanitization for medium living room rugs.'
      },
      {
        id: 'carpet_large',
        name: 'Large Carpet (up to 8x10 ft)',
        price: 899,
        duration: '60–90 min',
        description: 'Heavy-duty extraction cleaning for large area carpets and wool rugs.'
      },
      {
        id: 'carpet_xlarge',
        name: 'Extra Large Carpet (10x12+ ft)',
        price: 1199,
        duration: '90–120 min',
        description: 'Comprehensive steam extraction and allergen sanitization for wall-to-wall carpets.'
      }
    ]
  },
  {
    id: 'mattress_cleaning',
    name: 'Mattress Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 399,
    description: 'Professional mattress cleaning, dust mite extraction, and deep sanitization.',
    image: '/carpet-cleaning.jpg',
    images: ['/carpet-cleaning.jpg'],
    options: [
      {
        id: 'matt_single',
        name: 'Single Mattress Cleaning',
        price: 399,
        duration: '30–45 min',
        description: 'UV sanitization, dust mite vacuuming & foam spot cleaning for single mattress.'
      },
      {
        id: 'matt_double',
        name: 'Double Mattress Cleaning',
        price: 599,
        duration: '45–60 min',
        description: 'Deep extraction shampooing and anti-allergen treatment for double mattress.'
      },
      {
        id: 'matt_queen',
        name: 'Queen Mattress Cleaning',
        price: 799,
        duration: '60–75 min',
        description: 'Two-sided wet extraction and deodorizing treatment for queen mattresses.'
      },
      {
        id: 'matt_king',
        name: 'King Mattress Cleaning',
        price: 999,
        duration: '75–90 min',
        description: 'Intensive stain removal, steam extraction & sanitization for king size mattresses.'
      }
    ]
  },
  {
    id: 'floor_deep_cleaning',
    name: 'Floor Deep Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 799,
    description: 'Deep cleaning and scrubbing for tiled, marble, granite, and hardwood residential flooring.',
    image: '/bathroom-cleaning.jpg',
    images: ['/bathroom-cleaning.jpg'],
    options: [
      {
        id: 'floor_500',
        name: 'Up to 500 sq.ft Floor Scrubbing',
        price: 799,
        duration: '60–90 min',
        description: 'Single-disc rotary floor scrubbing, grout line cleaning & buffing for small flats.'
      },
      {
        id: 'floor_1000',
        name: '500–1000 sq.ft Floor Scrubbing',
        price: 1299,
        duration: '90–120 min',
        description: 'Mechanized floor scrubbing and chemical stain removal for 2 BHK homes.'
      },
      {
        id: 'floor_1500',
        name: '1000–1500 sq.ft Floor Scrubbing',
        price: 1799,
        duration: '2–3 hrs',
        description: 'Heavy duty tile grout restoration and floor polishing for 3 BHK homes.'
      },
      {
        id: 'floor_1500_plus',
        name: '1500+ sq.ft Floor Scrubbing',
        price: 2499,
        duration: '3–4 hrs',
        description: 'Complete floor machine scrubbing and sealant buffing for large villas and offices.'
      }
    ]
  },
  {
    id: 'window_glass_cleaning',
    name: 'Window & Glass Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 399,
    description: 'Professional streak-free cleaning for glass windows, sliders, mirror panels, and frames.',
    image: '/bathroom-cleaning.jpg',
    images: ['/bathroom-cleaning.jpg'],
    options: [
      {
        id: 'win_small',
        name: 'Small Set (Up to 4 Windows)',
        price: 399,
        duration: '45–60 min',
        description: 'Frame wiping, glass squeegee cleaning & dust removal for up to 4 windows.'
      },
      {
        id: 'win_medium',
        name: 'Medium Set (5–8 Windows)',
        price: 699,
        duration: '60–90 min',
        description: 'Streak-free chemical cleaning for up to 8 balcony and room windows.'
      },
      {
        id: 'win_large',
        name: 'Large Set (9–12 Windows)',
        price: 999,
        duration: '90–120 min',
        description: 'Comprehensive glass panel, track vacuuming & frame washing for up to 12 windows.'
      },
      {
        id: 'win_full_home',
        name: 'Full Home Windows (12+ Windows)',
        price: 1499,
        duration: '2–3 hrs',
        description: 'Complete interior/exterior window glass, slider track & mesh cleaning for whole house.'
      }
    ]
  },
  {
    id: 'water_tank_cleaning',
    name: 'Water Tank Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Deep sludge removal, high-pressure washing, and antibacterial treatment for storage water tanks.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'tank_500',
        name: 'Overhead Tank (Up to 500 L)',
        price: 499,
        duration: '45–60 min',
        description: 'Dewatering, sludge vacuuming, pressure wash & UV sanitization for 500L tank.'
      },
      {
        id: 'tank_1000',
        name: 'Overhead Tank (500–1000 L)',
        price: 799,
        duration: '60–90 min',
        description: 'Submersible dewatering, wall scrub, vacuuming & chlorine disinfectant for 1000L tank.'
      },
      {
        id: 'tank_2000',
        name: 'Overhead Tank (1000–2000 L)',
        price: 1199,
        duration: '90–120 min',
        description: 'Intensive sludge removal, anti-bacterial spray & high pressure jet wash for 2000L tank.'
      },
      {
        id: 'tank_underground',
        name: 'Underground Sump / Tank (2000+ L)',
        price: 1699,
        duration: '2–3 hrs',
        description: 'Complete underground sump cleaning, manual wall scrubbing & antibacterial fogging.'
      }
    ]
  },
  {
    id: 'chimney_cleaning',
    name: 'Chimney Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Degreasing and deep cleaning of kitchen chimney baffle filters, mesh, and ducting.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'chim_basic',
        name: 'Basic Chimney Cleaning',
        price: 499,
        duration: '45–60 min',
        description: 'Baffle filter removal, caustic degreasing soak & outer body polish.'
      },
      {
        id: 'chim_deep',
        name: 'Deep Degreasing Service',
        price: 799,
        duration: '60–90 min',
        description: 'Blower fan disassembling, oil collector tray degreasing & suction motor check.'
      },
      {
        id: 'chim_intensive',
        name: 'Intensive Cleaning & Duct Scrub',
        price: 1099,
        duration: '90–120 min',
        description: 'Full chimney dismantling, carbon residue removal & duct pipe cleaning.'
      }
    ]
  },
  {
    id: 'move_in_cleaning',
    name: 'Move-In Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 1999,
    description: 'Comprehensive pre-occupancy deep sanitization for newly rented or purchased properties.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'move_in_1bhk',
        name: '1 BHK Move-In Cleaning',
        price: 1999,
        duration: '3–4 hrs',
        description: 'Full house deep scrub, cabinet interior wiping, floor buffing & sanitization.'
      },
      {
        id: 'move_in_2bhk',
        name: '2 BHK Move-In Cleaning',
        price: 2999,
        duration: '4–5 hrs',
        description: 'Complete 2 BHK pre-move deep sanitization including kitchen & bathrooms.'
      },
      {
        id: 'move_in_3bhk',
        name: '3 BHK Move-In Cleaning',
        price: 3999,
        duration: '5–6 hrs',
        description: 'Detailed 3 BHK move-in cleaning covering all rooms, balconies & fixtures.'
      },
      {
        id: 'move_in_4bhk',
        name: '4 BHK+ Villa Move-In Cleaning',
        price: 5499,
        duration: '6–8 hrs',
        description: 'Extensive villa move-in deep cleaning with floor machine scrubbing.'
      }
    ]
  },
  {
    id: 'move_out_cleaning',
    name: 'Move-Out Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 1999,
    description: 'End-of-tenancy deep cleaning to ensure full security deposit returns.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'move_out_1bhk',
        name: '1 BHK Move-Out Cleaning',
        price: 1999,
        duration: '3–4 hrs',
        description: 'Thorough end-of-tenancy scrub for 1 BHK flats to guarantee deposit refund.'
      },
      {
        id: 'move_out_2bhk',
        name: '2 BHK Move-Out Cleaning',
        price: 2999,
        duration: '4–5 hrs',
        description: 'Deep move-out cleaning for 2 BHK flats covering kitchen oil removal & bathrooms.'
      },
      {
        id: 'move_out_3bhk',
        name: '3 BHK Move-Out Cleaning',
        price: 3999,
        duration: '5–6 hrs',
        description: 'Comprehensive 3 BHK tenancy handover cleaning service.'
      },
      {
        id: 'move_out_4bhk',
        name: '4 BHK+ Move-Out Cleaning',
        price: 5499,
        duration: '6–8 hrs',
        description: 'Large home & duplex move-out deep cleaning with trash disposal.'
      }
    ]
  },
  {
    id: 'post_construction_cleaning',
    name: 'Post-Construction Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 3499,
    description: 'Removal of cement spatter, paint stains, drywall dust, and renovation debris.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'post_small',
        name: 'Small Property (< 1000 sq.ft)',
        price: 3499,
        duration: '4–5 hrs',
        description: 'Paint & cement stain scraping, window track clearing & floor machine scrubbing.'
      },
      {
        id: 'post_medium',
        name: 'Medium Property (1000–2000 sq.ft)',
        price: 5499,
        duration: '5–7 hrs',
        description: 'Heavy duty post-renovation dust extraction, tile acid wash & fixture polishing.'
      },
      {
        id: 'post_large',
        name: 'Large Property (2000–3500 sq.ft)',
        price: 7999,
        duration: '7–9 hrs',
        description: 'Full post-construction deep clean for large homes, duplexes & offices.'
      },
      {
        id: 'post_commercial',
        name: 'Commercial Site (3500+ sq.ft)',
        price: 11999,
        duration: '10+ hrs',
        description: 'Industrial scale post-construction debris cleanup & mechanized floor scrub.'
      }
    ]
  },
  {
    id: 'office_cleaning',
    name: 'Office Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 1999,
    description: 'Professional commercial space cleaning, workstation sanitization, and pantry maintenance.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'off_small',
        name: 'Small Office (< 1000 sq.ft)',
        price: 1999,
        duration: '2–3 hrs',
        description: 'Desk wipe down, glass door cleaning, floor mop & washroom sanitization.'
      },
      {
        id: 'off_medium',
        name: 'Medium Office (1000–2500 sq.ft)',
        price: 3499,
        duration: '3–5 hrs',
        description: 'Workstation sanitization, carpet vacuuming, pantry scrub & floor buffer.'
      },
      {
        id: 'off_large',
        name: 'Large Office (2500–5000 sq.ft)',
        price: 5999,
        duration: '5–7 hrs',
        description: 'Deep commercial office cleaning, conference room & executive space polishing.'
      }
    ]
  },
  {
    id: 'commercial_deep_cleaning',
    name: 'Commercial Deep Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 2999,
    description: 'Specialized deep cleaning for retail stores, restaurants, showrooms, and warehouses.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'comm_retail',
        name: 'Retail Shop / Showroom',
        price: 2999,
        duration: '3–4 hrs',
        description: 'Display window squeegee wash, floor machine scrub & fitting room sanitization.'
      },
      {
        id: 'comm_restaurant',
        name: 'Restaurant / Cloud Kitchen',
        price: 4999,
        duration: '4–6 hrs',
        description: 'Commercial kitchen degreasing, drain clearance, exhaust hood & floor sanitization.'
      },
      {
        id: 'comm_warehouse',
        name: 'Warehouse / Industrial Space',
        price: 7999,
        duration: '6–8 hrs',
        description: 'High-ceiling dust removal, industrial floor scrubbing & loading bay cleanup.'
      }
    ]
  },

  // =========================================================================
  // PLUMBING SERVICES
  // =========================================================================
  {
    id: 'pipe_leakage_fix',
    name: 'Pipe Leakage Fix',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Detection and repair of concealed or open pipeline leaks, joints, and burst pipes.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'pipe_minor',
        name: 'Minor Pipe Leakage',
        price: 299,
        duration: '30–45 min',
        description: 'Exposed pipe joint sealing, washer replacement & Teflon tape patching.'
      },
      {
        id: 'pipe_standard',
        name: 'Standard Leakage Repair',
        price: 499,
        duration: '45–60 min',
        description: 'CPVC/GI pipe section replacement, coupling fitting & pressure leak fix.'
      },
      {
        id: 'pipe_major',
        name: 'Major Leakage / Wall Inspection',
        price: 799,
        duration: '60–90 min',
        description: 'Concealed wall pipe leak detection, masonry chipping & heavy pipe welding.'
      }
    ]
  },
  {
    id: 'tap_repair',
    name: 'Tap Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 199,
    description: 'Fixing dripping taps, broken spindle valves, water pressure drops, and leaks.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'tap_repair_basic',
        name: 'Standard Tap Repair',
        price: 199,
        duration: '30–45 min',
        description: 'Spindle replacement, rubber washer change & thread leak repair.'
      },
      {
        id: 'tap_replacement',
        name: 'Tap Replacement / Fitting',
        price: 299,
        duration: '30–45 min',
        description: 'Dismantling old faucet and installing new bib cock or pillar tap.'
      },
      {
        id: 'tap_mixer_repair',
        name: 'Mixer Tap Repair',
        price: 399,
        duration: '45–60 min',
        description: 'Hot & cold wall mixer cartridge repair, diverter fix & pressure restoration.'
      }
    ]
  },
  {
    id: 'basin_repair',
    name: 'Basin Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Repair of washbasin leakages, bottle trap clogs, and pedestal fittings.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'basin_leak',
        name: 'Basin Leakage Repair',
        price: 299,
        duration: '30–45 min',
        description: 'Waste coupling re-sealing, inlet pipe gasket change & leak fix.'
      },
      {
        id: 'basin_drain',
        name: 'Basin Drainage Repair',
        price: 349,
        duration: '30–45 min',
        description: 'Bottle trap cleaning, flexible waste pipe replacement & clog clearance.'
      },
      {
        id: 'basin_replace',
        name: 'Basin Replacement / Fitting',
        price: 499,
        duration: '45–60 min',
        description: 'Dismantling damaged basin and wall-mounting new wash basin unit.'
      }
    ]
  },
  {
    id: 'sink_repair',
    name: 'Sink Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Repair of kitchen sink leakage, waste coupling, drainage jams, and fittings.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'sink_leak',
        name: 'Sink Leakage Repair',
        price: 299,
        duration: '30–45 min',
        description: 'Under-sink waste coupling sealant application & pipe joint tightening.'
      },
      {
        id: 'sink_drain',
        name: 'Sink Drainage Repair',
        price: 349,
        duration: '30–45 min',
        description: 'Kitchen sink pipe clearing, food trap descaling & drain hose change.'
      },
      {
        id: 'sink_install',
        name: 'Sink Replacement / Installation',
        price: 599,
        duration: '45–60 min',
        description: 'Granite counter sink cutout fitting, waste coupling & faucet plumbing.'
      }
    ]
  },
  {
    id: 'toilet_repair',
    name: 'Toilet Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 349,
    description: 'Western and Indian toilet leakage repair, flush mechanism, and jet spray fixes.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'toilet_leak',
        name: 'Toilet Leakage Repair',
        price: 349,
        duration: '30–45 min',
        description: 'Base wax ring seal replacement, inlet pipe leak fix & gasket change.'
      },
      {
        id: 'toilet_flush',
        name: 'Flush Repair',
        price: 399,
        duration: '30–45 min',
        description: 'Cistern flush handle valve change, ball cock adjustment & siphon repair.'
      },
      {
        id: 'toilet_fitting',
        name: 'Toilet Fitting Repair',
        price: 499,
        duration: '45–60 min',
        description: 'Health faucet jet spray replacement, angle valve fitting & seat cover fix.'
      }
    ]
  },
  {
    id: 'flush_tank_repair',
    name: 'Flush Tank Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Concealed and wall-mounted flush tank mechanism repair and valve replacement.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'flush_valve',
        name: 'Flush Valve Repair',
        price: 299,
        duration: '30–45 min',
        description: 'Inlet fill valve cleaning, washer change & overflow leak fix.'
      },
      {
        id: 'flush_mechanism',
        name: 'Flush Mechanism Replacement',
        price: 499,
        duration: '45–60 min',
        description: 'Complete push button flush tower mechanism installation.'
      },
      {
        id: 'flush_full_service',
        name: 'Full Flush Tank Service',
        price: 699,
        duration: '60–90 min',
        description: 'Concealed cistern tank descaling, internal valve & float replacement.'
      }
    ]
  },
  {
    id: 'drainage_blockage_removal',
    name: 'Drainage & Blockage Removal',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Mechanical clearing of blocked sinks, bathroom floor drains, and main sewer pipes.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'drain_sink',
        name: 'Sink Blockage Removal',
        price: 299,
        duration: '30–45 min',
        description: 'Kitchen or bathroom sink drain pipe clearing & grease removal.'
      },
      {
        id: 'drain_bath',
        name: 'Bathroom Drain Blockage',
        price: 399,
        duration: '45–60 min',
        description: 'Floor trap hair & soap scum mechanical spring clearing.'
      },
      {
        id: 'drain_kitchen',
        name: 'Kitchen Main Drain Blockage',
        price: 449,
        duration: '45–60 min',
        description: 'Heavy grease & food waste pipe clog rodding clearance.'
      },
      {
        id: 'drain_inspection',
        name: 'Main Drain & Sewer Line Inspection',
        price: 699,
        duration: '60–90 min',
        description: 'High-pressure water jetting & main chamber obstruction removal.'
      }
    ]
  },
  {
    id: 'water_pipeline_repair',
    name: 'Water Pipeline Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Repair and replacement of main water supply lines, riser pipes, and fittings.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'line_minor',
        name: 'Minor Pipeline Repair',
        price: 499,
        duration: '45–60 min',
        description: 'CPVC / GI pipe joint solvent welding & localized leak repair.'
      },
      {
        id: 'line_leakage',
        name: 'Main Line Leakage Repair',
        price: 799,
        duration: '60–90 min',
        description: 'Underground or shaft riser pipe section cutting & new coupling fitting.'
      },
      {
        id: 'line_replacement',
        name: 'Pipeline Replacement / Inspection',
        price: 1299,
        duration: '90–120 min',
        description: 'Overhead to main bathroom supply line replacement & pressure test.'
      }
    ]
  },
  {
    id: 'water_tank_plumbing',
    name: 'Water Tank Plumbing',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Installation and repair of water tank inlet, outlet, float valves, and overflow pipes.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'tank_pipe_repair',
        name: 'Tank Inlet/Outlet Pipe Repair',
        price: 499,
        duration: '45–60 min',
        description: 'Tank nipple fitting replacement & ball valve leak fix.'
      },
      {
        id: 'tank_float_valve',
        name: 'Automatic Float Valve Installation',
        price: 599,
        duration: '45–60 min',
        description: 'Heavy duty brass/plastic float ball valve fitting to prevent tank overflow.'
      },
      {
        id: 'tank_plumb_overhaul',
        name: 'Complete Tank Plumbing Overhaul',
        price: 1199,
        duration: '90–120 min',
        description: 'Air vent pipe, bypass connection & new ball valve manifold installation.'
      }
    ]
  },
  {
    id: 'shower_repair',
    name: 'Shower Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 249,
    description: 'Shower head descaling, wall arm replacement, and diverter valve repair.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'shower_head_repair',
        name: 'Shower Head Repair & Descaling',
        price: 249,
        duration: '30–45 min',
        description: 'Hard water salt removal, nozzle unblocking & washer fitting.'
      },
      {
        id: 'shower_replacement',
        name: 'Shower Replacement / Fitting',
        price: 349,
        duration: '30–45 min',
        description: 'Dismantling old shower and mounting new overhead/handheld shower.'
      },
      {
        id: 'shower_combo_repair',
        name: 'Mixer / Shower Diverter Repair',
        price: 499,
        duration: '45–60 min',
        description: 'Concealed thermostatic diverter cartridge change & wall arm fix.'
      }
    ]
  },
  {
    id: 'mixer_tap_repair',
    name: 'Mixer Tap Repair',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 349,
    description: 'Repair of hot & cold water wall mixers, counter basin mixers, and cartridges.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'mixer_repair_basic',
        name: 'Mixer Tap Leak Repair',
        price: 349,
        duration: '30–45 min',
        description: 'Gasket seal change, aerator descaling & leg connector leak repair.'
      },
      {
        id: 'mixer_cartridge',
        name: 'Cartridge Replacement',
        price: 449,
        duration: '30–45 min',
        description: 'Ceramic disc internal cartridge extraction & brand match replacement.'
      },
      {
        id: 'mixer_replacement',
        name: 'Mixer Tap Replacement',
        price: 599,
        duration: '45–60 min',
        description: 'Dismantling old unit and wall-mounting new hot/cold mixer faucet.'
      }
    ]
  },
  {
    id: 'bathroom_fitting_installation',
    name: 'Bathroom Fitting Installation',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 249,
    description: 'Installation of towel rods, soap dispensers, mirror cabinets, taps, and accessories.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'fit_tap',
        name: 'Tap / Faucet Installation',
        price: 249,
        duration: '30–45 min',
        description: 'Single tap, angle valve or health faucet wall installation.'
      },
      {
        id: 'fit_shower',
        name: 'Shower / Rail Installation',
        price: 349,
        duration: '30–45 min',
        description: 'Overhead shower arm or hand shower sliding rail mounting.'
      },
      {
        id: 'fit_basin',
        name: 'Basin / Cabinet Mounting',
        price: 499,
        duration: '45–60 min',
        description: 'Countertop basin, mirror cabinet or towel rack mounting.'
      },
      {
        id: 'fit_multiple',
        name: 'Multiple Bathroom Fittings (Set of 4+)',
        price: 899,
        duration: '60–90 min',
        description: 'Complete bathroom accessory set mounting (towel rod, soap dish, mirror, hooks).'
      }
    ]
  },
  {
    id: 'kitchen_plumbing',
    name: 'Kitchen Plumbing',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Kitchen sink installation, dishwasher inlet/outlet plumbing, and water purifier connections.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'kitch_sink_leak',
        name: 'Sink Leakage Repair',
        price: 299,
        duration: '30–45 min',
        description: 'Waste coupling sealing & PVC waste pipe joint leak fix.'
      },
      {
        id: 'kitch_tap_install',
        name: 'Kitchen Tap / Sink Mixer Fitting',
        price: 299,
        duration: '30–45 min',
        description: 'Swivel spout tap or sink mixer mounting & connection.'
      },
      {
        id: 'kitch_sink_install',
        name: 'Sink Unit Installation',
        price: 499,
        duration: '45–60 min',
        description: 'Single/double bowl stainless steel sink waste line plumbing.'
      },
      {
        id: 'kitch_full_inspect',
        name: 'Complete Kitchen Plumbing Inspection',
        price: 799,
        duration: '60–90 min',
        description: 'RO connection, dishwasher line, sink drain & main pipe check.'
      }
    ]
  },
  {
    id: 'geyser_plumbing',
    name: 'Geyser Plumbing',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 349,
    description: 'Geyser inlet & outlet pipe connection, safety valve fitting, and connection leak repairs.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'geys_leak',
        name: 'Geyser Connection Leak Repair',
        price: 349,
        duration: '30–45 min',
        description: 'Braided flexible hose replacement & angle valve washer change.'
      },
      {
        id: 'geys_connect',
        name: 'Geyser Inlet / Outlet Connection',
        price: 399,
        duration: '30–45 min',
        description: 'Connecting hot & cold water braided pipes with Teflon sealing.'
      },
      {
        id: 'geys_inspect',
        name: 'Geyser Plumbing Inspection',
        price: 499,
        duration: '45–60 min',
        description: 'Pressure relief valve installation & water heater pipe line check.'
      }
    ]
  },
  {
    id: 'toilet_installation',
    name: 'Toilet Installation',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 999,
    description: 'Installation and replacement of western commodes, wall-hung toilets, and Indian pans.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'toil_new_install',
        name: 'New Toilet Commode Installation',
        price: 999,
        duration: '60–90 min',
        description: 'Floor-mounted western commode fitting, wax ring seal & waste pipe connect.'
      },
      {
        id: 'toil_replacement',
        name: 'Toilet Replacement (Remove + Fit)',
        price: 1299,
        duration: '90–120 min',
        description: 'Dismantling old commode and installing new ceramic toilet unit.'
      },
      {
        id: 'toil_wall_hung',
        name: 'Wall-Hung Toilet + Concealed Tank',
        price: 1699,
        duration: '120–150 min',
        description: 'Frame mounting, concealed cistern installation & flush plate fitting.'
      }
    ]
  },
  {
    id: 'wash_basin_installation',
    name: 'Wash Basin Installation',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Pedestal basin, tabletop basin, and wall-mounted washbasin installation.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'basin_standard_install',
        name: 'Wash Basin Installation',
        price: 499,
        duration: '45–60 min',
        description: 'Wall rag bolt drilling, ceramic basin mounting & waste coupling seal.'
      },
      {
        id: 'basin_plus_tap',
        name: 'Basin + Tap Installation',
        price: 699,
        duration: '60–75 min',
        description: 'Basin mounting + pillar tap fitting & braided connection pipe line.'
      },
      {
        id: 'basin_complete',
        name: 'Basin + Complete Plumbing Setup',
        price: 999,
        duration: '75–90 min',
        description: 'Countertop vessel basin cutout fitting, bottle trap & mirror alignment.'
      }
    ]
  },
  {
    id: 'tap_installation',
    name: 'Tap Installation',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 199,
    description: 'Installation of bib cocks, pillar taps, sink mixers, angle valves, and spray jets.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'tap_inst_std',
        name: 'Standard Tap / Angle Valve Fitting',
        price: 199,
        duration: '30–45 min',
        description: 'Single tap or angle cock fitting with Teflon sealing.'
      },
      {
        id: 'tap_inst_mixer',
        name: 'Mixer Tap Installation',
        price: 349,
        duration: '30–45 min',
        description: 'Wall mixer or deck-mounted sink mixer installation.'
      },
      {
        id: 'tap_inst_multi',
        name: 'Multiple Tap Installation (3+ Taps)',
        price: 599,
        duration: '45–60 min',
        description: 'Installation of 3 or more taps/faucets across kitchen & bathrooms.'
      }
    ]
  },
  {
    id: 'emergency_plumbing',
    name: 'Emergency Plumbing',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 499,
    description: 'Priority rapid dispatch for urgent pipe bursts, heavy water leaks, and severe blockages.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'emg_leak',
        name: 'Emergency Pipe Leakage Dispatch',
        price: 499,
        duration: '30–45 min',
        description: 'Immediate technician arrival for main line burst pipe or valve failure.'
      },
      {
        id: 'emg_block',
        name: 'Emergency Overflow Blockage',
        price: 599,
        duration: '45–60 min',
        description: 'Urgent drain clog clearance to prevent room flooding.'
      },
      {
        id: 'emg_inspect',
        name: 'Urgent Plumbing Inspection & Containment',
        price: 699,
        duration: '30–45 min',
        description: 'Priority diagnostic inspection & main water valve shutdown containment.'
      }
    ]
  }
];
