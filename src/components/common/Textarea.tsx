import React from 'react';

// Define Props Interface, extending standard textarea attributes
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; // Optional label text
  error?: string; // Optional error message
}

// Textarea Component Implementation
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id: propId, error, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = propId || generatedId;

    // Base styles using mapped classes
    const baseTextareaStyles =
      'flex min-h-[80px] w-full rounded-lg border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50';

    // Error styles using mapped classes
    const errorStyles = error ? 'border-destructive focus-visible:ring-destructive' : '';

    // --- Add scrollbar styles ---
    const scrollbarStyles = `scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                             hover:scrollbar-thumb-gray-500 active:scrollbar-thumb-gray-600
                             scrollbar-thumb-rounded-full scrollbar-track-rounded-full`;
    // --- End scrollbar styles ---

    // Combine classes
    const combinedClassName = `
      ${baseTextareaStyles}
      ${errorStyles}
      ${scrollbarStyles} // Add scrollbar styles here
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
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={combinedClassName.trim()} // Apply combined classes
          ref={ref}
          {...ariaProps}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };