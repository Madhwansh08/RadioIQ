import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Features from '../components/Features';

describe('Features Component', () => {
  it('renders the Features component without crashing', () => {
    render(<Features />);
    expect(screen.getByText(/Features/i)).toBeInTheDocument();
  });

  it('displays all feature titles', () => {
    render(<Features />);
    const featureTitles = [
      'Abnormalities Detection',
      'Doctor Editing Interface',
      'Analyze Button',
      'Heatmap Generation',
    ];

    featureTitles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('toggles feature descriptions on click', () => {
    render(<Features />);

    const featureTitle = screen.getByText('Abnormalities Detection');
    fireEvent.click(featureTitle);

    expect(
      screen.getByText(
        /Identify and highlight 50 potential abnormalities in medical images/i
      )
    ).toBeInTheDocument();

    fireEvent.click(featureTitle);

    expect(
      screen.queryByText(
        /Identify and highlight 50 potential abnormalities in medical images/i
      )
    ).not.toBeInTheDocument();
  });

  it('renders the correct image when a feature is active', () => {
    render(<Features />);

    const featureTitle = screen.getByText('Heatmap Generation');
    fireEvent.click(featureTitle);

    const activeImage = screen.getByAltText('Heatmap Generation');
    expect(activeImage).toBeInTheDocument();
    expect(activeImage).toHaveStyle('opacity: 1');
  });

  it('renders the correct number of features', () => {
    render(<Features />);
    const featureElements = screen.getAllByTestId('feature-item');
    expect(featureElements.length).toBe(4); // Assuming there are 4 features
  });

  it('highlights the active feature when clicked', () => {
    render(<Features />);

    const featureTitle = screen.getByText('Doctor Editing Interface');
    fireEvent.click(featureTitle);

    expect(featureTitle).toHaveClass('active-feature');
  });

  it('does not display feature description initially', () => {
    render(<Features />);

    const description = screen.queryByText(
      /Identify and highlight 50 potential abnormalities in medical images/i
    );
    expect(description).not.toBeInTheDocument();
  });

  it('renders a fallback message when no features are available', () => {
    render(<Features features={[]} />);

    expect(screen.getByText(/No features available/i)).toBeInTheDocument();
  });
});