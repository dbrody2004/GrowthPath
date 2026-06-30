import type { ScanIntake } from '@growthpath/shared';

export type VerticalKey =
  | 'food_beverage'
  | 'beauty_wellness'
  | 'fitness_training'
  | 'home_professional_services';

export type BizTier = ScanIntake['bizTier'];
export type ScanTierKey = ScanIntake['scanTier'];

export interface KeywordGroup {
  label: string;
  terms: string[];
}

export interface BusinessTypeEntry {
  label: string;
  sub: string;
  subtypes: string[];
  groups: KeywordGroup[];
}

export interface VerticalEntry {
  _verticalLabel: string;
  [businessTypeKey: string]: string | BusinessTypeEntry;
}

export const VERTICAL_KEYS: VerticalKey[] = [
  'food_beverage',
  'beauty_wellness',
  'fitness_training',
  'home_professional_services',
];

export const BIZ_TIERS: BizTier[] = ['Basic', 'Advanced', 'Premium'];

export const INTAKE_LIBRARY: Record<VerticalKey, VerticalEntry> = {
  food_beverage: {
    _verticalLabel: 'Food & Beverage',
    restaurant: {
      label: 'Restaurant',
      sub: 'Casual · Fine · Fast Casual',
      subtypes: ['Casual Dining', 'Fine Dining', 'Fast Casual', 'Bar & Grill', 'Farm to Table'],
      groups: [
        { label: 'Meal Periods', terms: ['Dinner', 'Lunch', 'Brunch', 'Breakfast', 'Late Night Food'] },
        {
          label: 'Cuisine & Identity',
          terms: [
            'American Food',
            'Farm to Table',
            'Italian Food',
            'Mexican Food',
            'Asian Food',
            'Japanese Food',
            'Chinese Food',
            'Thai Food',
            'Mediterranean Food',
            'Indian Food',
            'Seafood',
            'Steakhouse',
            'BBQ',
            'Pizza',
            'Sushi',
            'Vietnamese Food',
            'Korean Food',
            'Greek Food',
            'French Food',
          ],
        },
        {
          label: 'Signature Items',
          terms: [
            'Burgers',
            'Tacos',
            'Pasta',
            'Sandwiches',
            'Wings',
            'Salads',
            'Ramen',
            'Poke',
            'Steak',
            'Ribs',
            'Fried Chicken',
            'Fish & Chips',
          ],
        },
        {
          label: 'Drinks & Bar',
          terms: ['Cocktails', 'Craft Beer', 'Wine', 'Margaritas', 'Whiskey & Spirits', 'Full Bar'],
        },
        {
          label: 'Dietary & Lifestyle',
          terms: ['Vegan', 'Vegetarian', 'Gluten Free', 'Healthy Food', 'Keto Friendly', 'Halal', 'Kosher'],
        },
        {
          label: 'Experience & Occasion',
          terms: [
            'Happy Hour',
            'Outdoor Dining',
            'Date Night',
            'Family Friendly',
            'Private Dining',
            'Live Music',
            'Sports Bar',
            'Catering',
            'Takeout',
            'Delivery',
          ],
        },
      ],
    },
    cafe_coffee: {
      label: 'Café & Coffee',
      sub: 'Coffee shop · Tea house',
      subtypes: ['Coffee Shop', 'Espresso Bar', 'Tea House', 'Café'],
      groups: [
        {
          label: 'Coffee & Espresso',
          terms: ['Coffee', 'Espresso', 'Lattes', 'Cold Brew', 'Cappuccino', 'Matcha', 'Specialty Coffee'],
        },
        {
          label: 'Food & Pastries',
          terms: ['Pastries', 'Breakfast Sandwiches', 'Avocado Toast', 'Granola & Acai Bowls'],
        },
        { label: 'Experience', terms: ['WiFi & Work Friendly', 'Cozy Café', 'Coffee & Lunch'] },
      ],
    },
    bakery_desserts: {
      label: 'Bakery & Desserts',
      sub: 'Bakery · Ice cream · Donuts',
      subtypes: ['Bakery', 'Patisserie', 'Donut Shop', 'Ice Cream Shop', 'Dessert Shop'],
      groups: [
        { label: 'Breads & Baked Goods', terms: ['Fresh Bread', 'Sourdough', 'Croissants', 'Bagels'] },
        {
          label: 'Sweets & Desserts',
          terms: ['Custom Cakes', 'Birthday Cakes', 'Wedding Cakes', 'Cookies', 'Donuts', 'Macarons', 'Cupcakes'],
        },
        { label: 'Frozen Desserts', terms: ['Ice Cream', 'Gelato', 'Soft Serve'] },
      ],
    },
    bar_nightlife: {
      label: 'Bar & Nightlife',
      sub: 'Bar · Pub · Brewery · Lounge',
      subtypes: ['Cocktail Bar', 'Sports Bar', 'Wine Bar', 'Pub', 'Brewery', 'Rooftop Bar'],
      groups: [
        {
          label: 'Bar Type',
          terms: ['Cocktail Bar', 'Sports Bar', 'Wine Bar', 'Pub', 'Brewery', 'Rooftop Bar'],
        },
        {
          label: 'Drinks',
          terms: ['Craft Cocktails', 'Craft Beer', 'Whiskey & Spirits', 'Wine Selection'],
        },
        { label: 'Experience', terms: ['Happy Hour', 'Live Music', 'Trivia Night', 'Bar Food'] },
      ],
    },
    specialty_food: {
      label: 'Specialty Food',
      sub: 'Juice · Deli · Food truck',
      subtypes: ['Juice Bar', 'Smoothie Bar', 'Deli', 'Food Truck', 'Bubble Tea'],
      groups: [
        { label: 'Health Drinks & Juice', terms: ['Fresh Juice', 'Smoothies', 'Bubble Tea'] },
        { label: 'Quick Service', terms: ['Deli', 'Food Truck', 'Soup'] },
      ],
    },
    other: {
      label: 'Other',
      sub: 'Not listed above',
      subtypes: [],
      groups: [
        { label: 'Common Terms', terms: ['Delivery', 'Takeout', 'Catering', 'Online Ordering', 'Gift Cards'] },
      ],
    },
  },

  beauty_wellness: {
    _verticalLabel: 'Beauty & Wellness',
    medspa_aesthetics: {
      label: 'MedSpa / Aesthetics',
      sub: 'Medical spa · Aesthetics clinic',
      subtypes: ['Medical Spa', 'Aesthetics Clinic', 'Skin Care Clinic', 'Laser Clinic'],
      groups: [
        {
          label: 'Injectables',
          terms: [
            'Botox',
            'Lip Filler',
            'Dermal Fillers',
            'PRP Facial',
            'Vampire Facial',
            'Kybella',
            'Double Chin Treatment',
          ],
        },
        {
          label: 'Facials & Skin Treatments',
          terms: ['Facials', 'HydraFacial', 'Chemical Peel', 'Microneedling', 'Dermaplaning', 'Oxygen Facial'],
        },
        {
          label: 'Laser & Light Treatments',
          terms: [
            'Laser Treatments',
            'Laser Hair Removal',
            'BBL Facial',
            'IPL Facial',
            'CO2 Laser Resurfacing',
            'Tattoo Removal',
          ],
        },
        {
          label: 'Body Contouring',
          terms: ['CoolSculpting', 'Body Contouring', 'Emsculpt', 'Medical Weight Loss'],
        },
        { label: 'Skin & Wellness', terms: ['IV Therapy', 'Skin Tightening', 'Acne Treatment', 'Anti-Aging'] },
      ],
    },
    day_spa: {
      label: 'Day Spa',
      sub: 'Massage · Body treatments · Packages',
      subtypes: ['Day Spa', 'Wellness Spa', 'Massage Studio', 'Facial Spa'],
      groups: [
        {
          label: 'Massage',
          terms: [
            'Massage',
            'Swedish Massage',
            'Deep Tissue Massage',
            'Couples Massage',
            'Hot Stone Massage',
            'Prenatal Massage',
          ],
        },
        { label: 'Facials & Skin Care', terms: ['Facials', 'Anti-Aging Facial', 'Brightening Facial'] },
        { label: 'Body Treatments', terms: ['Body Treatments', 'Body Wrap', 'Body Scrub & Exfoliation'] },
        { label: 'Spa Experience', terms: ['Spa Packages', 'Spa Day', 'Spa Gift Cards', 'Sauna & Steam'] },
      ],
    },
    salon: {
      label: 'Salon',
      sub: 'Hair · Nails · Lash · Brow',
      subtypes: ['Hair Salon', 'Nail Salon', 'Beauty Salon', 'Blowout Bar', 'Lash Studio', 'Brow Bar'],
      groups: [
        {
          label: 'Hair Services',
          terms: [
            'Haircut',
            'Hair Color',
            'Balayage',
            'Highlights',
            'Keratin Treatment',
            'Hair Extensions',
            'Blowout',
            "Men's Haircut",
            'Bridal Hair',
          ],
        },
        {
          label: 'Nail Services',
          terms: ['Manicure', 'Pedicure', 'Gel Nails', 'Acrylic Nails', 'Nail Art', 'Dip Powder Nails'],
        },
        {
          label: 'Lash & Brow',
          terms: ['Lash Extensions', 'Lash Lift & Tint', 'Eyebrow Services', 'Microblading', 'Brow Lamination'],
        },
        { label: 'Waxing', terms: ['Waxing', 'Brazilian Wax', 'Facial Waxing'] },
        { label: 'Makeup', terms: ['Makeup', 'Bridal Makeup', 'Airbrush Makeup'] },
      ],
    },
  },

  home_professional_services: {
    _verticalLabel: 'Home & Professional Services',
    hvac: {
      label: 'HVAC',
      sub: 'Heating · Cooling · Air quality',
      subtypes: [],
      groups: [
        {
          label: 'Cooling',
          terms: ['AC Repair', 'AC Installation', 'AC Tune-Up', 'AC Maintenance', 'Mini Split Installation'],
        },
        { label: 'Heating', terms: ['Furnace Repair', 'Furnace Installation', 'Heat Pump', 'Boiler Service'] },
        { label: 'Indoor Air Quality', terms: ['Duct Cleaning', 'Air Filtration', 'Air Quality Testing'] },
      ],
    },
    plumbing: {
      label: 'Plumbing',
      sub: 'Repairs · Water systems · Drains',
      subtypes: [],
      groups: [
        {
          label: 'Repairs',
          terms: ['Plumber', 'Plumbing Repair', 'Leak Repair', 'Drain Cleaning', 'Toilet Repair', 'Faucet Repair'],
        },
        { label: 'Water Systems', terms: ['Water Heater', 'Water Softener', 'Sewer Line'] },
      ],
    },
    electrical: {
      label: 'Electrical',
      sub: 'Repairs · Panels · Lighting',
      subtypes: [],
      groups: [
        { label: 'General Electrical', terms: ['Electrician', 'Outlet & Switch Repair', 'Wiring & Rewiring'] },
        {
          label: 'Panels & Upgrades',
          terms: ['Electrical Panel', 'EV Charger Installation', 'Generator Installation'],
        },
        { label: 'Lighting', terms: ['Lighting Installation'] },
      ],
    },
    roofing: {
      label: 'Roofing',
      sub: 'Repair · Replacement · Gutters',
      subtypes: [],
      groups: [
        {
          label: 'Roof Services',
          terms: [
            'Roof Repair',
            'Roof Replacement',
            'Roof Inspection',
            'Storm Damage Roof Repair',
            'Roof Insurance Claim',
          ],
        },
        { label: 'Gutters', terms: ['Gutter Cleaning', 'Gutter Installation'] },
      ],
    },
    landscaping: {
      label: 'Landscaping',
      sub: 'Lawn care · Design · Tree services',
      subtypes: [],
      groups: [
        {
          label: 'Lawn Maintenance',
          terms: ['Lawn Care', 'Lawn Mowing', 'Fertilization & Weed Control', 'Aeration & Overseeding'],
        },
        {
          label: 'Landscaping & Design',
          terms: ['Landscaping', 'Mulching', 'Irrigation System', 'Sprinkler Installation'],
        },
        { label: 'Tree Services', terms: ['Tree Trimming', 'Tree Removal', 'Stump Removal'] },
      ],
    },
    house_cleaning: {
      label: 'House Cleaning',
      sub: 'Residential · Deep clean · Commercial',
      subtypes: ['Residential Cleaning', 'Commercial Cleaning', 'Carpet Cleaning'],
      groups: [
        {
          label: 'Residential Cleaning',
          terms: [
            'House Cleaning',
            'Weekly Cleaning Service',
            'Recurring Cleaning',
            'Deep Cleaning',
            'Move-In Cleaning',
            'Move-Out Cleaning',
            'Post-Construction Cleaning',
          ],
        },
        { label: 'Specialty Cleaning', terms: ['Carpet Cleaning', 'Window Cleaning', 'Pressure Washing'] },
        { label: 'Commercial Cleaning', terms: ['Office Cleaning'] },
      ],
    },
    pest_control: {
      label: 'Pest Control',
      sub: 'Exterminator · Termite · Wildlife',
      subtypes: [],
      groups: [
        {
          label: 'General Pest Control',
          terms: ['Pest Control', 'Ant Control', 'Cockroach Control', 'Rodent Control', 'Bed Bug Treatment'],
        },
        { label: 'Specialty Pest Services', terms: ['Termite Treatment', 'Mosquito Control', 'Wildlife Removal'] },
      ],
    },
    painting: {
      label: 'Painting',
      sub: 'Interior · Exterior · Commercial',
      subtypes: ['Residential', 'Commercial'],
      groups: [
        {
          label: 'Residential Painting',
          terms: ['Interior Painting', 'Exterior Painting', 'House Painter', 'Cabinet Painting'],
        },
        { label: 'Commercial Painting', terms: ['Commercial Painting'] },
      ],
    },
    handyman: {
      label: 'Handyman',
      sub: 'Repairs · Flooring · Drywall',
      subtypes: [],
      groups: [
        {
          label: 'General Repairs',
          terms: ['Handyman', 'Home Repair', 'Drywall Repair', 'Door & Window Repair', 'Deck & Fence Repair'],
        },
        { label: 'Flooring', terms: ['Flooring Installation', 'Tile Installation'] },
      ],
    },
    moving: {
      label: 'Moving',
      sub: 'Local · Long distance · Junk removal',
      subtypes: [],
      groups: [
        {
          label: 'Moving Services',
          terms: ['Local Moving', 'Long Distance Moving', 'Packing Services', 'Junk Removal', 'Moving & Storage'],
        },
      ],
    },
    locksmith: {
      label: 'Locksmith',
      sub: 'Car lockout · Rekey · Installation',
      subtypes: [],
      groups: [
        {
          label: 'Locksmith Services',
          terms: ['Locksmith', 'Car Lockout', 'House Lockout', 'Lock Rekey', 'Lock Installation'],
        },
      ],
    },
    accounting_cpa: {
      label: 'Accounting & CPA',
      sub: 'Tax · Bookkeeping · Payroll',
      subtypes: ['Tax Preparation', 'Bookkeeping', 'Small Business Accounting'],
      groups: [
        { label: 'Tax Services', terms: ['Tax Preparation', 'Small Business Taxes', 'Tax Planning', 'IRS Resolution'] },
        {
          label: 'Accounting & Bookkeeping',
          terms: [
            'Bookkeeping',
            'Small Business Accounting',
            'Payroll Services',
            'CFO Services',
            'Fractional CFO',
          ],
        },
      ],
    },
    legal: {
      label: 'Law Firm & Attorney',
      sub: 'Personal injury · Family · Estate',
      subtypes: ['Personal Injury', 'Family Law', 'Estate Planning', 'Business Law', 'Criminal Defense'],
      groups: [
        {
          label: 'Practice Areas',
          terms: [
            'Personal Injury Lawyer',
            'Family Law Attorney',
            'Divorce Attorney',
            'Estate Planning Attorney',
            'Wills and Trusts',
            'Business Attorney',
            'Criminal Defense Attorney',
            'Real Estate Attorney',
          ],
        },
      ],
    },
    financial_planning: {
      label: 'Financial Planning',
      sub: 'Retirement · Investments · Wealth',
      subtypes: [],
      groups: [
        {
          label: 'Financial Planning',
          terms: ['Financial Planning', 'Retirement Planning', 'Investment Management', 'Tax Planning'],
        },
      ],
    },
    insurance: {
      label: 'Insurance Agency',
      sub: 'Auto · Home · Business · Life',
      subtypes: ['Auto Insurance', 'Home Insurance', 'Business Insurance', 'Life Insurance'],
      groups: [
        {
          label: 'Insurance Types',
          terms: ['Auto Insurance', 'Home Insurance', 'Business Insurance', 'Life Insurance', 'Health Insurance'],
        },
      ],
    },
    real_estate: {
      label: 'Real Estate',
      sub: 'Buying · Selling · Property management',
      subtypes: ["Buyer's Agent", 'Listing Agent', 'Property Management'],
      groups: [
        {
          label: 'Real Estate Services',
          terms: ['Real Estate Agent', 'Home Buying', 'Home Selling', 'Property Management'],
        },
      ],
    },
    marketing_agency: {
      label: 'Marketing Agency',
      sub: 'Digital · SEO · Web design',
      subtypes: [],
      groups: [
        {
          label: 'Digital Marketing',
          terms: [
            'Digital Marketing',
            'SEO Services',
            'Social Media Marketing',
            'Google Ads Management',
            'PPC Management',
            'Web Design',
          ],
        },
      ],
    },
    it_support: {
      label: 'IT Support',
      sub: 'Managed IT · Computer repair · Network',
      subtypes: ['Managed IT Services', 'Computer Repair', 'IT Consulting'],
      groups: [
        {
          label: 'IT Services',
          terms: ['IT Support', 'Managed IT Services', 'Computer Repair', 'Network & WiFi Setup', 'Cybersecurity'],
        },
      ],
    },
    tutoring: {
      label: 'Tutoring',
      sub: 'Academic · Test prep · Online',
      subtypes: ['Academic Tutoring', 'Test Prep', 'Online Tutoring'],
      groups: [
        {
          label: 'Tutoring',
          terms: [
            'Tutoring',
            'Math Tutoring',
            'Reading Tutoring',
            'Writing Tutoring',
            'SAT Prep',
            'ACT Prep',
            'Online Tutoring',
          ],
        },
      ],
    },
    photography: {
      label: 'Photography',
      sub: 'Wedding · Portrait · Commercial',
      subtypes: ['Wedding Photography', 'Portrait Photography', 'Commercial Photography'],
      groups: [
        {
          label: 'Photography Types',
          terms: [
            'Wedding Photography',
            'Portrait Photography',
            'Commercial Photography',
            'Business Photography',
            'Headshots',
            'Event Photography',
          ],
        },
      ],
    },
  },

  fitness_training: {
    _verticalLabel: 'Fitness & Training',
    gym_fitness_center: {
      label: 'Gym & Fitness Center',
      sub: 'Gym · Health club · Athletic club',
      subtypes: ['Full-Service Gym', 'Boutique Fitness', '24-Hour Gym', 'Athletic Club'],
      groups: [
        {
          label: 'Membership & Access',
          terms: ['Gym Membership', 'No Contract Gym', 'Day Pass', 'Drop-In Gym', 'Open Gym'],
        },
        {
          label: 'Training Services',
          terms: ['Personal Training', 'Small Group Training', 'Group Fitness Classes', 'Online Training'],
        },
        {
          label: 'Equipment & Facilities',
          terms: ['Weight Room', 'Free Weights', 'Cardio Equipment', 'Functional Training', 'Sauna', 'Recovery'],
        },
      ],
    },
    crossfit_functional: {
      label: 'CrossFit & Functional Fitness',
      sub: 'CrossFit · HIIT · Strength & conditioning',
      subtypes: ['CrossFit Affiliate', 'Functional Fitness', 'Strength & Conditioning', 'HIIT Studio'],
      groups: [
        {
          label: 'Training Style',
          terms: [
            'CrossFit',
            'Functional Fitness',
            'HIIT',
            'Strength Training',
            'Strength & Conditioning',
            'Olympic Lifting',
            'Powerlifting',
          ],
        },
        { label: 'Community & Format', terms: ['Daily WOD', 'Drop-In Classes', 'Community Gym'] },
      ],
    },
    yoga_studio: {
      label: 'Yoga Studio',
      sub: 'Yoga · Hot yoga · Meditation',
      subtypes: ['Vinyasa Studio', 'Hot Yoga Studio', 'Restorative Yoga', 'Yin Yoga', 'Meditation Center'],
      groups: [
        {
          label: 'Yoga Style',
          terms: [
            'Yoga Classes',
            'Hot Yoga',
            'Vinyasa Yoga',
            'Restorative Yoga',
            'Yin Yoga',
            'Ashtanga',
            'Prenatal Yoga',
          ],
        },
        {
          label: 'Access & Format',
          terms: [
            'Beginner Yoga',
            'Yoga Classes Near Me',
            'Unlimited Yoga Membership',
            'Drop-In Yoga',
            'Private Yoga Lesson',
          ],
        },
      ],
    },
    pilates_studio: {
      label: 'Pilates Studio',
      sub: 'Reformer · Mat · Clinical pilates',
      subtypes: ['Reformer Studio', 'Mat Pilates Studio', 'Clinical Pilates', 'Therapeutic Pilates'],
      groups: [
        {
          label: 'Pilates Format',
          terms: ['Pilates Classes', 'Reformer Pilates', 'Mat Pilates', 'Clinical Pilates', 'Therapeutic Pilates'],
        },
        {
          label: 'Access & Format',
          terms: ['Beginner Pilates', 'Private Pilates Session', 'Pilates Membership', 'Pilates Class Pack'],
        },
      ],
    },
    personal_trainer: {
      label: 'Personal Trainer',
      sub: '1:1 training · In-home · Online',
      subtypes: ['In-Studio Trainer', 'In-Home Trainer', 'Online Trainer', 'Sports Performance'],
      groups: [
        {
          label: 'Training Goals',
          terms: [
            'Weight Loss',
            'Strength Training',
            'Body Transformation',
            'Sports Performance',
            'Senior Fitness',
            'Post-Rehab Training',
            'Corrective Exercise',
          ],
        },
        {
          label: 'Training Format',
          terms: ['In-Home Training', 'Outdoor Training', 'Online Coaching', 'Virtual Personal Training'],
        },
      ],
    },
    health_coaching: {
      label: 'Health Coaching',
      sub: 'Health · Nutrition · Lifestyle coaching',
      subtypes: ['Health Coach', 'Nutrition Coach', 'Wellness Coach', 'Lifestyle Coach'],
      groups: [
        {
          label: 'Coaching Focus',
          terms: [
            'Health Coaching',
            'Nutrition Coaching',
            'Weight Management',
            'Lifestyle Coaching',
            'Stress & Sleep Coaching',
          ],
        },
        { label: 'Program Format', terms: ['Wellness Program', '1:1 Coaching', 'Group Coaching'] },
      ],
    },
    martial_arts: {
      label: 'Martial Arts',
      sub: 'Boxing · MMA · BJJ · Karate',
      subtypes: ['Boxing Gym', 'MMA Gym', 'BJJ Academy', 'Karate / Taekwondo', 'Kickboxing Studio', 'Muay Thai Gym'],
      groups: [
        {
          label: 'Discipline',
          terms: [
            'Martial Arts',
            'Boxing',
            'MMA',
            'Mixed Martial Arts',
            'Kickboxing',
            'Brazilian Jiu-Jitsu',
            'Karate',
            'Taekwondo',
            'Muay Thai',
          ],
        },
        {
          label: 'Audience & Programs',
          terms: ['Kids Martial Arts', 'Self-Defense', 'Competition Training', 'Fight Team'],
        },
      ],
    },
  },
};

export function getVerticalLabel(vertical: VerticalKey): string {
  return INTAKE_LIBRARY[vertical]._verticalLabel as string;
}

export function listBusinessTypes(vertical: VerticalKey): Array<{ key: string; entry: BusinessTypeEntry }> {
  const vertData = INTAKE_LIBRARY[vertical];
  return Object.entries(vertData)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, entry]) => ({ key, entry: entry as BusinessTypeEntry }));
}

export function getBusinessType(vertical: VerticalKey, bizTypeKey: string): BusinessTypeEntry | null {
  const entry = INTAKE_LIBRARY[vertical][bizTypeKey];
  if (!entry || typeof entry === 'string') return null;
  return entry;
}

const PROFESSIONAL_SERVICE_TYPES = new Set([
  'accounting_cpa',
  'legal',
  'financial_planning',
  'insurance',
  'marketing_agency',
  'it_support',
  'tutoring',
  'photography',
]);

/** Resolve scoring engine vertical key from vertical + business type key. */
export function resolveVerticalKey(vertical: VerticalKey, bizTypeKey: string): string {
  if (vertical === 'food_beverage') return 'restaurant';
  if (vertical === 'beauty_wellness') {
    if (bizTypeKey === 'medspa_aesthetics') return 'medspa';
    return 'salon';
  }
  if (vertical === 'fitness_training') {
    if (bizTypeKey === 'personal_trainer') return 'personal_trainer';
    return 'fitness';
  }
  if (vertical === 'home_professional_services') {
    if (bizTypeKey === 'real_estate') return 'real_estate';
    if (PROFESSIONAL_SERVICE_TYPES.has(bizTypeKey)) return 'professional_service';
    return 'home_trade';
  }
  return 'service';
}

/** Advanced and Premium share one grid (trade-area reach). */
export function resolveScanTierKey(tier: BizTier): ScanTierKey {
  if (tier === 'Basic') return 'basic';
  return 'advanced_premium';
}

export function normalizeDomain(domain: string): string {
  return domain.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function buildBizTypeLabel(typeEntry: BusinessTypeEntry, subtype: string | null): string {
  return subtype ? `${typeEntry.label} / ${subtype}` : typeEntry.label;
}

export interface IntakeFormState {
  bizName: string;
  streetAddress: string;
  cityStateZip: string;
  bizDomain: string;
  gbpPrimaryCategory: string;
  vertical: VerticalKey;
  bizTypeKey: string | null;
  bizSubtype: string | null;
  bizTier: BizTier;
  scanKeywords: string[];
}

export function buildScanIntake(state: IntakeFormState): ScanIntake {
  const typeEntry = state.bizTypeKey ? getBusinessType(state.vertical, state.bizTypeKey) : null;
  if (!typeEntry) {
    throw new Error('Business type is required');
  }

  const bizAddress = `${state.streetAddress.trim()}, ${state.cityStateZip.trim()}`;
  const bizCity = state.cityStateZip.split(',')[0]?.trim() ?? '';

  return {
    bizName: state.bizName.trim(),
    bizAddress,
    bizDomain: normalizeDomain(state.bizDomain.trim()),
    bizCity,
    bizVertical: getVerticalLabel(state.vertical),
    bizType: buildBizTypeLabel(typeEntry, state.bizSubtype),
    verticalKey: resolveVerticalKey(state.vertical, state.bizTypeKey!),
    gbpPrimaryCategory: state.gbpPrimaryCategory.trim() || undefined,
    bizTier: state.bizTier,
    scanTier: resolveScanTierKey(state.bizTier),
    ownerServices: state.scanKeywords,
  };
}
