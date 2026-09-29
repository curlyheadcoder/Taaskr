// Civil & Property Maintenance Umbrella Services & Variant Catalog

export const CIVIL_MAINTENANCE_SERVICES = [
  {
    id: 'carpentry_furniture_services',
    name: 'Carpentry & Furniture Services',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 299,
    description: 'Doorstep carpentry repair, hinge alignment, flatpack furniture assembly, lock replacement & custom woodwork.',
    image: '/civil-carpentry-repair.jpg',
    images: ['/civil-carpentry-repair.jpg'],
    options: [
      {
        id: 'carpentry_repair',
        name: 'Carpentry & Furniture Repair',
        price: 399,
        duration: '45–60 min',
        description: 'Fixing misaligned kitchen cabinet hinges, drawer channel replacement, hydraulic bed lift repair & door trimming.'
      },
      {
        id: 'furniture_assembly',
        name: 'Furniture Assembly & Flatpack Setup',
        price: 499,
        duration: '60–120 min',
        description: 'Assembly of flatpack wardrobes, beds, TV units, study desks & dining tables from IKEA / Amazon / Pepperfry.'
      },
      {
        id: 'door_lock_repair',
        name: 'Door Lock & Latch Repair / Installation',
        price: 299,
        duration: '30–45 min',
        description: 'Fixing or replacing cylindrical knob locks, main door mortise locks, night latches & magnetic stoppers.'
      },
      {
        id: 'custom_woodwork',
        name: 'Custom Woodwork & Minor Alterations',
        price: 699,
        duration: '1–2 hrs',
        description: 'Custom wooden shelf mounting, plywood trimming, wooden door frame fix & partition modifications.'
      }
    ]
  },
  {
    id: 'drilling_hanging_mounting_services',
    name: 'Drilling, Hanging & Wall Mounting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 249,
    description: 'Precision hammer-drilling for wall art, mirrors, curtain rods, TV brackets, and bathroom accessories.',
    image: '/civil-wall-mounting.jpg',
    images: ['/civil-wall-mounting.jpg'],
    options: [
      {
        id: 'drilling_hanging',
        name: 'Drilling, Hanging & Wall Decor Setup',
        price: 249,
        duration: '30–45 min',
        description: 'Precision hammer-drilling for photo frames, wall art, mirrors, curtain rods & bathroom towel racks.'
      },
      {
        id: 'tv_mounting',
        name: 'Smart TV & Soundbar Wall Mounting',
        price: 499,
        duration: '45–60 min',
        description: 'Heavy-duty wall bracket installation for 32–75 inch Smart TVs, soundbar fitting & cable concealment.'
      },
      {
        id: 'heavy_shelf_hanging',
        name: 'Heavy Cabinet & Shelf Wall Mounting',
        price: 399,
        duration: '45–60 min',
        description: 'Anchoring heavy wooden bookshelves, kitchen wall cabinets, microwave racks & floating units.'
      }
    ]
  },
  {
    id: 'painting_wall_care_services',
    name: 'Interior Painting & Wall Care',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 499,
    description: 'Wall dampness treatment, spot putty touch-up, single room accent wall painting & full interior painting.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      {
        id: 'patch_touchup',
        name: 'Wall Patchwork & Spot Touch-up',
        price: 499,
        duration: '60–90 min',
        description: 'Dampness sanding, hole putty filling, primer application & color-matched touch-up painting.'
      },
      {
        id: 'accent_wall_paint',
        name: 'Single Room Accent Wall Painting',
        price: 999,
        duration: '2–3 hrs',
        description: 'Premium acrylic emulsion roller painting for feature/accent walls with smooth velvet finish.'
      },
      {
        id: 'full_interior_paint',
        name: 'Full Room / Interior Wall Painting',
        price: 1499,
        isStartingFrom: true,
        duration: '4–6 hrs',
        description: 'Complete double putty coat, primer sealing & dual layer washable premium emulsion painting.'
      },
      {
        id: 'exterior_waterproof_paint',
        name: 'Balcony & Exterior Protective Paint',
        price: 1999,
        duration: '4–6 hrs',
        description: 'Weather-shield anti-fungal protective paint for balconies, parapets & external walls.'
      }
    ]
  },
  {
    id: 'waterproofing_tiling_services',
    name: 'Waterproofing & Tiling Services',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 499,
    description: 'Bathroom regrouting, floor tile repair, sub-floor chemical waterproofing & roof terrace leak treatment.',
    image: '/civil-waterproofing.jpg',
    images: ['/civil-waterproofing.jpg'],
    options: [
      {
        id: 'tile_grouting',
        name: 'Tile Regrouting & Anti-Leak Sealing',
        price: 499,
        duration: '45–60 min',
        description: 'Scraping old degraded grout, epoxy resin filling & waterproof silicone sealing around fixtures.'
      },
      {
        id: 'tile_repair',
        name: 'Floor Tiling & Cracked Tile Repair',
        price: 799,
        duration: '1–2 hrs',
        description: 'Single/multiple cracked floor tile unmounting, fresh tile bedding & cement regrouting.'
      },
      {
        id: 'terrace_waterproofing',
        name: 'Roof & Terrace Waterproof Coating',
        price: 2499,
        isStartingFrom: true,
        duration: '4–6 hrs',
        description: 'Multi-layer elastomeric polymer coating for roof slab waterproofing & heat reduction.'
      },
      {
        id: 'bathroom_waterproofing',
        name: 'Bathroom & Balcony Dampness Treatment',
        price: 1899,
        duration: '3–4 hrs',
        description: 'Chemical barrier injection, tile joint sealing & damp wall anti-mold treatment.'
      }
    ]
  }
];
