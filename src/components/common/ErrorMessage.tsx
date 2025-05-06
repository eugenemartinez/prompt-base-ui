import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import { motion } from 'framer-motion'; // <-- 1. Import motion
import { cn } from '../../utils/cn'; // <-- 2. Import cn (assuming it exists)

// Define Props Interface
export interface ErrorMessageProps {
  // --- Change: Allow null in addition to string or undefined ---
  message?: string | null;
  // --- End Change ---
  className?: string; // Allow passing additional classes
  showIcon?: boolean; // Whether to show the warning icon
}

// --- 3. Define Animation Variants ---
const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};
// --- End Animation Variants ---

// ErrorMessage Component Implementation
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message, // Now accepts string | null | undefined
  className = '',
  showIcon = false, // Default to not showing the icon
}) => {
  // --- Change: Check for null as well ---
  if (!message) {
    // This check correctly handles null and undefined
    // --- End Change ---
    return null;
  }

  // Base styles using mapped destructive color
  const baseStyles = 'text-sm text-destructive flex items-center'; // Use mapped destructive color

  // Combine classes using cn
  const combinedClassName = cn(baseStyles, className); // Use cn for combining

  return (
    // --- 4. Wrap with motion.div ---
    <motion.div
      className={combinedClassName}
      role="alert" // Indicate this is an alert message for assistive technologies
      aria-live="assertive" // Request immediate announcement (use "polite" for less critical errors)
      variants={fadeVariants} // Apply variants
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }} // Simple fade duration
    >
      {showIcon && <IoWarningOutline className="mr-1.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />}
      <span>{message}</span>
    </motion.div>
    // --- End motion.div ---
  );
};

ErrorMessage.displayName = 'ErrorMessage';

export { ErrorMessage };