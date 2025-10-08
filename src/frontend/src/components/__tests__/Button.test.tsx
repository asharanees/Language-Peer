import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../ui/Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('button', 'button--primary', 'button--medium');
  });

  it('renders with different variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--secondary');
  });

  it('renders with different sizes', () => {
    render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--large');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--loading');
    expect(button).toBeDisabled();
  });

  it('renders with icons', () => {
    render(
      <Button leftIcon="🚀" rightIcon="✨">
        With Icons
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('🚀');
    expect(button.textContent).toContain('✨');
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders full width', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('button--full-width');
  });
});