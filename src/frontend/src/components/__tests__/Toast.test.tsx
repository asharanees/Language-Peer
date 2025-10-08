import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Toast } from '../common/Toast';

// Mock timers for auto-dismiss functionality
jest.useFakeTimers();

describe('Toast Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders toast with message', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders with success type by default', () => {
    render(<Toast message="Success message" onClose={mockOnClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast', 'toast--success');
  });

  it('renders with error type', () => {
    render(<Toast message="Error message" type="error" onClose={mockOnClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast--error');
  });

  it('renders with warning type', () => {
    render(<Toast message="Warning message" type="warning" onClose={mockOnClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast--warning');
  });

  it('renders with info type', () => {
    render(<Toast message="Info message" type="info" onClose={mockOnClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast--info');
  });

  it('renders close button', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after default duration', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(5000); // Default duration
    });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after custom duration', () => {
    render(<Toast message="Test message" onClose={mockOnClose} duration={3000} />);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(mockOnClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not auto-dismiss when duration is 0', () => {
    render(<Toast message="Test message" onClose={mockOnClose} duration={0} />);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('role', 'alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders with proper ARIA label for close button', () => {
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('applies custom className', () => {
    render(<Toast message="Test message" onClose={mockOnClose} className="custom-toast" />);
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveClass('toast', 'custom-toast');
  });

  it('renders different icons for different types', () => {
    const { rerender } = render(<Toast message="Success" type="success" onClose={mockOnClose} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
    
    rerender(<Toast message="Error" type="error" onClose={mockOnClose} />);
    expect(screen.getByText('✕')).toBeInTheDocument();
    
    rerender(<Toast message="Warning" type="warning" onClose={mockOnClose} />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
    
    rerender(<Toast message="Info" type="info" onClose={mockOnClose} />);
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });
});