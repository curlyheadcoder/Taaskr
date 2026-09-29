// Paint Services Catalog & Options (Sub-services under Civil & Property Maintenance)

export const PAINT_SERVICES_CATALOG = [
  {
    id: 'interior_wall_painting',
    name: 'Interior Wall Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 12,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Painting of interior walls for bedrooms, living rooms, kitchens, offices and other indoor spaces.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    includes: [
      'Wall inspection & moisture check',
      'Surface sanding & basic gap filling',
      '2 coats of premium acrylic emulsion paint',
      'Door/window edge masking & floor protection',
      'Post-service cleanup & trash disposal'
    ],
    options: [
      { id: 'interior_standard', name: 'Standard Interior Painting', price: 12, unit: 'sq ft', duration: 'Based on area', description: 'Dual coat premium emulsion paint for indoor walls with smooth satin finish.' },
      { id: 'interior_luxury', name: 'Luxury Teflon Emulsion Painting', price: 18, unit: 'sq ft', duration: 'Based on area', description: 'Stain-resistant washable Teflon emulsion with rich sheen finish.' },
      { id: 'interior_primer_putty', name: 'Full Preparation (Putty + Primer + Paint)', price: 24, unit: 'sq ft', duration: 'Based on area', description: '2 coats acrylic putty, 1 coat primer, and 2 coats premium emulsion.' }
    ]
  },
  {
    id: 'exterior_wall_painting',
    name: 'Exterior Wall Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 15,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Painting of exterior walls, building facades and other outdoor surfaces.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    includes: [
      'Pressure wall washing & dust clearing',
      'Weather-shield primer coat',
      '2 coats anti-fungal exterior emulsion',
      'UV-resistant protective top coat'
    ],
    options: [
      { id: 'exterior_standard', name: 'Standard Weather Shield Painting', price: 15, unit: 'sq ft', duration: 'Based on area', description: 'All-weather exterior emulsion with 3-year rain and heat protection.' },
      { id: 'exterior_heavy_duty', name: 'Heavy Duty Waterproof Exterior Coating', price: 25, unit: 'sq ft', duration: 'Based on area', description: 'Elastomeric dirt-pickup resistance coating with 7-year warranty.' }
    ]
  },
  {
    id: 'full_house_painting',
    name: 'Full House Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 14,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Complete painting service covering the required interior and/or exterior areas of a residential property.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    includes: [
      'Comprehensive 100% home painting coverage',
      'Free color consultation & digital shade cards',
      'Putty, primer, wall sanding & dual coat paint',
      'Furniture wrapping & doorstep area measurement'
    ],
    options: [
      { id: 'full_house_1bhk', name: '1 BHK Complete House Painting', price: 8999, isStartingFrom: true, duration: '2–3 days', description: 'Complete interior wall painting for 1 BHK apartment including ceiling & trim touch-ups.' },
      { id: 'full_house_2bhk', name: '2 BHK Complete House Painting', price: 14999, isStartingFrom: true, duration: '3–4 days', description: 'Complete interior wall painting for 2 BHK apartment including putty fix & masking.' },
      { id: 'full_house_3bhk', name: '3 BHK / Villa House Painting', price: 21999, isStartingFrom: true, duration: '4–6 days', description: 'Full property interior & exterior painting overhaul with premium washable paints.' }
    ]
  },
  {
    id: 'door_window_painting',
    name: 'Door & Window Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 499,
    unit: 'item',
    pricingType: 'UNIT_BASED',
    requiresInspection: false,
    requiresMeasurement: false,
    description: 'Painting and refinishing of wooden or metal doors and windows.',
    image: '/civil-carpentry-repair.jpg',
    images: ['/civil-carpentry-repair.jpg'],
    includes: [
      'Old varnish/paint sanding',
      'Rust-shield or wood primer coat',
      '2 coats enamel paint or PU wood polish'
    ],
    options: [
      { id: 'single_door_enamel', name: 'Single Wooden/Metal Door Painting', price: 499, duration: '2–3 hrs', description: 'Glossy or matte synthetic enamel paint coat for single room door.' },
      { id: 'single_door_pu_polish', name: 'Single Door PU Wood Polish', price: 899, duration: '3–4 hrs', description: 'Polyurethane clear wood polish for natural grain luster.' },
      { id: 'window_grill_paint', name: 'Window Frame & Iron Grill Painting', price: 399, duration: '2–3 hrs', description: 'Anti-rust black/white enamel paint for metal window grills.' }
    ]
  },
  {
    id: 'wall_repainting',
    name: 'Wall Repainting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 10,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Refreshing previously painted walls with a new paint finish.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      { id: 'repaint_single_coat', name: 'Refresh Coat Painting', price: 10, unit: 'sq ft', duration: 'Based on area', description: 'Single refresh coat over good condition existing paint of same shade.' },
      { id: 'repaint_dual_coat', name: 'Dual Coat Color Change Repainting', price: 14, unit: 'sq ft', duration: 'Based on area', description: 'Primer sealer + 2 coats premium emulsion for changing wall color.' }
    ]
  },
  {
    id: 'texture_painting',
    name: 'Texture Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 45,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Decorative texture and designer wall finishing.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      { id: 'texture_metallic', name: 'Designer Metallic Wall Texture', price: 45, unit: 'sq ft', duration: 'Based on area', description: 'Royale play metallic/stucco designer texture for living room accent wall.' },
      { id: 'texture_stencil', name: 'Wall Stencil & Geometric Pattern', price: 55, unit: 'sq ft', duration: 'Based on area', description: 'Custom pattern stencil paint design over accent base coat.' }
    ]
  },
  {
    id: 'waterproof_painting',
    name: 'Waterproof Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 25,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Painting/coating solutions intended to improve resistance to moisture and water exposure.',
    image: '/civil-waterproofing.jpg',
    images: ['/civil-waterproofing.jpg'],
    options: [
      { id: 'waterproof_damp_fix', name: 'Anti-Damp Wall Waterproof Coating', price: 25, unit: 'sq ft', duration: 'Based on area', description: 'Chemical barrier coat for internal damp walls preventing paint peeling.' },
      { id: 'waterproof_terrace_paint', name: 'Terrace & Roof Slab Waterproof Paint', price: 35, unit: 'sq ft', duration: 'Based on area', description: 'Heavy duty elastomeric liquid membrane for roof terrace water sealing.' }
    ]
  },
  {
    id: 'commercial_painting',
    name: 'Commercial Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 12,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Painting services for offices, shops and other commercial properties.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      { id: 'commercial_office', name: 'Office & Retail Shop Painting', price: 12, unit: 'sq ft', duration: 'Based on area', description: 'Fast turn-around low odor commercial paint job for working offices & shops.' },
      { id: 'commercial_building', name: 'Full Building Facade Painting', price: 16, unit: 'sq ft', duration: 'Based on area', description: 'Scaffolding/rope suspension high-rise building exterior painting.' }
    ]
  },
  {
    id: 'touchup_minor_painting',
    name: 'Touch-Up & Minor Painting',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 499,
    unit: 'service',
    pricingType: 'FIXED',
    requiresInspection: false,
    requiresMeasurement: false,
    description: 'Small-area repairs, patches and touch-up painting.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      { id: 'touchup_small_patch', name: 'Wall Crack & Nail Hole Touch-Up', price: 499, duration: '60 min', description: 'Putty filling and color matching touch up for up to 5 small wall patches.' },
      { id: 'touchup_single_wall', name: 'Single Wall Touch-Up Painting', price: 799, duration: '90 min', description: 'Repainting single damaged wall section in bedroom/hall.' }
    ]
  },
  {
    id: 'putty_primer_work',
    name: 'Putty & Primer Work',
    categoryName: 'Civil & Property Maintenance',
    canonicalCategoryId: 'civil_maintenance',
    startingPrice: 8,
    unit: 'sq ft',
    pricingType: 'AREA_BASED',
    requiresInspection: true,
    requiresMeasurement: true,
    description: 'Surface preparation involving putty and primer before painting.',
    image: '/civil-painting.jpg',
    images: ['/civil-painting.jpg'],
    options: [
      { id: 'putty_2coat', name: 'Dual Coat Wall Putty & Sanding', price: 8, unit: 'sq ft', duration: 'Based on area', description: 'Leveling raw or damaged walls with 2 coats white cement putty.' },
      { id: 'primer_sealer', name: 'Sealer Primer Coat Application', price: 6, unit: 'sq ft', duration: 'Based on area', description: 'Deep penetrating alkali resistant primer coat for unpainted masonry.' }
    ]
  }
];

export const PROPERTY_TYPE_OPTIONS = [
  'Apartment',
  'Independent House',
  'Villa',
  'Office',
  'Shop',
  'Commercial Property',
  'Other'
];

export const SURFACE_CONDITION_OPTIONS = [
  'New / Unpainted Surface',
  'Good Existing Paint',
  'Minor Damage',
  'Cracks Present',
  'Peeling Paint',
  'Dampness / Moisture',
  'Significant Surface Damage',
  'Not Sure'
];

export const PAINT_MATERIAL_OPTIONS = [
  'Customer Provides Material',
  'Taaskr/Provider Provides Material',
  'Not Sure'
];
