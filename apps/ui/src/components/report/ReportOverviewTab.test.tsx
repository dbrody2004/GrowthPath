import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryCard } from './CategoryCard.js';
import { ReportAppendixPanel } from './ReportAppendixPanel.js';
import { ReportOverviewTab } from './ReportOverviewTab.js';
import { ScoreExplanationStrip } from './ScoreExplanationStrip.js';
import { SignalBenchmarkTable } from './SignalBenchmarkTable.js';
import { sampleReportFixture, sampleScoresWithReportFixture } from '../../test/report.fixture.js';
import { sampleScoresFixture } from '../../test/scores.fixture.js';

describe('ScoreExplanationStrip', () => {
  it('renders profile rationale and pillar summaries', () => {
    render(
      <ScoreExplanationStrip
        explanation={sampleReportFixture.explanation}
        profile="The Invisible Closer"
      />,
    );

    expect(screen.getByText('Score explanation')).toBeInTheDocument();
    expect(screen.getByText('The Invisible Closer')).toBeInTheDocument();
    expect(screen.getByText(/Classic Invisible Closer pattern/)).toBeInTheDocument();
    expect(screen.getByText(/P1 42\/100/)).toBeInTheDocument();
  });
});

describe('SignalBenchmarkTable', () => {
  it('renders signal rows with points', () => {
    const signals = sampleReportFixture.categories[0]!.signals;

    render(<SignalBenchmarkTable signals={signals} />);

    expect(screen.getByText('Review Count')).toBeInTheDocument();
    expect(screen.getByText('14 / 20')).toBeInTheDocument();
    expect(screen.getByText('679')).toBeInTheDocument();
  });
});

describe('CategoryCard', () => {
  it('renders assessment and benchmark table when evidence is provided', () => {
    const evidence = sampleReportFixture.categories[0]!;

    render(
      <CategoryCard
        categoryKey="gbp_strength"
        category={sampleScoresFixture.categories.gbp_strength}
        evidence={evidence}
      />,
    );

    expect(screen.getByText(/55\/100/)).toBeInTheDocument();
    expect(screen.getByText('Review Count')).toBeInTheDocument();
    expect(screen.getByText('679')).toBeInTheDocument();
  });
});

describe('ReportAppendixPanel', () => {
  it('renders collection status and signal availability', () => {
    render(<ReportAppendixPanel appendix={sampleReportFixture.appendix} />);

    expect(screen.getByText('Diagnostics appendix')).toBeInTheDocument();
    expect(screen.getByText('Google Business Profile')).toBeInTheDocument();
    expect(screen.getByText('gbp_strength')).toBeInTheDocument();
    expect(screen.getAllByText('REVIEW_RESPONSE_RATE_LOW').length).toBeGreaterThanOrEqual(1);
  });
});

describe('ReportOverviewTab', () => {
  it('renders explanation, evidence, and appendix from structured report data', () => {
    render(<ReportOverviewTab scores={sampleScoresWithReportFixture} />);

    expect(screen.getByText('Score explanation')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics appendix')).toBeInTheDocument();
    expect(screen.getByText('Review Count')).toBeInTheDocument();
  });

  it('still renders categories when report metadata is absent', () => {
    render(<ReportOverviewTab scores={sampleScoresFixture} />);

    expect(screen.getByText('GBP Strength')).toBeInTheDocument();
    expect(screen.queryByText('Score explanation')).not.toBeInTheDocument();
  });
});
