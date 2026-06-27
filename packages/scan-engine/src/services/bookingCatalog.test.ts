import { describe, expect, it } from 'vitest';
import {
  classifyBookingPath,
  detectAllPlatforms,
  filterScoringPlatforms,
} from './bookingCatalog.js';

describe('detectAllPlatforms', () => {
  it('detects trade and beauty platforms from HTML fingerprints', () => {
    const ctx = {
      raw: '<script>STWidgetManager.init()</script>',
      htmlLower: 'static.servicetitan.com/webscheduler mindbodyonline.com',
      allHrefs: [],
    };
    expect(detectAllPlatforms(ctx)).toEqual(expect.arrayContaining(['servicetitan', 'mindbody']));
  });
});

describe('filterScoringPlatforms', () => {
  it('excludes restaurant platforms for non-F&B verticals', () => {
    const { scoringPlatforms, excludedPlatforms } = filterScoringPlatforms(
      ['toast', 'servicetitan'],
      'Fitness & Training',
    );
    expect(scoringPlatforms).toEqual(['servicetitan']);
    expect(excludedPlatforms).toEqual(['toast']);
  });

  it('excludes beauty platforms for home trade verticals', () => {
    const { scoringPlatforms, excludedPlatforms } = filterScoringPlatforms(
      ['boulevard', 'jobber'],
      'Home & Professional Services',
    );
    expect(scoringPlatforms).toEqual(['jobber']);
    expect(excludedPlatforms).toEqual(['boulevard']);
  });
});

describe('classifyBookingPath', () => {
  it('prefers named platform over generic signals', () => {
    const result = classifyBookingPath(
      {
        raw: 'calendly.com',
        htmlLower: 'calendly.com',
        allHrefs: ['https://calendly.com/acme/book'],
      },
      'Professional Services',
      'example.com',
    );
    expect(result.bookingPathType).toBe('named_platform');
    expect(result.scoringPlatforms).toContain('calendly');
  });

  it('detects external subdomain booking for beauty vertical', () => {
    const result = classifyBookingPath(
      {
        raw: '',
        htmlLower: 'https://web2.unknownscheduler.example/services',
        allHrefs: ['https://web2.unknownscheduler.example/services'],
      },
      'Beauty & Wellness',
      'example.com',
    );
    expect(result.bookingPathType).toBe('generic_booking');
    expect(result.bookingDetectionMethod).toBe('external_subdomain');
  });

  it('detects CTA hash booking modals', () => {
    const result = classifyBookingPath(
      {
        raw: '<a href="#">Book Now</a>',
        htmlLower: '<a href="#">book now</a>',
        allHrefs: ['#'],
      },
      'Home & Professional Services',
      'example.com',
    );
    expect(result.bookingPathType).toBe('generic_booking');
    expect(result.bookingDetectionMethod).toBe('cta_hash');
  });

  it('detects internal booking slug paths', () => {
    const result = classifyBookingPath(
      {
        raw: '',
        htmlLower: '/scorpion-scheduling/',
        allHrefs: ['/scorpion-scheduling/'],
      },
      'Home & Professional Services',
      'example.com',
    );
    expect(result.bookingPathType).toBe('generic_booking');
    expect(result.bookingDetectionMethod).toBe('internal_slug');
    expect(result.bookingInternalSlug).toBe('/scorpion-scheduling/');
  });

  it('classifies quote form with lead capture platforms', () => {
    const result = classifyBookingPath(
      {
        raw: 'form.jotform.com/jsform/123 hbspt.forms.create',
        htmlLower: 'get a free estimate form.jotform.com/jsform/123 js.hsforms.net',
        allHrefs: [],
      },
      'Home & Professional Services',
      'example.com',
    );
    expect(result.bookingPathType).toBe('quote_form');
    expect(result.leadCapturePlatforms).toEqual(expect.arrayContaining(['jotform']));
  });

  it('falls back to contact-only when no booking path exists', () => {
    const result = classifyBookingPath(
      {
        raw: '',
        htmlLower: '/contact-us contact us',
        allHrefs: ['/contact-us'],
      },
      'service',
      'example.com',
    );
    expect(result.bookingPathType).toBe('contact_form_only');
  });
});
