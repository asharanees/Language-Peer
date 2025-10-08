import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  as?: React.ElementType;
  to?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  as: Component = 'button',
  ...props
}, ref) => {
  const buttonClasses = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    isLoading && 'button--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component
      ref={ref}
      className={buttonClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="button-spinner" aria-hidden="true">
          <span className="spinner"></span>
        </span>
      )}
      {!isLoading && leftIcon && (
        <span className="button-icon button-icon--left" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className="button-text">
        {children}
      </span>
      {!isLoading && rightIcon && (
        <span className="button-icon button-icon--right" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </Component>
  );
});

Button.displayName = 'Button';