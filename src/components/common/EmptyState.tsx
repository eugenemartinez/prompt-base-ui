import React from 'react';
import { motion } from 'framer-motion'; // <-- 1. Import motion
import { cn } from '../../utils/cn'; // <-- 2. Import cn (assuming it exists)

// Define Props Interface
export interface EmptyStateProps {
  title: string; // The main heading message
  message?: React.ReactNode; // Optional descriptive text or elements below the title
  icon?: React.ReactNode; // Optional icon element (e.g., from react-icons)
  actions?: React.ReactNode; // Optional element(s) for call-to-action buttons/links
  className?: string; // Allow passing additional classes for layout/styling
}

// --- 3. Define Animation Variants ---
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
// --- End Animation Variants ---

// EmptyState Component Implementation
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message, // Now accepts React.ReactNode
  icon,
  actions,
  className = '',
}) => {
  // Base styles
  const baseStyles = 'text-center py-12 px-6'; // Centered text, padding

  // Styles using mapped classes
  const iconWrapperStyles = 'mb-4 text-muted-foreground flex justify-center'; // Use muted foreground for icon color
  const titleStyles = 'text-xl font-semibold text-foreground mb-2'; // Use foreground for title
  const messageStyles = 'text-sm text-muted-foreground mb-6'; // Use muted foreground for message
  const actionsWrapperStyles = 'mt-6'; // Spacing for actions

  // Combine classes using cn
  const combinedClassName = cn(baseStyles, className); // Use cn for combining

  return (
    // --- 4. Wrap with motion.div ---
    <motion.div
      className={combinedClassName}
      variants={fadeVariants} // Apply variants
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }} // Simple fade duration
    >
      {icon && (
        <div className={iconWrapperStyles}>
          {/* Render the icon, maybe control size here or expect sized icon */}
          {icon}
        </div>
      )}
      <h3 className={titleStyles}>{title}</h3>
      {/* This will now correctly render strings or React elements */}
      {message && <div className={messageStyles}>{message}</div>}
      {actions && <div className={actionsWrapperStyles}>{actions}</div>}
    </motion.div>
    // --- End motion.div ---
  );
};

EmptyState.displayName = 'EmptyState';

export { EmptyState };