import type { ReportMetadata, Scores } from '@growthpath/shared';
import { sampleScoresFixture } from './scores.fixture.js';

export const sampleReportFixture: ReportMetadata = {
  explanation: {
    profileRationale:
      'Classic Invisible Closer pattern: conversion may be acceptable but local search reach is limiting growth.',
    p1Summary: 'P1 42/100 (Needs Work) — weighted from GBP 55 (20%) · Search 38 (60%) · On-page 62 (10%) · Trust 48 (10%).',
    p2Summary:
      'P2 46/100 (Needs Work) — Performance 21 (35%) · Conversion 40 (40%) · UX 90 (25%).',
  },
  categories: [
    {
      categoryId: 'gbp_strength',
      pillar: 'P1',
      displayName: 'GBP Strength',
      assessment: '55/100 (Competitive) — GBP profile is incomplete.',
      benchmarkSummary: 'Correct primary category · 3+ secondary categories · 4.8★+ rating',
      signals: [
        {
          signalId: 'review_count',
          label: 'Review Count',
          earned: 14,
          max: 20,
          clientValue: '679',
          targetLabel: 'Target: 800+',
          targetTier: 'needs_work',
        },
        {
          signalId: 'response_rate',
          label: 'Response Rate',
          earned: 0,
          max: 10,
          clientValue: '11%',
          targetLabel: 'Target: 75%+',
          targetTier: 'critical',
        },
      ],
      ruleOutcomes: [
        {
          ruleId: 'review_count',
          label: 'Review Count',
          status: 'partial',
          points: '14 / 20',
        },
        {
          ruleId: 'response_rate',
          label: 'Response Rate',
          status: 'failed',
          points: '0 / 10',
        },
      ],
    },
    {
      categoryId: 'mappack',
      pillar: 'P1',
      displayName: 'Search Visibility',
      assessment: '38/100 — Low map pack visibility.',
      signals: [
        {
          signalId: 'near_me_reach',
          label: 'Near-Me Reach',
          earned: 35,
          max: 100,
          clientValue: '35/100',
          targetLabel: 'Target: 60+/100',
          targetTier: 'needs_work',
        },
      ],
      ruleOutcomes: [
        {
          ruleId: 'near_me_reach',
          label: 'Near-Me Reach',
          status: 'partial',
          points: '35 / 100',
        },
      ],
    },
  ],
  appendix: {
    collectionStatus: [
      {
        source: 'Google Business Profile',
        status: 'ok',
        detail: 'Profile loaded for Kitchen 747',
      },
      {
        source: 'PageSpeed Insights',
        status: 'ok',
        detail: 'Desktop performance 21',
      },
    ],
    triggeredKbKeys: ['REVIEW_RESPONSE_RATE_LOW', 'GBP_PHOTOS_LOW'],
    remediation: [
      {
        id: 'gbp',
        number: 'Section 01 of 05',
        title: 'Google Business Profile Signals',
        narrative: 'Your GBP is Google\'s primary source of truth for your business.',
        stat: '~32%',
        statLabel: 'Pack Ranking Influence',
        entries: [
          {
            key: 'REVIEW_RESPONSE_RATE_LOW',
            title: 'Review Response Rate',
            why: 'A low response rate signals an unmanaged business.',
            howGoogle: 'Google tracks response rate and recency as GBP engagement signals.',
            fixSteps: ['Respond to every review — positive and negative'],
            priority: 4,
            effort: 'Low',
            impact: 'High',
          },
          {
            key: 'GBP_PHOTOS_LOW',
            title: 'GBP Photos — Visual Trust Signal',
            why: 'Photos are one of the first things searchers evaluate.',
            howGoogle: 'Google tracks photo count and freshness as GBP completeness signals.',
            fixSteps: ['Upload at least 15 photos'],
            priority: 8,
            effort: 'Low',
            impact: 'Medium',
          },
        ],
      },
    ],
    signalAvailability: {
      gbp_strength: 'available',
      mappack: 'available',
      performance: 'available',
    },
    notes: ['Sample fixture report metadata for UI tests.'],
  },
};

export const sampleScoresWithReportFixture: Scores = {
  ...sampleScoresFixture,
  report: sampleReportFixture,
};
