import { useState, useMemo } from 'react';
import { BsCheckLg } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion'; // <-- 1. Import motion
import { Input } from './common/Input';
import { Button } from './common/Button';
import { ErrorMessage } from './common/ErrorMessage';
import { EmptyState } from './common/EmptyState';
import TagsFilterSkeleton from './TagsFilterSkeleton';
import { cn } from '../utils/cn';

// --- Update interface to accept tags data as props ---
interface TagsFilterProps {
  selectedTags: Set<string>;
  onSelectionChange: (selectedTags: Set<string>) => void;
  allTags: string[] | undefined; // <-- Use undefined for initial state
  loading: boolean;
  error: Error | null; // <-- Use Error type
  className?: string; // <-- Add className prop
}
// --- End Interface Update ---

// --- Update props destructuring ---
function TagsFilter({
  selectedTags,
  onSelectionChange,
  allTags = [], // Default to empty array if undefined
  loading,
  error,
  className // <-- Destructure className
}: TagsFilterProps) {
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  // --- filteredTags calculation remains the same ---
  const filteredTags = useMemo(() => {
    if (!tagSearchTerm) return allTags;
    const lowerCaseSearch = tagSearchTerm.toLowerCase();
    return allTags.filter(tag => tag.toLowerCase().includes(lowerCaseSearch));
  }, [allTags, tagSearchTerm]);

  // --- handlers remain the same ---
  const handleTagClick = (tag: string) => {
    const newSelection = new Set(selectedTags);
    if (newSelection.has(tag)) {
      newSelection.delete(tag);
    } else {
      newSelection.add(tag);
    }
    onSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange(new Set());
  };
  // --- End handlers ---

  // --- Animation Variants ---
  const tagItemVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' },
    exit: { opacity: 0, height: 0 },
  };

  const checkVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  };
  // --- End Animation Variants ---

  // --- Main Render Logic ---
  return (
    // --- Use cn for className ---
    <div className={cn("p-4 border rounded-lg bg-card text-card-foreground shadow-sm h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b">
        <h3 className="text-base font-semibold text-foreground">Filter by Tags</h3>
        {selectedTags.size > 0 && !loading && !error && ( // Hide clear button during loading/error
           <Button
             variant="link"
             size="sm"
             onClick={handleClearAll}
             className="text-xs h-auto p-0 text-primary hover:text-primary/80"
             title="Clear selected tags"
           >
             Clear All
           </Button>
        )}
      </div>

      {/* --- 3. Wrap Conditional Rendering with AnimatePresence --- */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="tags-loading" /* Add variants if desired */ >
            <TagsFilterSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div key="tags-error" /* Add variants if desired */ >
            <ErrorMessage message={`Failed to load tags: ${error.message}`} showIcon={true} />
          </motion.div>
        ) : allTags.length === 0 ? (
          <motion.div key="tags-empty" /* Add variants if desired */ >
            <EmptyState
              title="No Tags Found"
              message="No tags have been added yet."
              className="text-center"
            />
          </motion.div>
        ) : (
          // --- Content Area ---
          <motion.div key="tags-content" className="flex flex-col flex-grow min-h-0"> {/* Ensure flex container for layout */}
            {/* Tag Search Input */}
            <div className="mb-3 flex-shrink-0"> {/* Prevent search from shrinking */}
              <Input
                type="search"
                placeholder="Search tags..."
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                aria-label="Search tags"
              />
            </div>

            {/* Tags List */}
            <div className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 active:scrollbar-thumb-gray-600 scrollbar-thumb-rounded-full scrollbar-track-rounded-full">
              {/* --- 4. Wrap map with AnimatePresence --- */}
              <AnimatePresence initial={false}> {/* initial=false prevents initial animation on load */}
                {filteredTags.length > 0 ? (
                  filteredTags.map((tag) => {
                    const isSelected = selectedTags.has(tag);
                    return (
                      // --- 5. Wrap Button with motion.div ---
                      <motion.div
                        key={tag} // Key is essential
                        variants={tagItemVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout // Smooth reordering/filtering
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                      >
                        <Button
                          variant={isSelected ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => handleTagClick(tag)}
                          // --- Apply conditional styling using cn ---
                          className={cn(
                            "w-full justify-start h-auto py-1.5 px-3 text-left", // Base styles
                            isSelected && "border border-primary/30" // Add border if selected
                          )}
                          // --- End conditional styling ---
                          aria-pressed={isSelected}
                        >
                          {/* --- Ensure text color contrasts with background --- */}
                          <span className={cn(
                            "flex-grow",
                            isSelected ? "text-secondary-foreground" : "text-card-foreground" // Explicit text colors
                          )}>
                            {tag}
                          </span>
                          {/* --- End text color adjustment --- */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                key={`check-${tag}`}
                                variants={checkVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ duration: 0.15 }}
                                className="ml-2 flex-shrink-0" // Apply layout classes here
                              >
                                <BsCheckLg className={cn(
                                  "w-4 h-4",
                                  isSelected ? "text-secondary-foreground" : "text-card-foreground" // Match checkmark color
                                )} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                      // --- End motion.div wrapper ---
                    );
                  })
                ) : (
                  // --- 7. Animate "No tags match" message ---
                  tagSearchTerm ? (
                    <motion.div
                      key="no-match-message"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-muted-foreground px-3 py-1.5"
                    >
                      No tags match "{tagSearchTerm}".
                    </motion.div>
                  ) : null
                  // --- End "No tags match" animation ---
                )}
              </AnimatePresence>
              {/* --- End map AnimatePresence --- */}
            </div>
          </motion.div>
          // --- End Content Area ---
        )}
      </AnimatePresence>
      {/* --- End Conditional Rendering --- */}
    </div>
  );
}

export default TagsFilter;