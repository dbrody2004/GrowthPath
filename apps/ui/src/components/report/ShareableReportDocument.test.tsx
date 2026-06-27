import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calculateScores } from '@growthpath/scoring-engine';
import { ShareableReportDocument } from './ShareableReportDocument.js';
import { sampleAuditFixture } from '../../test/audit.fixture.js';

describe('ShareableReportDocument', () => {
  it('renders all shareable sections without operator diagnostics heading', () => {
    const scores = calculateScores(sampleAuditFixture);

    render(
      <ShareableReportDocument
        result={{ auditData: sampleAuditFixture, scores }}
        businessName="Sample Business"
        scanDate="June 1, 2026"
      />,
    );

    expect(screen.getByText('Growth Gap Analysis')).toBeInTheDocument();
    expect(screen.getByText('Sample Business')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Pillar 1 — Local Visibility')).toBeInTheDocument();
    expect(screen.getByText('Pillar 2 — Digital Experience')).toBeInTheDocument();
    expect(screen.getByText('Rank map')).toBeInTheDocument();
    expect(screen.getByText('Competitors')).toBeInTheDocument();
    expect(screen.getByText('Keywords')).toBeInTheDocument();
    expect(screen.queryByText('Diagnostics appendix')).not.toBeInTheDocument();
    expect(screen.getByText('Data sources')).toBeInTheDocument();
    expect(screen.getByText('GrowthPath Local Visibility Report')).toBeInTheDocument();
  });

  it('renders KB remediation appendix in shareable mode', () => {
    const scores = calculateScores(sampleAuditFixture);

    render(
      <ShareableReportDocument
        result={{ auditData: sampleAuditFixture, scores }}
        businessName="Sample Business"
      />,
    );

    expect(screen.getByText('SEO Knowledge Appendix')).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile Signals')).toBeInTheDocument();
  });
});
