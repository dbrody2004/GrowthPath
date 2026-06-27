import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RankMap } from './RankMap.js';
import { sampleAuditFixture } from '../../test/audit.fixture.js';

describe('RankMap', () => {
  it('renders grid rows, rank chips, and summary strip', () => {
    render(<RankMap auditData={sampleAuditFixture} />);

    expect(screen.getByText('Rank Map')).toBeInTheDocument();
    expect(screen.getByText('burgers near me')).toBeInTheDocument();
    expect(screen.getByText('Westpark (0.51mi)')).toBeInTheDocument();
    expect(screen.getAllByText('#1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Top 3 appearances')).toBeInTheDocument();
    expect(screen.getByText('Proximity wall detected')).toBeInTheDocument();
  });

  it('updates output when service and surface change', () => {
    render(<RankMap auditData={sampleAuditFixture} />);

    expect(screen.getByText('Westwood Village (3.87mi)')).toBeInTheDocument();
    expect(screen.getByText('Diamond Oaks (4.41mi)')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pizza' } });
    expect(screen.getByText('pizza near me')).toBeInTheDocument();
    expect(screen.queryByText('Diamond Oaks (4.41mi)')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Maps' }));
    expect(screen.queryByRole('columnheader', { name: 'Local Finder' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Maps' })).toBeInTheDocument();
  });
});
