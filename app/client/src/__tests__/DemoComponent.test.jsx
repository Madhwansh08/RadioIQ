import React from 'react';
import { render, screen } from '@testing-library/react';
import DemoComponent from '../components/DemoComponent';

describe('DemoComponent', () => {
  it('renders without crashing', () => {
    render(<DemoComponent />);
    expect(screen.getByText(/Demo Component/i)).toBeInTheDocument();
  });

  it('displays the correct content', () => {
    render(<DemoComponent />);
    expect(screen.getByText(/This is a demo component/i)).toBeInTheDocument();
  });
});