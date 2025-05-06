import React from 'react';

// Define Props Interface, extending standard input attributes
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label text
  error?: string; // Optional error message
  // Add any other custom props you might need, e.g., iconLeft, iconRight
}

// Input Component Implementation
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, id: propId, error, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = propId || generatedId;

    // Base styles using mapped classes
    const baseInputStyles =
      // Use mapped classes for radius, border, background, text, placeholder, ring
      'flex h-10 w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';
      // Note: `border` class uses `border-border` color from base styles
      // Note: `rounded-lg` uses the mapped radius

    // Error styles using mapped classes
    const errorStyles = error ? 'border-destructive focus-visible:ring-destructive' : '';

    const combinedClassName = `
      ${baseInputStyles}
      ${errorStyles}
      ${className || ''}
    `;

    // --- Prepare ARIA props conditionally (no change needed here) ---
    const ariaProps: { 'aria-invalid'?: 'true' | 'false'; 'aria-describedby'?: string } = {};
    if (error) {
      ariaProps['aria-invalid'] = 'true';
      ariaProps['aria-describedby'] = `${inputId}-error`;
    } else {
      ariaProps['aria-invalid'] = 'false';
    }
    // --- End Change ---

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            // Use mapped foreground color for label
            className="block text-sm font-medium text-foreground mb-1"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={combinedClassName.trim()}
          ref={ref}
          // --- Spread the prepared ARIA props (no change needed here) ---
          {...ariaProps}
          // --- End Change ---
          {...props}
        />
        {error && (
          // Use mapped destructive color for error message
          <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };