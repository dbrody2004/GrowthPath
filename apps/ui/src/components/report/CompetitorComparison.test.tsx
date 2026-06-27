import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompetitorComparison } from './CompetitorComparison.js';
import { CompetitorIntelPanel } from './CompetitorIntelPanel.js';
import { CompetitorLeaderboard } from './CompetitorLeaderboard.js';
import {
  sampleCompetitorIntelFixture,
  sampleCompetitorLeaderboardFixture,
} from '../../test/competitor.fixture.js';

describe('CompetitorLeaderboard', () => {
  it('highlights client and primary rows', () => {
    render(<CompetitorLeaderboard rows={sampleCompetitorLeaderboardFixture} />);

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Kitchen 747')).toBeInTheDocument();
    expect(screen.getByText('Goldfield Trading Post')).toBeInTheDocument();
  });

  it('renders empty state when no rows', () => {
    render(<CompetitorLeaderboard rows={[]} />);
    expect(screen.getByText(/No aggregated competitor data/)).toBeInTheDocument();
  });
});

describe('CompetitorIntelPanel', () => {
  it('renders primary competitor stats and narrative', () => {
    render(<CompetitorIntelPanel competitor={sampleCompetitorIntelFixture} />);

    expect(screen.getByText('Primary benchmark')).toBeInTheDocument();
    expect(screen.getByText('Goldfield Trading Post')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });
});

describe('CompetitorComparison', () => {
  it('renders gap table, surface matrix, and counter-moves', () => {
    render(<CompetitorComparison competitor={sampleCompetitorIntelFixture} />);

    expect(screen.getByText('Client vs primary competitor')).toBeInTheDocument();
    expect(screen.getByText('Domain authority')).toBeInTheDocument();
    expect(screen.getByText('Rank surface matrix')).toBeInTheDocument();
    expect(screen.getByText('Recommended counter-moves')).toBeInTheDocument();
    expect(screen.getByText(/Audit directory citations/)).toBeInTheDocument();
  });
});
