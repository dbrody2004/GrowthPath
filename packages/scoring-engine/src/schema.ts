import type { Finding } from '@growthpath/shared';

export const GBP_TO_SCHEMA: Record<string, string> = {
  restaurant: 'Restaurant',
  american_restaurant: 'Restaurant',
  italian_restaurant: 'Restaurant',
  mexican_restaurant: 'Restaurant',
  chinese_restaurant: 'Restaurant',
  japanese_restaurant: 'Restaurant',
  thai_restaurant: 'Restaurant',
  indian_restaurant: 'Restaurant',
  french_restaurant: 'Restaurant',
  mediterranean_restaurant: 'Restaurant',
  seafood_restaurant: 'Restaurant',
  steak_house: 'Restaurant',
  sushi_restaurant: 'Restaurant',
  pizza_restaurant: 'Restaurant',
  ramen_restaurant: 'Restaurant',
  vegetarian_restaurant: 'Restaurant',
  vegan_restaurant: 'Restaurant',
  brunch_restaurant: 'Restaurant',
  breakfast_restaurant: 'Restaurant',
  sandwich_shop: 'Restaurant',
  fast_food_restaurant: 'FastFoodRestaurant',
  hamburger_restaurant: 'FastFoodRestaurant',
  bakery: 'Bakery',
  donut_shop: 'Bakery',
  bagel_shop: 'Bakery',
  cafe: 'CafeOrCoffeeShop',
  coffee_shop: 'CafeOrCoffeeShop',
  tea_house: 'CafeOrCoffeeShop',
  bar: 'BarOrPub',
  pub: 'BarOrPub',
  wine_bar: 'BarOrPub',
  cocktail_bar: 'BarOrPub',
  sports_bar: 'BarOrPub',
  night_club: 'BarOrPub',
  brewery: 'Brewery',
  winery: 'Winery',
  distillery: 'LocalBusiness',
  food_truck: 'Restaurant',
  ice_cream_shop: 'Restaurant',
  juice_shop: 'CafeOrCoffeeShop',
  bubble_tea_store: 'CafeOrCoffeeShop',
  hair_salon: 'HairSalon',
  hair_care: 'HairSalon',
  barber_shop: 'HairSalon',
  nail_salon: 'NailSalon',
  beauty_salon: 'BeautySalon',
  day_spa: 'DaySpa',
  spa: 'DaySpa',
  massage_therapist: 'HealthAndBeautyBusiness',
  massage_spa: 'HealthAndBeautyBusiness',
  tanning_studio: 'HealthAndBeautyBusiness',
  waxing_hair_removal_service: 'HealthAndBeautyBusiness',
  eyebrow_bar: 'BeautySalon',
  eyelash_salon: 'BeautySalon',
  makeup_artist: 'BeautySalon',
  tattoo_shop: 'HealthAndBeautyBusiness',
  piercing_shop: 'HealthAndBeautyBusiness',
  medical_spa: 'MedSpa',
  med_spa: 'MedSpa',
  skin_care_clinic: 'MedSpa',
  dermatologist: 'Physician',
  plastic_surgeon: 'Physician',
  doctor: 'Physician',
  dentist: 'Dentist',
  orthodontist: 'Dentist',
  oral_surgeon: 'Dentist',
  optometrist: 'MedicalBusiness',
  chiropractor: 'MedicalBusiness',
  physical_therapist: 'MedicalBusiness',
  acupuncturist: 'MedicalBusiness',
  mental_health_clinic: 'MedicalBusiness',
  urgent_care_center: 'MedicalBusiness',
  hospital: 'MedicalBusiness',
  pharmacy: 'MedicalBusiness',
  veterinarian: 'VeterinaryCare',
  gym: 'ExerciseGym',
  fitness_center: 'ExerciseGym',
  health_club: 'HealthClub',
  yoga_studio: 'SportsActivityLocation',
  pilates_studio: 'SportsActivityLocation',
  cycling_studio: 'SportsActivityLocation',
  dance_studio: 'SportsActivityLocation',
  martial_arts_school: 'SportsActivityLocation',
  boxing_gym: 'SportsActivityLocation',
  crossfit_gym: 'ExerciseGym',
  personal_trainer: 'LocalBusiness',
  sports_club: 'SportsActivityLocation',
  swimming_pool: 'SportsActivityLocation',
  golf_course: 'SportsActivityLocation',
  tennis_court: 'SportsActivityLocation',
  climbing_gym: 'SportsActivityLocation',
  plumber: 'Plumber',
  electrician: 'Electrician',
  hvac_contractor: 'HVACBusiness',
  roofing_contractor: 'RoofingContractor',
  locksmith: 'LocksmithBusiness',
  moving_company: 'MovingCompany',
  house_painter: 'HousePainter',
  general_contractor: 'GeneralContractor',
  landscaper: 'HomeAndConstructionBusiness',
  lawn_care_service: 'HomeAndConstructionBusiness',
  cleaning_service: 'HomeAndConstructionBusiness',
  pest_control_service: 'HomeAndConstructionBusiness',
  window_cleaning_service: 'HomeAndConstructionBusiness',
  pool_cleaning_service: 'HomeAndConstructionBusiness',
  carpet_cleaning_service: 'HomeAndConstructionBusiness',
  handyman: 'HomeAndConstructionBusiness',
  interior_designer: 'HomeAndConstructionBusiness',
  flooring_store: 'HomeAndConstructionBusiness',
  car_dealer: 'AutoDealer',
  used_car_dealer: 'AutoDealer',
  auto_repair_shop: 'AutoRepair',
  car_wash: 'AutoRepair',
  tire_shop: 'AutoRepair',
  oil_change_service: 'AutoRepair',
  pet_store: 'PetStore',
  dog_groomer: 'HealthAndBeautyBusiness',
  pet_groomer: 'HealthAndBeautyBusiness',
  dog_trainer: 'LocalBusiness',
  kennel: 'LocalBusiness',
  animal_shelter: 'AnimalShelter',
  clothing_store: 'ClothingStore',
  shoe_store: 'ClothingStore',
  jewelry_store: 'Store',
  book_store: 'Store',
  gift_shop: 'Store',
  florist: 'Store',
  furniture_store: 'FurnitureStore',
  electronics_store: 'Store',
  toy_store: 'Store',
  sporting_goods_store: 'Store',
  accounting: 'ProfessionalService',
  lawyer: 'ProfessionalService',
  real_estate_agency: 'ProfessionalService',
  insurance_agency: 'ProfessionalService',
  financial_planner: 'ProfessionalService',
  marketing_agency: 'ProfessionalService',
  photographer: 'ProfessionalService',
  travel_agency: 'ProfessionalService',
  printing_service: 'ProfessionalService',
  tutoring_service: 'ProfessionalService',
};

export const VALID_LOCAL_SCHEMA_TYPES = new Set([
  'LocalBusiness',
  'ProfessionalService',
  'Restaurant',
  'FastFoodRestaurant',
  'Bakery',
  'CafeOrCoffeeShop',
  'BarOrPub',
  'Brewery',
  'Winery',
  'BeautySalon',
  'HairSalon',
  'NailSalon',
  'DaySpa',
  'HealthAndBeautyBusiness',
  'MedicalBusiness',
  'MedSpa',
  'Dentist',
  'Physician',
  'ExerciseGym',
  'HealthClub',
  'SportsActivityLocation',
  'HomeAndConstructionBusiness',
  'Plumber',
  'Electrician',
  'HVACBusiness',
  'RoofingContractor',
  'LocksmithBusiness',
  'MovingCompany',
  'HousePainter',
  'GeneralContractor',
  'AutoDealer',
  'AutoRepair',
  'AnimalShelter',
  'VeterinaryCare',
  'PetStore',
  'Store',
  'ClothingStore',
  'FurnitureStore',
]);

export interface SchemaEvaluation {
  status: 'present' | 'org_only' | 'missing';
  score_pts: number;
  recommended: string;
  detected: string | null;
  finding: Finding;
}

export function getRecommendedSchema(primaryType: string | null | undefined): string {
  if (!primaryType) return 'LocalBusiness';
  const normalized = primaryType.toLowerCase().trim().replace(/ /g, '_').replace(/-/g, '_');
  return GBP_TO_SCHEMA[normalized] ?? 'LocalBusiness';
}

export function evaluateSchema(
  primaryType: string | null | undefined,
  detectedSchemaTypes: string[] | null | undefined,
): SchemaEvaluation {
  const recommended = getRecommendedSchema(primaryType);
  const gbpLabel = primaryType ? primaryType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Unknown';
  const types = detectedSchemaTypes ?? [];
  const detectedLocal = types.filter((t) => VALID_LOCAL_SCHEMA_TYPES.has(t));
  const hasOrg = types.includes('Organization');

  if (detectedLocal.length === 0 && !hasOrg) {
    return {
      status: 'missing',
      score_pts: 0,
      recommended,
      detected: null,
      finding: {
        text:
          `No LocalBusiness schema detected. Your GBP category is ${gbpLabel} -- ` +
          `add ${recommended} schema to match. Schema tells Google exactly what ` +
          `your business is and where it operates. Under 30 minutes to implement.`,
        severity: 'critical',
        kb_key: 'LBS_MISSING',
      },
    };
  }

  if (detectedLocal.length === 0 && hasOrg) {
    return {
      status: 'org_only',
      score_pts: 8,
      recommended,
      detected: 'Organization',
      finding: {
        text:
          `Organization schema detected but no LocalBusiness type. ` +
          `Your GBP category is ${gbpLabel} -- add ${recommended} schema to match. ` +
          `Organization carries no local entity signals: no address, no geo, ` +
          `no service area. Google cannot read it for Map Pack eligibility.`,
        severity: 'warning',
        kb_key: 'LBS_MISSING',
      },
    };
  }

  const detectedType = detectedLocal[0];
  return {
    status: 'present',
    score_pts: 25,
    recommended,
    detected: detectedType,
    finding: {
      text:
        `${detectedType} schema detected. Your GBP category is ${gbpLabel} -- ` +
        `verify these align. Schema type and GBP category are two of Google's ` +
        `primary entity confirmation sources; a mismatch between them sends ` +
        `contradictory signals about what kind of business you are.`,
      severity: 'good',
    },
  };
}
