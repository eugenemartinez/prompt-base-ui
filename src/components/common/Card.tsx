import React from 'react';

// Define Props Interface
export interface CardProps {
  children: React.ReactNode;
  className?: string; // Allow passing additional classes for customization
}

// Card Component Implementation
const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  // Base card styles using mapped Tailwind classes
  const baseCardStyles =
    // Use mapped classes for background, border, radius, and text color
    'bg-card text-card-foreground border rounded-lg shadow-sm overflow-hidden'; // Use rounded-lg which maps to --radius

  // Combine classes
  const combinedClassName = `
    ${baseCardStyles}
    ${className}
  `.trim();

  return (
    // Removed text-card-foreground from here, applied in base styles
    <div className={combinedClassName}>
      {children}
    </div>
  );
};

Card.displayName = 'Card';

export { Card };

// --- Optional: Define sub-components for more structure ---

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  // Use border-b (color comes from global border-border)
  <div className={`p-4 border-b ${className}`.trim()}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  // Padding is the main style here
  <div className={`p-4 ${className}`.trim()}>{children}</div>
);
CardContent.displayName = 'CardContent';


export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}
const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  // Use border-t, mapped muted background and foreground colors
  <div className={`p-4 border-t bg-muted text-muted-foreground ${className}`.trim()}>
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';


// Export sub-components if you want to use them
export { CardHeader, CardContent, CardFooter };
