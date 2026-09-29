// Appliances & Electrical Umbrella Services & Variant Catalog

export const APPLIANCES_ELECTRICAL_SERVICES = [
  {
    id: 'ac_services',
    name: 'AC Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 499,
    description: 'Complete Air Conditioner installation, uninstallation, high-pressure jet maintenance, cooling repair & gas refill.',
    image: '/ac-servicing.jpg',
    images: ['/ac-servicing.jpg', '/ac-installation.jpg', '/ac-repair.jpg'],
    options: [
      { 
        id: 'ac_uninstall', 
        name: 'AC Uninstallation', 
        price: 499, 
        duration: '45–60 min', 
        description: 'Safe refrigerant pump-down, wall bracket dismantling, copper pipe capping & unit packing.' 
      },
      { 
        id: 'ac_maint', 
        name: 'AC Maintenance & Jet Cleaning', 
        price: 599, 
        duration: '60–90 min', 
        description: 'Routine AC servicing, high-pressure foam jet cleaning of cooling coils, blower wash & drain line flush.' 
      },
      { 
        id: 'ac_repair', 
        name: 'AC Repair & Cooling Diagnostics', 
        price: 699, 
        duration: '60–120 min', 
        description: 'Air conditioner cooling diagnostics, PCB sensor check, fan motor repair, capacitor fix & electrical check.' 
      },
      { 
        id: 'ac_install', 
        name: 'AC Installation', 
        price: 1499, 
        duration: '2–3 hrs', 
        description: 'Complete indoor & outdoor unit wall mounting, copper piping fitting, vacuuming & performance test.' 
      },
      { 
        id: 'ac_gas_refill', 
        name: 'AC Gas Refill & Leak Sealing', 
        price: 1499, 
        duration: '60–90 min', 
        description: 'Nitrogen pressure leak detection, copper pipe brazing & 100% R32 / R410a refrigerant gas charge.' 
      },
      { 
        id: 'ac_full_package', 
        name: 'Complete AC Overhaul Package', 
        price: 1999, 
        duration: '2–3 hrs', 
        description: 'Deep foam jet wash, outdoor condenser pressure wash, anti-bacterial coating & cooling optimization.' 
      }
    ]
  },
  {
    id: 'ro_purifier_services',
    name: 'RO Purifier Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 399,
    description: 'Doorstep Reverse Osmosis (RO) water purifier installation, routine maintenance, filter replacement & pump repairs.',
    image: '/ro-repair.jpg',
    images: ['/ro-repair.jpg', '/ro-installation.jpg'],
    options: [
      { 
        id: 'ro_install', 
        name: 'RO Purifier Installation', 
        price: 399, 
        duration: '45–60 min', 
        description: 'RO water purifier wall mounting, water inlet tap fitting, waste pipe setup & TDS calibration.' 
      },
      { 
        id: 'ro_repair', 
        name: 'RO Repair & Leakage Fix', 
        price: 499, 
        duration: '45–60 min', 
        description: 'Fixing water leaks, SMPS power supply repair, solenoid valve (SV) & booster pump troubleshooting.' 
      },
      { 
        id: 'ro_maint', 
        name: 'RO Maintenance & Filter Servicing', 
        price: 599, 
        duration: '60–90 min', 
        description: 'Pre-filter bowl cleaning, sediment filter backwash, activated carbon flush & pump pressure testing.' 
      },
      { 
        id: 'ro_full_filter', 
        name: 'Full RO Filter & Membrane Replacement', 
        price: 1299, 
        duration: '60–90 min', 
        description: 'Complete kit replacement: spun filter, sediment filter, carbon block & authentic high-TDS RO membrane.' 
      }
    ]
  },
  {
    id: 'refrigerator_services',
    name: 'Refrigerator Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 399,
    description: 'Single door, double door, and side-by-side refrigerator repair, maintenance, gasket replacement & gas charging.',
    image: '/refrigerator-repair.jpg',
    images: ['/refrigerator-repair.jpg'],
    options: [
      { 
        id: 'fridge_maint', 
        name: 'Refrigerator Servicing & Sanitization', 
        price: 399, 
        duration: '45–60 min', 
        description: 'Condenser coil cleaning, door rubber gasket check, drain tray flush & interior anti-bacterial spray.' 
      },
      { 
        id: 'fridge_repair', 
        name: 'Refrigerator Repair & Diagnostics', 
        price: 599, 
        duration: '60–90 min', 
        description: 'Single/double door cooling failure fix, compressor relay, thermostat & automatic defrost timer replacement.' 
      },
      { 
        id: 'fridge_gas', 
        name: 'Refrigerator Gas Refill & Leak Fix', 
        price: 999, 
        duration: '60–90 min', 
        description: 'Refrigerant leak detection, capillary tube cleaning, vacuuming & fresh gas charging.' 
      }
    ]
  },
  {
    id: 'washing_machine_services',
    name: 'Washing Machine Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 349,
    description: 'Top load, front load & semi-automatic washing machine repair, installation, uninstallation & descaling maintenance.',
    image: '/washing-machine-repair.jpg',
    images: ['/washing-machine-repair.jpg'],
    options: [
      { 
        id: 'wm_install', 
        name: 'Washing Machine Installation / Uninstallation', 
        price: 349, 
        duration: '30–45 min', 
        description: 'Inlet hose fitting, drain pipe setup, transit bolt removal & anti-vibration level balancing.' 
      },
      { 
        id: 'wm_maint', 
        name: 'Washing Machine Servicing & Tub Descaling', 
        price: 399, 
        duration: '45–60 min', 
        description: 'High-temp drum descaling, lint filter clean, drain pump flush & drive belt tensioning.' 
      },
      { 
        id: 'wm_repair', 
        name: 'Washing Machine Repair & PCB Fix', 
        price: 599, 
        duration: '60–90 min', 
        description: 'Automatic/semi-automatic drum noise fix, inlet solenoid valve, gear box, drain motor & PCB board repair.' 
      }
    ]
  },
  {
    id: 'fan_electrical_services',
    name: 'Fan & Electrical Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 199,
    description: 'Ceiling fan, exhaust fan, switchboard, MCB fuse box & household electrical wiring repairs & installation.',
    image: '/fan-repair.jpg',
    images: ['/fan-repair.jpg', '/electrical-repair.jpg'],
    options: [
      { 
        id: 'fan_install', 
        name: 'Fan Installation / Replacement', 
        price: 199, 
        duration: '30–45 min', 
        description: 'Ceiling fan or wall exhaust fan mounting, blade balancing & ceiling hook connection.' 
      },
      { 
        id: 'fan_repair', 
        name: 'Ceiling & Exhaust Fan Repair', 
        price: 299, 
        duration: '30–45 min', 
        description: 'Motor winding repair, capacitor replacement, bearing greasing & step-regulator troubleshooting.' 
      },
      { 
        id: 'switchboard_repair', 
        name: 'Switchboard & Socket Repair', 
        price: 349, 
        duration: '45–60 min', 
        description: 'Repair or replace faulty switch boards, burnt power sockets, earthing issues & concealed wiring.' 
      },
      { 
        id: 'mcb_repair', 
        name: 'MCB & Distribution Box Repair', 
        price: 399, 
        duration: '45–60 min', 
        description: 'Replacing tripping MCB breakers, main isolator switch fix & neutral link panel repair.' 
      }
    ]
  },
  {
    id: 'geyser_services',
    name: 'Geyser & Water Heater Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 399,
    description: 'Storage and instant geyser installation, descaling servicing, heating element & thermostat replacement.',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80'],
    options: [
      { 
        id: 'geyser_install', 
        name: 'Geyser Installation / Uninstallation', 
        price: 399, 
        duration: '45–60 min', 
        description: 'Heavy-duty wall bracket drilling, inlet/outlet braided hose connection & safety valve setup.' 
      },
      { 
        id: 'geyser_maint', 
        name: 'Geyser Servicing & Descaling', 
        price: 449, 
        duration: '45–60 min', 
        description: 'Hard water scale descaling from heating tank, anode rod check & thermostat calibration.' 
      },
      { 
        id: 'geyser_repair', 
        name: 'Geyser Repair & Element Replacement', 
        price: 599, 
        duration: '60–90 min', 
        description: 'Replacing burnt heating element, faulty thermostat, internal wiring fix & pressure valve sealing.' 
      }
    ]
  },
  {
    id: 'inverter_battery_services',
    name: 'Inverter & Battery Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 349,
    description: 'Home inverter setup, battery distilled water top-up, terminal desulfation & PCB repairs.',
    image: '/electrical-repair.jpg',
    images: ['/electrical-repair.jpg'],
    options: [
      { 
        id: 'inverter_maint', 
        name: 'Inverter & Battery Servicing', 
        price: 349, 
        duration: '30–45 min', 
        description: 'Distilled water level top-up, terminal desulfation, cable check & inverter load testing.' 
      },
      { 
        id: 'inverter_install', 
        name: 'Inverter & Battery Installation', 
        price: 499, 
        duration: '45–60 min', 
        description: 'Main DB switchboard bypass wiring, inverter placement & battery bank terminal setup.' 
      }
    ]
  },
  {
    id: 'microwave_otg_services',
    name: 'Microwave & OTG Services',
    categoryName: 'Appliances & Electrical',
    canonicalCategoryId: 'appliances_electrical',
    startingPrice: 299,
    description: 'Solo, grill, and convection microwave oven diagnostics, heating element repairs & turntable fixes.',
    image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80',
    images: ['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80'],
    options: [
      { 
        id: 'mw_maint', 
        name: 'Microwave Servicing & Cleaning', 
        price: 299, 
        duration: '30–45 min', 
        description: 'Internal cavity grease removal, door latch check, mica sheet inspection & heating test.' 
      },
      { 
        id: 'mw_repair', 
        name: 'Microwave & OTG Repair', 
        price: 399, 
        duration: '45–60 min', 
        description: 'Magnetron check, high-voltage diode change, touch panel repair & rotating plate motor replacement.' 
      }
    ]
  }
];
