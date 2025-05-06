import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Define the possible variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// Define Props Interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

// Button Component Implementation
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary', // Default variant
      size = 'md', // Default size
      children,
      iconLeft,
      iconRight,
      isLoading = false,
      loadingText = 'Loading...',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = isLoading || disabled;

    // Base styles using mapped classes
    const baseStyles =
      // --- Add transform transition and hover scale ---
      'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors transition-transform duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer hover:scale-105';
      // --- End Change ---
      // Note: `rounded-lg` uses the mapped radius

    // Variant styles using mapped classes
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90', // Using opacity modifier for hover
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80', // Using opacity modifier for hover
      danger: // Renamed from 'destructive' in variables
        'bg-destructive text-destructive-foreground hover:bg-destructive/90', // Using opacity modifier for hover
      ghost:
        'hover:bg-accent hover:text-accent-foreground',
      outline:
        // Border color comes from base styles (`border-border`)
        'border bg-transparent hover:bg-accent hover:text-accent-foreground',
      link:
        'text-primary underline-offset-4 hover:underline',
    };

    // Size styles (remain the same)
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'h-9 px-3',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    };

    // Combine classes
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className || ''}
    `;

    return (
      <button
        className={combinedClassName.trim()}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && size !== 'icon' && (
          <>
            <LoadingSpinner size="sm" className="mr-2" aria-hidden="true" /> 
            {/* Wrap loadingText in span with responsive classes */}
            <span className="hidden md:inline">{loadingText}</span>
          </>
        )}
        {isLoading && size === 'icon' && (
          // Use LoadingSpinner for icon buttons
          <LoadingSpinner size="sm" aria-label={loadingText} /> 
        )}
        {/* Render children/icons only when not loading */}
        {!isLoading && iconLeft && <span className={children ? 'mr-2' : ''}>{iconLeft}</span>}
        {!isLoading && children}
        {!isLoading && iconRight && <span className={children ? 'ml-2' : ''}>{iconRight}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
