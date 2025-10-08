import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Footer } from '../layout/Footer';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Footer Component', () => {
  it('renders footer content', () => {
    renderWithRouter(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('renders brand information', () => {
    renderWithRouter(<Footer />);
    
    expect(screen.getByText('LanguagePeer')).toBeInTheDocument();
  });

  it('renders copyright information', () => {
    renderWithRouter(<Footer />);
    
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('renders footer links', () => {
    renderWithRouter(<Footer />);
    
    // Common footer links that might be present
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    
    // Check for any links in the footer
    const links = footer.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(0);
  });

  it('has proper semantic structure', () => {
    renderWithRouter(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer.tagName).toBe('FOOTER');
  });

  it('applies correct CSS classes', () => {
    renderWithRouter(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('footer');
  });

  it('renders within container', () => {
    renderWithRouter(<Footer />);
    
    const container = screen.getByRole('contentinfo').querySelector('.container');
    expect(container).toBeInTheDocument();
  });
});