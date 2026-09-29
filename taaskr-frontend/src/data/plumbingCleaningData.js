// Plumbing & Cleaning Services — Structured Umbrella Catalog

export const PLUMBING_CLEANING_SERVICES = [
  // 1. Home & Full House Cleaning
  {
    id: 'full_home_cleaning_umbrella',
    name: 'Home & Full House Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 999,
    description: 'Complete multi-room deep cleaning, move-in/move-out pre-occupancy sanitization, and floor scrubbing.',
    image: '/home-full-cleaning.jpg',
    images: ['/home-full-cleaning.jpg'],
    options: [
      {
        id: 'home_1bhk',
        name: '1 BHK Full Home Cleaning',
        price: 999,
        duration: '2–3 hrs',
        description: 'Complete deep cleaning for 1 Bedroom, 1 Hall, Kitchen & 1 Bathroom.'
      },
      {
        id: 'home_2bhk',
        name: '2 BHK Full Home Cleaning',
        price: 1699,
        duration: '3–4 hrs',
        description: 'Complete deep cleaning for 2 Bedrooms, 1 Hall, Kitchen & 2 Bathrooms.'
      },
      {
        id: 'home_3bhk',
        name: '3 BHK Full Home Cleaning',
        price: 2499,
        duration: '4–5 hrs',
        description: 'Complete deep cleaning for 3 Bedrooms, 1 Hall, Kitchen & 3 Bathrooms.'
      },
      {
        id: 'home_4bhk',
        name: '4 BHK+ Full Home Cleaning',
        price: 3299,
        duration: '5–6 hrs',
        description: 'Comprehensive deep cleaning for 4+ Bedrooms, Hall, Kitchen & Bathrooms.'
      },
      {
        id: 'move_in_cleaning',
        name: 'Move-In Deep Sanitization',
        price: 1299,
        duration: '3–4 hrs',
        description: 'Pre-occupancy deep sanitization for newly rented/purchased homes.'
      },
      {
        id: 'move_out_cleaning',
        name: 'Move-Out End-of-Tenancy Cleaning',
        price: 1299,
        duration: '3–4 hrs',
        description: 'End-of-tenancy deep cleaning to ensure full security deposit refunds.'
      }
    ]
  },

  // 2. Kitchen & Chimney Cleaning
  {
    id: 'kitchen_chimney_umbrella',
    name: 'Kitchen & Chimney Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 399,
    description: 'Oil stain degreasing, chimney filter & duct scrub, gas stove cleaning, and sink sanitization.',
    image: '/kitchen-cleaning.jpg',
    images: ['/kitchen-cleaning.jpg'],
    options: [
      {
        id: 'kitchen_basic',
        name: 'Basic Kitchen Cleaning',
        price: 399,
        duration: '45–60 min',
        description: 'Countertop wiping, stove top scrub, sink sanitization & floor mop.'
      },
      {
        id: 'kitchen_deep',
        name: 'Deep Kitchen Cleaning',
        price: 599,
        duration: '60–90 min',
        description: 'Oil stain degreasing, tile scrub, cabinet exterior wipe & appliance surface cleaning.'
      },
      {
        id: 'kitchen_intensive',
        name: 'Intensive Kitchen Degreasing',
        price: 899,
        duration: '90–120 min',
        description: 'Full interior/exterior cabinet degreasing, exhaust fan & window scrub.'
      },
      {
        id: 'chimney_basic',
        name: 'Basic Chimney Cleaning',
        price: 399,
        duration: '45–60 min',
        description: 'Baffle filter removal, caustic degreasing soak & outer body polish.'
      },
      {
        id: 'chimney_deep',
        name: 'Deep Chimney & Duct Scrub',
        price: 699,
        duration: '60–90 min',
        description: 'Full chimney dismantling, carbon residue removal & duct pipe cleaning.'
      }
    ]
  },

  // 3. Bathroom & Water Tank Cleaning
  {
    id: 'bathroom_tank_umbrella',
    name: 'Bathroom & Water Tank Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Tile scrubbing, hard water descaling, sanitaryware disinfection, and overhead water tank cleaning.',
    image: '/bathroom-cleaning.jpg',
    images: ['/bathroom-cleaning.jpg'],
    options: [
      {
        id: 'bath_basic',
        name: 'Basic Bathroom Cleaning',
        price: 299,
        duration: '30–45 min',
        description: 'Sanitaryware scrubbing, mirror wipe, floor mopping & light descaling.'
      },
      {
        id: 'bath_deep',
        name: 'Deep Bathroom Cleaning',
        price: 449,
        duration: '45–60 min',
        description: 'Hard water stain removal, grout scrub, shower panel descaling & sanitization.'
      },
      {
        id: 'bath_intensive',
        name: 'Intensive Steam Sanitization',
        price: 599,
        duration: '60–90 min',
        description: 'High-pressure steam sanitization, chemical stain extraction & tile scrub.'
      },
      {
        id: 'tank_500_1000',
        name: 'Overhead Water Tank Cleaning (500L–1000L)',
        price: 449,
        duration: '45–60 min',
        description: 'Dewatering, sludge vacuuming, pressure wash & UV sanitization.'
      },
      {
        id: 'tank_2000',
        name: 'Overhead Water Tank Cleaning (1000L–2000L+)',
        price: 749,
        duration: '60–90 min',
        description: 'Heavy sludge removal, anti-bacterial spray & high pressure jet wash.'
      },
      {
        id: 'tank_sump',
        name: 'Underground Sump Tank Cleaning',
        price: 1199,
        duration: '2–3 hrs',
        description: 'Underground sump cleaning, manual wall scrubbing & antibacterial fogging.'
      }
    ]
  },

  // 4. Sofa, Carpet & Upholstery Cleaning
  {
    id: 'upholstery_cleaning_umbrella',
    name: 'Sofa, Carpet & Upholstery Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'High-suction wet extraction shampooing for fabric sofas, cushions, carpets, and mattresses.',
    image: '/carpet-cleaning.jpg',
    images: ['/carpet-cleaning.jpg'],
    options: [
      {
        id: 'sofa_1_2',
        name: '1–2 Seater Sofa Cleaning',
        price: 349,
        duration: '30–45 min',
        description: 'High-suction vacuuming, stain treatment & wet extraction shampooing.'
      },
      {
        id: 'sofa_3_5',
        name: '3–5 Seater Sofa Set Cleaning',
        price: 699,
        duration: '60–90 min',
        description: 'Foam extraction cleaning and fabric sanitization for 3-5 seater couches.'
      },
      {
        id: 'sofa_l_shaped',
        name: 'L-Shaped Sectional Sofa Cleaning',
        price: 999,
        duration: '90–120 min',
        description: 'Intensive deep cleaning for sectional and L-shaped upholstered sofas.'
      },
      {
        id: 'carpet_shampooing',
        name: 'Carpet & Area Rug Shampooing',
        price: 349,
        duration: '45–60 min',
        description: 'Deep foam shampooing and fiber sanitization for living room carpets.'
      },
      {
        id: 'mattress_single',
        name: 'Single Mattress Cleaning',
        price: 299,
        duration: '30–45 min',
        description: 'UV sanitization, dust mite vacuuming & spot cleaning for single mattress.'
      },
      {
        id: 'mattress_double_king',
        name: 'Double / King Mattress Cleaning',
        price: 599,
        duration: '60–75 min',
        description: 'Two-sided wet extraction and deodorizing treatment for king mattresses.'
      }
    ]
  },

  // 5. Floor, Window & Commercial Cleaning
  {
    id: 'commercial_floor_umbrella',
    name: 'Floor, Window & Commercial Cleaning',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 299,
    description: 'Mechanized floor scrubbing, streak-free window glass cleaning, post-construction & office deep cleaning.',
    image: '/floor-window-cleaning.jpg',
    images: ['/floor-window-cleaning.jpg'],
    options: [
      {
        id: 'window_glass',
        name: 'Window & Glass Panel Cleaning',
        price: 299,
        duration: '45–60 min',
        description: 'Streak-free squeegee cleaning for glass windows, sliders & frames.'
      },
      {
        id: 'floor_scrubbing',
        name: 'Floor Machine Scrubbing & Buffing',
        price: 599,
        duration: '60–90 min',
        description: 'Single-disc rotary floor scrubbing, grout line cleaning & tile buffing.'
      },
      {
        id: 'office_small',
        name: 'Small Office Space Cleaning',
        price: 1499,
        duration: '2–3 hrs',
        description: 'Workstation sanitization, desk wipe down, pantry scrub & floor mop.'
      },
      {
        id: 'office_large',
        name: 'Medium / Large Office Deep Cleaning',
        price: 2999,
        duration: '4–6 hrs',
        description: 'Deep commercial office cleaning, conference room & executive polishing.'
      },
      {
        id: 'post_construction',
        name: 'Post-Construction Deep Cleaning',
        price: 2499,
        duration: '4–5 hrs',
        description: 'Paint & cement stain scraping, window track clearing & floor scrub.'
      },
      {
        id: 'commercial_retail',
        name: 'Commercial Deep Cleaning (Retail/Kitchen)',
        price: 2999,
        duration: '4–6 hrs',
        description: 'Deep cleaning for showrooms, cloud kitchens & industrial warehouses.'
      }
    ]
  },

  // 6. Tap, Mixer & Shower Repair Services
  {
    id: 'faucet_shower_umbrella',
    name: 'Tap, Mixer & Shower Services',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 149,
    description: 'Fixing dripping taps, broken spindle valves, wall mixers, hand showers, and angle valves.',
    image: '/tap-repair.jpg',
    images: ['/tap-repair.jpg'],
    options: [
      {
        id: 'tap_repair_std',
        name: 'Standard Tap Repair',
        price: 149,
        duration: '30–45 min',
        description: 'Spindle replacement, rubber washer change & thread leak repair.'
      },
      {
        id: 'tap_angle_valve',
        name: 'Tap & Angle Valve Replacement',
        price: 199,
        duration: '30–45 min',
        description: 'Dismantling old faucet and installing new bib cock, pillar tap or angle valve.'
      },
      {
        id: 'mixer_tap_repair',
        name: 'Hot & Cold Mixer Tap Repair',
        price: 299,
        duration: '45–60 min',
        description: 'Wall mixer cartridge repair, diverter fix & water pressure restoration.'
      },
      {
        id: 'shower_head_rail',
        name: 'Shower Head & Rail Repair',
        price: 199,
        duration: '30–45 min',
        description: 'Shower head descaling, wall arm replacement & hand shower rail fitting.'
      },
      {
        id: 'mixer_tap_replace',
        name: 'Mixer Tap Replacement & Installation',
        price: 399,
        duration: '45–60 min',
        description: 'Dismantling old unit and wall-mounting new hot/cold mixer faucet.'
      }
    ]
  },

  // 7. Sanitaryware & Toilet Repair Services
  {
    id: 'sanitaryware_toilet_umbrella',
    name: 'Sanitaryware & Toilet Repair Services',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 199,
    description: 'Repair of washbasins, kitchen sinks, western commodes, flush tanks, and jet sprays.',
    image: '/toilet-sanitary-repair.jpg',
    images: ['/toilet-sanitary-repair.jpg'],
    options: [
      {
        id: 'basin_leak_trap',
        name: 'Wash Basin Leakage & Trap Repair',
        price: 199,
        duration: '30–45 min',
        description: 'Waste coupling re-sealing, bottle trap clearing & leak fix.'
      },
      {
        id: 'sink_drain_leak',
        name: 'Kitchen Sink Drain & Leak Fix',
        price: 199,
        duration: '30–45 min',
        description: 'Under-sink waste coupling sealant application & food trap cleaning.'
      },
      {
        id: 'toilet_jet_leak',
        name: 'Toilet Leakage & Jet Spray Repair',
        price: 249,
        duration: '30–45 min',
        description: 'Base wax ring seal replacement, health faucet jet spray fix & gasket change.'
      },
      {
        id: 'flush_tank_mech',
        name: 'Flush Tank Mechanism Repair',
        price: 249,
        duration: '30–45 min',
        description: 'Cistern flush valve repair, ball cock adjustment & siphon tower replacement.'
      },
      {
        id: 'flush_tank_full',
        name: 'Full Flush Tank Service',
        price: 449,
        duration: '45–60 min',
        description: 'Concealed or wall-mounted cistern tank descaling & internal valve change.'
      },
      {
        id: 'sink_basin_install',
        name: 'Sink / Basin Replacement & Installation',
        price: 449,
        duration: '45–60 min',
        description: 'Granite counter cutout fitting, new basin/sink waste line plumbing.'
      }
    ]
  },

  // 8. Drainage Blockage & Pipe Leakage Fix
  {
    id: 'drainage_pipe_umbrella',
    name: 'Drainage Blockage & Pipe Leakage Fix',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 199,
    description: 'Mechanical spring clearing for clogged drains, concealed pipe leakage repair, and emergency dispatch.',
    image: '/pipe-leakage.jpg',
    images: ['/pipe-leakage.jpg'],
    options: [
      {
        id: 'pipe_leak_minor',
        name: 'Minor Pipe Leakage Repair',
        price: 199,
        duration: '30–45 min',
        description: 'Exposed pipe joint sealing, washer replacement & Teflon tape patching.'
      },
      {
        id: 'pipe_leak_standard',
        name: 'Standard Pipeline Leakage Repair',
        price: 349,
        duration: '45–60 min',
        description: 'CPVC/GI pipe section replacement, coupling fitting & pressure leak fix.'
      },
      {
        id: 'sink_drain_clog',
        name: 'Sink & Kitchen Drain Blockage Clearance',
        price: 199,
        duration: '30–45 min',
        description: 'Mechanical spring clearing for clogged kitchen sinks & washbasins.'
      },
      {
        id: 'bath_drain_clog',
        name: 'Bathroom Floor Drain Blockage Removal',
        price: 299,
        duration: '45–60 min',
        description: 'Floor trap hair & soap scum mechanical spring clog clearance.'
      },
      {
        id: 'main_line_sewer',
        name: 'Main Line & Sewer Pipe Clearance',
        price: 499,
        duration: '60–90 min',
        description: 'Heavy grease & main sewer line rodding inspection & clearance.'
      },
      {
        id: 'emergency_pipe_dispatch',
        name: 'Emergency Pipe Burst & Overflow Dispatch',
        price: 399,
        duration: '30–45 min',
        description: 'Priority rapid arrival for main line burst pipe or severe drain flooding.'
      }
    ]
  },

  // 9. Plumbing Installations & Geyser Connections
  {
    id: 'installations_geyser_umbrella',
    name: 'Plumbing Installations & Geyser Connections',
    categoryName: 'Plumbing & Cleaning',
    canonicalCategoryId: 'plumbing_cleaning',
    startingPrice: 149,
    description: 'Installation of toilets, washbasins, geyser plumbing lines, water tank fittings, and accessories.',
    image: '/geyser-plumbing-install.jpg',
    images: ['/geyser-plumbing-install.jpg'],
    options: [
      {
        id: 'bathroom_acc_install',
        name: 'Bathroom Accessory & Fitting Installation',
        price: 149,
        duration: '30–45 min',
        description: 'Towel rod, soap dish, mirror cabinet, angle cock or towel rack mounting.'
      },
      {
        id: 'geyser_pipe_connection',
        name: 'Geyser Inlet / Outlet Pipe Plumbing',
        price: 249,
        duration: '30–45 min',
        description: 'Hot & cold water braided flexible hose connection & valve leak repair.'
      },
      {
        id: 'tank_float_valve_install',
        name: 'Automatic Water Tank Float Valve Fitting',
        price: 349,
        duration: '45–60 min',
        description: 'Heavy duty brass float ball valve installation to prevent tank overflow.'
      },
      {
        id: 'wash_basin_fitting',
        name: 'Wash Basin Installation & Plumbing',
        price: 349,
        duration: '45–60 min',
        description: 'Ceramic basin mounting, pillar tap fitting & bottle trap plumbing.'
      },
      {
        id: 'western_commode_install',
        name: 'Western Commode & Toilet Installation',
        price: 799,
        duration: '60–90 min',
        description: 'Floor-mounted western commode fitting, wax ring seal & waste pipe connect.'
      },
      {
        id: 'wall_hung_toilet_setup',
        name: 'Wall-Hung Toilet & Concealed Cistern Setup',
        price: 1299,
        duration: '120–150 min',
        description: 'Frame mounting, concealed cistern installation & flush plate fitting.'
      }
    ]
  }
];
