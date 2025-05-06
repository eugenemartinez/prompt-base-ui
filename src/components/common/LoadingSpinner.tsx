import React from 'react';

// Define Props Interface
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // Optional size prop
  className?: string; // Allow passing additional classes
  'aria-label'?: string; // Accessibility label
}

// LoadingSpinner Component Implementation
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md', // Default size
  className = '',
  'aria-label': ariaLabel = 'Loading...', // Default aria-label
}) => {
  // Define size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', // Default
    lg: 'h-8 w-8',
  };

  // Base spinner styles (using the same SVG as before, but now componentized)
  const baseSpinnerStyles = 'animate-spin';

  // Combine classes
  const combinedClassName = `
    ${baseSpinnerStyles}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <svg
      className={combinedClassName}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status" // Indicate it's a status indicator
      aria-live="polite" // Announce changes politely (optional, depends on context)
      aria-label={ariaLabel} // Describe what's happening
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor" // Inherits text color
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor" // Inherits text color
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };