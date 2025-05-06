import React from 'react';

// Define Props Interface, extending standard select attributes
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; // Optional label text
  error?: string; // Optional error message
  options: { value: string | number; label: string }[]; // Array of options
}

// Select Component Implementation
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id: propId, error, options, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = propId || generatedId;

    // Base select styles using mapped classes
    const baseSelectStyles =
      // Use mapped classes for radius, border, background, text, ring
      // Added appearance-none and padding-right for custom arrow
      'block h-10 w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8';
      // Note: `border` class uses `border-border` color from base styles
      // Note: `rounded-lg` uses the mapped radius

    // Error styles using mapped classes
    const errorStyles = error ? 'border-destructive focus-visible:ring-destructive' : '';

    // Combine classes
    const combinedClassName = `
      ${baseSelectStyles}
      ${errorStyles}
      ${className || ''}
    `;

    // Prepare ARIA props conditionally
    const ariaProps: { 'aria-invalid'?: 'true' | 'false'; 'aria-describedby'?: string } = {};
    if (error) {
      ariaProps['aria-invalid'] = 'true';
      ariaProps['aria-describedby'] = `${inputId}-error`;
    } else {
      ariaProps['aria-invalid'] = 'false';
    }

    return (
      <div className="w-full relative"> {/* Relative positioning for custom arrow */}
        {label && (
          <label
            htmlFor={inputId}
            // Use mapped foreground color for label
            className="block text-sm font-medium text-foreground mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={inputId}
          className={combinedClassName.trim()}
          ref={ref}
          // Spread the prepared ARIA props
          {...ariaProps}
          {...props} // Spread other props like value, onChange, disabled etc.
        >
          {/* Render options */}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow - use foreground color */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-foreground"> {/* Changed text color */}
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
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
Select.displayName = 'Select';

export { Select };