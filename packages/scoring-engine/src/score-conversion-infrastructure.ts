import type { Finding, HtmlData, SignalPts } from '@growthpath/shared';

const MEMBERSHIP_TYPES = new Set([
  'gym',
  'fitness',
  'yoga_studio',
  'pilates_studio',
  'crossfit_gym',
  'fitness_center',
  'boxing_gym',
  'health_club',
]);
const HOME_TRADE_TYPES = new Set(['home_trade']);
const PROF_SERVICE_TYPES = new Set(['professional_service', 'real_estate']);

const HTML_SCANNER_CAVEAT =
  'Note: our scanner reads page HTML directly and may not detect booking or contact forms that load via JavaScript or third-party widgets.';

export function scoreConversionInfrastructure(
  html: HtmlData,
  vertical = 'service',
): [number, Finding[], SignalPts] {
  let points = 0;
  const findings: Finding[] = [];

  const isMembershipModel = MEMBERSHIP_TYPES.has(vertical);
  const isMedspa = vertical === 'medspa';
  const isQuoteModel = HOME_TRADE_TYPES.has(vertical) || PROF_SERVICE_TYPES.has(vertical);

  const bookingPathType = html.booking_path_type ?? 'none';
  const bookingDetectionMethod = html.booking_detection_method;
  const bookingInternalSlug = html.booking_internal_slug;
  const leadCapturePlatforms = html.lead_capture_platforms ?? [];
  const platforms = html.booking_platforms ?? [];
  const excludedPlatforms = html.excluded_booking_platforms ?? [];
  const ctc = html.click_to_call ?? false;
  const ga4 = html.ga4 ?? false;
  const gtm = html.gtm ?? false;

  if (excludedPlatforms.length > 0 && bookingPathType !== 'named_platform') {
    findings.push({
      text: `Detected booking-related platforms excluded for this vertical: ${excludedPlatforms.join(', ')}. These do not count toward conversion scoring unless they match your business model.`,
      severity: 'warning',
    });
  }

  if (bookingPathType === 'named_platform') {
    points += 40;
    const platformLabel =
      platforms.filter((p) => !['generic', 'contact_form', 'quote_form'].includes(p)).join(', ') || 'detected';
    findings.push({
      text: `Booking path confirmed (${platformLabel}). CTA visibility requires manual mobile verification.`,
      severity: 'good',
    });
  } else if (bookingPathType === 'generic_booking') {
    if (isQuoteModel) {
      points += bookingDetectionMethod === 'internal_slug' ? 30 : 25;
      if (bookingDetectionMethod === 'internal_slug') {
        const slugDisplay = bookingInternalSlug ?? 'a dedicated scheduling page';
        findings.push({
          text: `Dedicated scheduling page detected (${slugDisplay}). Verify the page loads a working scheduler — if it does, your booking path is solid. Confirm a prominent button links to it above the fold on mobile. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else if (bookingDetectionMethod === 'cta_hash') {
        findings.push({
          text: `Online booking detected — visitors can self-schedule directly from your homepage. The platform isn't identified (it's loaded by JavaScript). Verify the booking flow works on mobile and that the button is visible above the fold without scrolling. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else if (bookingDetectionMethod === 'external_subdomain') {
        findings.push({
          text: `Booking infrastructure detected on an external scheduling subdomain. Verify the scheduler loads correctly on mobile and is linked prominently above the fold. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else {
        findings.push({
          text: `A scheduling link was detected. For service businesses, a dedicated quote or estimate request form converts better than a generic booking link — it captures job details upfront and sets clearer expectations before the first call. ${HTML_SCANNER_CAVEAT}`,
          severity: 'warning',
          kb_key: 'BOOKING_PATH_MISSING',
        });
      }
    } else {
      points += 30;
      if (bookingDetectionMethod === 'internal_slug') {
        const slugDisplay = bookingInternalSlug ?? 'a dedicated scheduling page';
        findings.push({
          text: `Dedicated scheduling page detected (${slugDisplay}). Verify the page loads a working scheduler and is prominently linked above the fold on mobile. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else if (bookingDetectionMethod === 'cta_hash') {
        findings.push({
          text: `Online booking detected — visitors can self-schedule directly from your homepage. Platform not identified (JS-rendered). Verify the booking flow works on mobile and is prominently placed above the fold. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else if (bookingDetectionMethod === 'external_subdomain') {
        findings.push({
          text: `Booking infrastructure detected on an external scheduling subdomain. Verify the scheduler loads correctly on mobile and is linked prominently above the fold. ${HTML_SCANNER_CAVEAT}`,
          severity: 'good',
        });
      } else {
        findings.push({
          text: `A scheduling link was detected, but no industry-specific booking platform was identified. Most competitors in this space use dedicated platforms (Mindbody, Boulevard, Vagaro, Zenoti, Fresha) that offer integrated scheduling, reminders, and client management. Worth evaluating whether a platform upgrade would improve booking conversion. ${HTML_SCANNER_CAVEAT}`,
          severity: 'warning',
          kb_key: 'BOOKING_PATH_MISSING',
        });
      }
    }
  } else if (bookingPathType === 'quote_form') {
    if (isQuoteModel) {
      points += 35;
      if (leadCapturePlatforms.length > 0) {
        const platformNames = leadCapturePlatforms.map((p) => p.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())).join(', ');
        findings.push({
          text: `Quote or estimate request form detected (${platformNames}) — the right conversion path for a service business. The form is the right tool. The gap is what happens next: 50% of service jobs go to whoever responds first. Set up immediate SMS/email alerts on every submission and aim to respond within 1 hour during business hours. ${HTML_SCANNER_CAVEAT}`,
          severity: 'warning',
          kb_key: 'QUOTE_FORM_DETECTED',
        });
      } else {
        findings.push({
          text: `Quote request form detected — the right conversion path for a service business. The gap isn't the form, it's response time. Studies show 50% of service jobs go to the first business that responds. Aim to respond to every inquiry within 1 hour during business hours. ${HTML_SCANNER_CAVEAT}`,
          severity: 'warning',
          kb_key: 'QUOTE_FORM_DETECTED',
        });
      }
    } else {
      points += 10;
      findings.push({
        text: `Contact form detected but no dedicated booking path. Visitors who want to schedule must wait for a callback — adding a self-scheduling link removes that friction. ${HTML_SCANNER_CAVEAT}`,
        severity: 'warning',
        kb_key: 'BOOKING_PATH_MISSING',
      });
    }
  } else if (bookingPathType === 'contact_form_only') {
    if (isMembershipModel) {
      points += 25;
      findings.push({
        text: `Contact/inquiry form detected. For membership-based fitness businesses, this is the expected conversion path — ensure the form is prominent on mobile and above the fold. ${HTML_SCANNER_CAVEAT}`,
        severity: 'good',
      });
    } else if (isQuoteModel) {
      points += 10;
      findings.push({
        text: `Contact form only — no quote or estimate request path detected. Service businesses convert significantly better when the form explicitly invites a quote or estimate. Rename your form, update the CTA button text, and add a project description field. This signals clear intent and sets visitor expectations before they submit. ${HTML_SCANNER_CAVEAT}`,
        severity: 'warning',
        kb_key: 'CONTACT_FORM_ONLY_SERVICE',
      });
    } else if (isMedspa) {
      points += 10;
      findings.push({
        text: `No online booking platform detected. For a medical spa offering appointment-based services, a contact form creates unnecessary friction — visitors who are ready to book now have to wait for a callback. Platforms like Boulevard, Vagaro, and Fresha offer medspa-specific scheduling and are standard in this space. ${HTML_SCANNER_CAVEAT}`,
        severity: 'critical',
        kb_key: 'BOOKING_PATH_MISSING',
      });
    } else {
      points += 10;
      findings.push({
        text: `Contact form detected but no dedicated booking path. Visitors who want to schedule must wait for a callback — adding a self-scheduling link removes that friction. Note: a booking platform may not be applicable if your business primarily serves walk-in customers. Our scanner reads page HTML directly and may not detect booking or contact forms that load via JavaScript or third-party widgets.`,
        severity: 'warning',
        kb_key: 'BOOKING_PATH_MISSING',
      });
    }
  } else if (isQuoteModel) {
    findings.push({
      text: `No contact form or quote request path detected. For service businesses, this is a critical conversion gap — visitors who want to reach out have no frictionless way to do so. A simple contact form with a response time promise is the minimum viable fix. Note: our scanner reads page HTML directly and may not detect forms that load via JavaScript or third-party widgets. If your site has a working form, this finding may not apply.`,
      severity: 'critical',
      kb_key: 'BOOKING_PATH_MISSING',
    });
  } else {
    findings.push({
      text: `No booking path detected. If your business takes appointments or reservations, this is a critical conversion gap — visitors have no way to self-schedule. Note: a booking platform may not be applicable if your business primarily serves walk-in customers. Our scanner reads page HTML directly and may not detect booking or contact forms that load via JavaScript or third-party widgets. If your site has a working form, this finding may not apply.`,
      severity: 'critical',
      kb_key: 'BOOKING_PATH_MISSING',
    });
  }

  if (ctc) {
    points += 20;
  } else {
    findings.push({
      text: 'No click-to-call link detected on your homepage. This scan checks the homepage only — if your phone number is linked elsewhere on your site, ensure it is also prominently accessible on the homepage header or above the fold. See appendix for best practices.',
      severity: 'critical',
      kb_key: 'CLICK_TO_CALL_MISSING',
    });
  }

  if (ga4 && gtm) {
    points += 40;
    findings.push({
      text: 'GA4 via GTM detected — strongest analytics setup. Verify conversion events are configured.',
      severity: 'good',
    });
  } else if (ga4) {
    points += 25;
    findings.push({
      text: 'GA4 detected without GTM. Conversion event configuration should be verified.',
      severity: 'warning',
      kb_key: 'ANALYTICS_MISSING',
    });
  } else {
    findings.push({
      text: 'No GA4 detected. Business is blind to website performance.',
      severity: 'critical',
      kb_key: 'ANALYTICS_MISSING',
    });
  }

  let bookingE = 0;
  if (bookingPathType === 'named_platform') {
    bookingE = 40;
  } else if (bookingPathType === 'generic_booking') {
    bookingE =
      isQuoteModel &&
      bookingDetectionMethod !== 'internal_slug' &&
      (bookingDetectionMethod === 'cta_hash' ||
        bookingDetectionMethod === 'external_url' ||
        bookingDetectionMethod === 'external_subdomain')
        ? 25
        : 30;
  } else if (bookingPathType === 'quote_form') {
    bookingE = isQuoteModel ? 35 : 10;
  } else if (bookingPathType === 'contact_form_only') {
    bookingE = isMembershipModel ? 25 : 10;
  }

  const ctcE = ctc ? 20 : 0;
  const analyticsE = ga4 && gtm ? 40 : ga4 ? 25 : 0;

  const convSignalPts: SignalPts = {
    booking: { earned: bookingE, max: 40 },
    click_to_call: { earned: ctcE, max: 20 },
    analytics: { earned: analyticsE, max: 40 },
  };

  return [Math.min(100, points), findings, convSignalPts];
}
