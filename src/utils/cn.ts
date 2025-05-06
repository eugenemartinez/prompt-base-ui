// --- Add cn utility if not already present ---
// You might have this in a utils file already
/**
 * Utility function to conditionally join CSS class names.
 * Filters out falsy values and joins the rest with spaces.
 * @param classes - Class names or conditional expressions.
 * @returns A string of joined class names.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
// --- End cn utility ---