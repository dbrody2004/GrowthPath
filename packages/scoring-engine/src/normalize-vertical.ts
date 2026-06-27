export function normalizeVertical(
  bizVertical: string | null | undefined,
  primaryType?: string | null,
  bizType?: string | null,
): string {
  const v = (bizVertical ?? '').trim();
  const pt = (primaryType ?? '').toLowerCase();
  const bt = (bizType ?? '').toLowerCase();
  const vLower = v.toLowerCase();

  if (vLower.includes('food') || vLower.includes('beverage')) {
    return 'restaurant';
  }

  if (vLower.includes('beauty') || vLower.includes('wellness')) {
    const medspaTypes = new Set([
      'medical_spa',
      'med_spa',
      'skin_care_clinic',
      'laser_hair_removal_service',
      'aesthetics',
    ]);
    return medspaTypes.has(pt) ? 'medspa' : 'salon';
  }

  if (
    vLower.includes('fitness') ||
    vLower.includes('gym') ||
    vLower.includes('crossfit') ||
    vLower.includes('training') ||
    vLower.includes('yoga') ||
    vLower.includes('pilates') ||
    vLower.includes('spin')
  ) {
    return 'gym';
  }

  if (vLower.includes('home') || vLower.includes('professional')) {
    if (bt.includes('real estate') || bt.includes('real_estate') || bt.includes('realtor')) {
      return 'real_estate';
    }
    const profBizTypes = [
      'accounting',
      'cpa',
      'legal',
      'law',
      'attorney',
      'financial',
      'insurance',
      'marketing',
      'it support',
      'it_support',
      'tutoring',
      'photography',
    ];
    if (profBizTypes.some((p) => bt.includes(p))) {
      return 'professional_service';
    }
    return 'home_trade';
  }

  const knownKeys = new Set([
    'restaurant',
    'medspa',
    'salon',
    'gym',
    'fitness',
    'service',
    'home_trade',
    'professional_service',
    'real_estate',
  ]);
  if (knownKeys.has(vLower)) {
    return vLower;
  }

  return 'service';
}
