import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingSpinner } from '../common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(spinner).toHaveClass('loading-spinner', 'loading-spinner--medium', 'loading-spinner--primary');
  });

  it('renders with small size', () => {
    render(<LoadingSpinner size="small" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--small');
  });

  it('renders with large size', () => {
    render(<LoadingSpinner size="large" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--large');
  });

  it('renders with secondary color', () => {
    render(<LoadingSpinner color="secondary" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--secondary');
  });

  it('renders with white color', () => {
    render(<LoadingSpinner color="white" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner--white');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-spinner" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('loading-spinner', 'custom-spinner');
  });

  it('renders spinner circle element', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    const circle = spinner.querySelector('.loading-spinner-circle');
    expect(circle).toBeInTheDocument();
  });

  it('renders screen reader text', () => {
    render(<LoadingSpinner />);
    
    const srText = screen.getByText('Loading...');
    expect(srText).toBeInTheDocument();
    expect(srText).toHaveClass('sr-only');
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('combines size and color classes correctly', () => {
    render(<LoadingSpinner size="large" color="white" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass(
      'loading-spinner',
      'loading-spinner--large',
      'loading-spinner--white'
    );
  });
});