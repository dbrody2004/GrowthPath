export type PlatformCategory = 'beauty' | 'restaurant' | 'trade' | 'fitness' | 'general';

export interface DetectionContext {
  raw: string;
  htmlLower: string;
  allHrefs: string[];
}

export interface PlatformDefinition {
  id: string;
  category: PlatformCategory;
  detect: (ctx: DetectionContext) => boolean;
}

export const RESTAURANT_PLATFORM_IDS = new Set([
  'toast',
  'slice',
  'chownow',
  'bentobox',
  'popmenu',
  'otter',
  'flipdish',
  'owner',
  'olo',
  'incentivio',
  'thanx',
  'square_restaurants',
]);

export const BEAUTY_WELLNESS_PLATFORM_IDS = new Set([
  'boulevard',
  'vagaro',
  'mindbody',
  'zenoti',
  'booksy',
  'fresha',
  'meevo',
  'myaestheticspro',
  'mangomint',
  'glossgenius',
  'phorest',
  'simplybook',
  'daysmart',
  'athena',
  'jane',
  'setmore',
  'zocdoc',
]);

export const BOOKING_PLATFORM_CATALOG: PlatformDefinition[] = [
  {
    id: 'boulevard',
    category: 'beauty',
    detect: ({ htmlLower }) => htmlLower.includes('blvd.co'),
  },
  {
    id: 'vagaro',
    category: 'beauty',
    detect: ({ htmlLower }) => /vagaro\.com\/[a-z]/.test(htmlLower) && !htmlLower.includes('blvd.co'),
  },
  { id: 'mindbody', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('mindbodyonline.com') },
  { id: 'zenoti', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('zenoti.com') },
  { id: 'booksy', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('booksy.com') },
  { id: 'fresha', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('fresha.com') },
  {
    id: 'acuity',
    category: 'general',
    detect: ({ htmlLower }) => htmlLower.includes('acuityscheduling.com') || htmlLower.includes('as.me'),
  },
  { id: 'calendly', category: 'general', detect: ({ htmlLower }) => htmlLower.includes('calendly.com') },
  {
    id: 'square',
    category: 'general',
    detect: ({ htmlLower }) =>
      htmlLower.includes('squareup.com/appointments') || htmlLower.includes('squareup.com/l/'),
  },
  { id: 'jane', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('janeapp.com') },
  { id: 'mangomint', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('mangomint.com') },
  { id: 'glossgenius', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('glossgenius.com') },
  { id: 'phorest', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('phorest.com') },
  { id: 'simplybook', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('simplybook.me') },
  {
    id: 'daysmart',
    category: 'beauty',
    detect: ({ htmlLower }) => htmlLower.includes('daysmartspa.com') || htmlLower.includes('daysmart.com'),
  },
  { id: 'toast', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('toasttab.com') },
  {
    id: 'otter',
    category: 'restaurant',
    detect: ({ htmlLower }) => htmlLower.includes('tryotter.com') || htmlLower.includes('otterco.com'),
  },
  {
    id: 'bentobox',
    category: 'restaurant',
    detect: ({ htmlLower }) => htmlLower.includes('getbento.com') || htmlLower.includes('bentobox.com'),
  },
  { id: 'slice', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('slicelife.com') },
  {
    id: 'owner',
    category: 'restaurant',
    detect: ({ htmlLower, raw }) =>
      htmlLower.includes('owner.com') ||
      htmlLower.includes('awwybhhmo') ||
      /\/[a-z0-9]{7,8}\/[^/]+-order-online/.test(htmlLower) ||
      /\/[a-z0-9]{7,8}\/[^/]+-order-online/.test(raw),
  },
  { id: 'popmenu', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('popmenu.com') },
  { id: 'flipdish', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('flipdish.com') },
  { id: 'chownow', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('chownow.com') },
  {
    id: 'olo',
    category: 'restaurant',
    detect: ({ htmlLower }) => htmlLower.includes('olo.com') || htmlLower.includes('olosolutions.com'),
  },
  { id: 'incentivio', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('incentivio.com') },
  { id: 'thanx', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('thanx.com') },
  { id: 'clover', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('clover.com/online-ordering') },
  {
    id: 'square_restaurants',
    category: 'restaurant',
    detect: ({ htmlLower }) =>
      htmlLower.includes('squareup.com/restaurants') || htmlLower.includes('squareup.com/online/checkout'),
  },
  {
    id: 'lightspeed',
    category: 'restaurant',
    detect: ({ htmlLower }) => htmlLower.includes('lightspeedpos.com') || htmlLower.includes('lightspeedhq.com'),
  },
  { id: 'squarespace', category: 'general', detect: ({ htmlLower }) => htmlLower.includes('squarespace.com/book') },
  {
    id: 'wix',
    category: 'general',
    detect: ({ htmlLower }) => htmlLower.includes('wixsite.com/booking') || htmlLower.includes('wix.com/booking'),
  },
  { id: 'meevo', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('meevo.com') },
  { id: 'setmore', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('setmore.com') },
  { id: 'zocdoc', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('zocdoc.com') },
  { id: 'opentable', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('opentable.com') },
  { id: 'resy', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('resy.com') },
  { id: 'tock', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('exploretock.com') },
  { id: 'spoton', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('spoton.com') },
  { id: 'sevenrooms', category: 'restaurant', detect: ({ htmlLower }) => htmlLower.includes('sevenrooms.com') },
  { id: 'myaestheticspro', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('myaestheticspro.com') },
  { id: 'athena', category: 'beauty', detect: ({ htmlLower }) => htmlLower.includes('scheduling.athena.io') },
  {
    id: 'servicetitan',
    category: 'trade',
    detect: ({ htmlLower, raw }) =>
      htmlLower.includes('servicetitan.com') ||
      htmlLower.includes('static.servicetitan.com/webscheduler') ||
      raw.includes('STWidgetManager'),
  },
  {
    id: 'housecall',
    category: 'trade',
    detect: ({ htmlLower, raw }) =>
      htmlLower.includes('housecallpro.com') ||
      htmlLower.includes('online-booking.housecallpro.com') ||
      raw.includes('HCPWidget') ||
      htmlLower.includes('hcp-lead-iframe'),
  },
  {
    id: 'jobber',
    category: 'trade',
    detect: ({ htmlLower }) =>
      htmlLower.includes('getjobber.com') ||
      htmlLower.includes('jobber.com') ||
      htmlLower.includes('clienthub.getjobber.com') ||
      htmlLower.includes('d3ey4dbjkt2f6s.cloudfront.net'),
  },
  { id: 'workiz', category: 'trade', detect: ({ htmlLower }) => htmlLower.includes('workiz.com') },
  { id: 'fieldedge', category: 'trade', detect: ({ htmlLower }) => htmlLower.includes('fieldedge.com') },
  { id: 'kickserv', category: 'trade', detect: ({ htmlLower }) => htmlLower.includes('kickserv.com') },
  { id: 'servicefusion', category: 'trade', detect: ({ htmlLower }) => htmlLower.includes('servicefusion.com') },
  { id: 'glofox', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('glofox.com') },
  { id: 'pike13', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('pike13.com') },
  { id: 'zen_planner', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('zenplanner.com') },
  { id: 'wellnessliving', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('wellnessliving.com') },
  { id: 'teamup', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('teamup.com') },
  { id: 'wodify', category: 'fitness', detect: ({ htmlLower }) => htmlLower.includes('wodify.com') },
];

export function detectAllPlatforms(ctx: DetectionContext): string[] {
  return BOOKING_PLATFORM_CATALOG.filter((platform) => platform.detect(ctx)).map((platform) => platform.id);
}

export function isFoodBeverageVertical(vertical: string): boolean {
  const v = vertical.toLowerCase();
  return v.includes('food') || v.includes('beverage') || v === 'restaurant';
}

export function isBeautyWellnessVertical(vertical: string): boolean {
  const v = vertical.toLowerCase();
  return v.includes('beauty') || v.includes('wellness') || v === 'medspa' || v === 'salon';
}

export function filterScoringPlatforms(
  detectedPlatforms: string[],
  vertical: string,
): { scoringPlatforms: string[]; excludedPlatforms: string[] } {
  const isFood = isFoodBeverageVertical(vertical);
  const isBeauty = isBeautyWellnessVertical(vertical);
  const scoringPlatforms: string[] = [];
  const excludedPlatforms: string[] = [];

  for (const platform of detectedPlatforms) {
    const excludedForVertical =
      (RESTAURANT_PLATFORM_IDS.has(platform) && !isFood) ||
      (BEAUTY_WELLNESS_PLATFORM_IDS.has(platform) && !isBeauty);
    if (excludedForVertical) {
      excludedPlatforms.push(platform);
    } else {
      scoringPlatforms.push(platform);
    }
  }

  return { scoringPlatforms, excludedPlatforms };
}

export const BOOKING_SLUG_INTERNAL =
  /\/(book(?:ing|[-_]now|[-_]online|[-_]appointment|[-_]service)?|schedul(?:e|ing)(?:[-_]service|[-_]appointment|[-_]now)?|appointment(?:s)?|online[-_]booking|scorpion[-_]scheduling|get[-_]an?[-_](estimate|quote)|request[-_]an?[-_](estimate|quote)|free[-_](estimate|quote)s?|(estimate|quote)s?(?:[-_]form)?)(?:\/|$|\?)/i;

export const BOOKING_SLUG_EXCLUSIONS =
  /\/(blog|news|faq|about|review|coupon|financ|career|press|tip|guide)/i;

export const EXTERNAL_BOOKING_PATH = /\/(book|schedule|appointment|reserve)/i;

export const BOOKING_SUBDOMAIN_FALLBACK = /^https?:\/\/(web\d+|book|app|booking|schedule|portal|client)\./i;

export const BOOKING_CTA_HASH =
  /<(a|button)[^>]+href=["']#["'][^>]*>\s*([^<]*(book\s+online|book\s+now|book\s+an?\s+appointment|book\s+a?\s*service|book\s+your\s+service|schedule\s+now|schedule\s+online|schedule\s+your\s+service|schedule\s+today|easy\s+online\s+booking)[^<]*)\s*<\/(?:a|button)>/i;

export const QUOTE_CTA_PATTERN =
  /(get\s+a?\s*free\s+(quote|estimate)|request\s+a?\s*(free\s+)?(quote|estimate)|free\s+(quote|estimate)|get\s+a?\s*(quote|estimate)|free\s+inspection|free\s+consultation|schedule\s+service|get\s+a\s+bid)/i;

export const QUOTE_FORM_ATTRS =
  /(form[^>]+(id|class|name|action)=["'][^"']*(quote|estimate|get-started|free-)[^"']*["'])/i;

export const CONTACT_ONLY_PATTERN = /\/(contact|contact-us|get-in-touch|reach-us|request)/i;

export interface BookingPathClassification {
  bookingPathType: 'named_platform' | 'generic_booking' | 'quote_form' | 'contact_form_only' | 'none';
  bookingDetectionMethod: string | null;
  bookingInternalSlug: string | null;
  scoringPlatforms: string[];
  excludedPlatforms: string[];
  leadCapturePlatforms: string[];
  bookingEvidence: string[];
}

export function detectLeadCapturePlatforms(ctx: DetectionContext): string[] {
  const platforms: string[] = [];
  if (
    ctx.htmlLower.includes('form.jotform.com/jsform/') ||
    /iframe[^>]+src=["'][^"']*jotform\.com/.test(ctx.htmlLower)
  ) {
    platforms.push('jotform');
  }
  if (
    ctx.htmlLower.includes('embed.typeform.com') ||
    ctx.htmlLower.includes('data-tf-widget') ||
    ctx.htmlLower.includes('data-tf-popup')
  ) {
    platforms.push('typeform');
  }
  if (
    (ctx.htmlLower.includes('js.hsforms.net') && ctx.raw.includes('hbspt.forms.create')) ||
    ctx.htmlLower.includes('meetings-iframe-container')
  ) {
    platforms.push('hubspot_forms');
  }
  return platforms;
}

export function classifyBookingPath(
  ctx: DetectionContext,
  vertical: string,
  clientDomain: string,
): BookingPathClassification {
  const allDetected = detectAllPlatforms(ctx);
  const { scoringPlatforms, excludedPlatforms } = filterScoringPlatforms(allDetected, vertical);
  const leadCapturePlatforms = detectLeadCapturePlatforms(ctx);
  const bookingEvidence: string[] = [];

  if (excludedPlatforms.length > 0) {
    bookingEvidence.push(`excluded_for_vertical:${excludedPlatforms.join(',')}`);
  }

  const externalBookingHrefs = ctx.allHrefs.filter(
    (href) =>
      href.startsWith('http') &&
      !href.toLowerCase().includes(clientDomain) &&
      EXTERNAL_BOOKING_PATH.test(href),
  );
  const hasBookingUrl = externalBookingHrefs.length > 0;
  if (hasBookingUrl) {
    bookingEvidence.push(`external_url:${externalBookingHrefs[0]}`);
  }

  const subdomainBookingHrefs =
    isBeautyWellnessVertical(vertical)
      ? ctx.allHrefs.filter(
          (href) =>
            href.startsWith('http') &&
            !href.toLowerCase().includes(clientDomain) &&
            BOOKING_SUBDOMAIN_FALLBACK.test(href),
        )
      : [];
  const hasBookingSubdomain = subdomainBookingHrefs.length > 0;
  if (hasBookingSubdomain) {
    bookingEvidence.push(`external_subdomain:${subdomainBookingHrefs[0]}`);
  }

  const ctaHashMatch = ctx.raw.match(BOOKING_CTA_HASH);
  const hasBookingCtaHash = Boolean(ctaHashMatch);
  if (hasBookingCtaHash) {
    bookingEvidence.push('cta_hash');
  }

  let internalSlug: string | null = null;
  for (const href of ctx.allHrefs) {
    const isInternal =
      href.startsWith('/') || (href.startsWith('http') && href.toLowerCase().includes(clientDomain));
    if (!isInternal) continue;
    if (!BOOKING_SLUG_INTERNAL.test(href)) continue;
    if (BOOKING_SLUG_EXCLUSIONS.test(href)) continue;
    internalSlug = href;
    break;
  }
  if (internalSlug) {
    bookingEvidence.push(`internal_slug:${internalSlug}`);
  }

  const hasQuoteForm = QUOTE_CTA_PATTERN.test(ctx.htmlLower) || QUOTE_FORM_ATTRS.test(ctx.htmlLower);
  const hasContactOnly = CONTACT_ONLY_PATTERN.test(ctx.htmlLower);

  if (scoringPlatforms.length > 0) {
    bookingEvidence.push(`named_platform:${scoringPlatforms.join(',')}`);
    return {
      bookingPathType: 'named_platform',
      bookingDetectionMethod: null,
      bookingInternalSlug: internalSlug,
      scoringPlatforms,
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (hasBookingUrl) {
    return {
      bookingPathType: 'generic_booking',
      bookingDetectionMethod: 'external_url',
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['generic'],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (hasBookingSubdomain) {
    return {
      bookingPathType: 'generic_booking',
      bookingDetectionMethod: 'external_subdomain',
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['generic'],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (hasBookingCtaHash) {
    return {
      bookingPathType: 'generic_booking',
      bookingDetectionMethod: 'cta_hash',
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['generic'],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (internalSlug) {
    return {
      bookingPathType: 'generic_booking',
      bookingDetectionMethod: 'internal_slug',
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['generic'],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (hasQuoteForm || leadCapturePlatforms.length > 0) {
    if (hasQuoteForm) bookingEvidence.push('quote_form');
    return {
      bookingPathType: 'quote_form',
      bookingDetectionMethod: null,
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['quote_form', ...leadCapturePlatforms],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  if (hasContactOnly) {
    bookingEvidence.push('contact_form_only');
    return {
      bookingPathType: 'contact_form_only',
      bookingDetectionMethod: null,
      bookingInternalSlug: internalSlug,
      scoringPlatforms: ['contact_form'],
      excludedPlatforms,
      leadCapturePlatforms,
      bookingEvidence,
    };
  }

  return {
    bookingPathType: 'none',
    bookingDetectionMethod: null,
    bookingInternalSlug: internalSlug,
    scoringPlatforms: [],
    excludedPlatforms,
    leadCapturePlatforms,
    bookingEvidence,
  };
}
