import React from 'react';
import { render, screen } from '@testing-library/react';
import AbnormalityBar from '../components/AbnormalityBar';

describe('AbnormalityBar', () => {
  it('renders without crashing when no abnormalities are provided', () => {
    render(<AbnormalityBar abnormalities={[]} />);
    expect(screen.getByText(/No abnormalities found/i)).toBeInTheDocument();
  });

  it('renders abnormalities with correct scores and colors', () => {
    const abnormalities = [
      { id: 1, name: 'Lung Nodules', score: 0.8 },
      { id: 2, name: 'Pleural Effusion', score: 0.6 },
    ];

    render(<AbnormalityBar abnormalities={abnormalities} />);

    // Check if abnormalities are rendered
    expect(screen.getByText(/Lung Nodules/i)).toBeInTheDocument();
    expect(screen.getByText(/80.0%/i)).toBeInTheDocument();
    expect(screen.getByText(/Pleural Effusion/i)).toBeInTheDocument();
    expect(screen.getByText(/60.0%/i)).toBeInTheDocument();

    // Check if progress bars have correct colors
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars[0]).toHaveStyle('background-color: orange');
    expect(progressBars[1]).toHaveStyle('background-color: blue');
  });
});