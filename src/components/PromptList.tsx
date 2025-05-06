import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchPrompts } from '../services/api';
import debounce from 'lodash/debounce';
import { Prompt } from '../types';
import PromptCard from './PromptCard';
import PromptCardSkeleton from './PromptCardSkeleton';
import { savePromptToVault, removePromptFromVault, getVaultPrompts } from '../utils/localStorage';
import { Input } from './common/Input';
import { Select } from './common/Select';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ErrorMessage } from './common/ErrorMessage';
import { EmptyState } from './common/EmptyState';
import { IoFilter, IoClose, IoAdd, IoShuffle } from 'react-icons/io5';
import { Button } from './common/Button';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

const sortOptions = [
  { value: 'updated_at_desc', label: 'Updated: Newest First' },
  { value: 'updated_at_asc', label: 'Updated: Oldest First' },
  { value: 'title_asc', label: 'Title: A-Z' },
  { value: 'title_desc', label: 'Title: Z-A' },
];

// --- Define Default Sort ---
const DEFAULT_SORT = sortOptions[0].value;
// --- End Define ---

interface PromptListProps {
  onPromptClick: (prompt: Prompt) => void;
  activeTags?: string[];
  vaultVersion: number;
  onVaultChange: () => void;
  onTagClick: (tag: string) => void;
  allTags: string[];
  onTagSelectionChange: (selectedTags: Set<string>) => void;
  isMobileFilterVisible: boolean;
  onToggleMobileFilter: () => void;
  // --- Add new props ---
  onGetRandom: () => void;
  isFetchingRandom: boolean;
  onCreateNew: () => void;
  isModalOpen: boolean; // <-- Add this prop
  // --- End new props ---
}

interface FetchPromptsResponse {
  results: Prompt[];
  count: number;
  next: string | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

function PromptList({
  onPromptClick,
  activeTags = [],
  vaultVersion,
  onVaultChange,
  onTagClick,
  allTags,
  onTagSelectionChange,
  isMobileFilterVisible,
  onToggleMobileFilter,
  onGetRandom,
  isFetchingRandom,
  onCreateNew,
  isModalOpen,
}: PromptListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeSort, setActiveSort] = useState<string>(DEFAULT_SORT);
  const activeTagsString = useMemo(() => activeTags.join(','), [activeTags]);

  const updateActiveSearchTerm = useCallback((term: string) => {
    setActiveSearchTerm(term);
  }, []);
  const debouncedUpdateActiveSearchTerm = useMemo(
    () => debounce(updateActiveSearchTerm, 500),
    [updateActiveSearchTerm]
  );
  useEffect(() => {
    debouncedUpdateActiveSearchTerm(searchTerm.trim());
    return () => {
      debouncedUpdateActiveSearchTerm.cancel();
    };
  }, [searchTerm, debouncedUpdateActiveSearchTerm]);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<FetchPromptsResponse, Error>({
    queryKey: ['prompts', activeSearchTerm, activeTagsString, activeSort],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await fetchPrompts(pageParam as number, activeSearchTerm, activeTagsString, activeSort);
      return result;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        try {
          const url = new URL(lastPage.next);
          const nextPageNum = parseInt(url.searchParams.get('page') || '', 10);
          if (!isNaN(nextPageNum)) {
            return nextPageNum;
          }
        } catch (e) {
          console.error("[useInfiniteQuery] Error parsing next page URL", e);
          return undefined;
        }
      }
      return undefined;
    },
  });

  // --- Update useMemo for prompts to de-duplicate ---
  const prompts = useMemo(() => {
    const allPrompts = data?.pages.flatMap(page => page.results) ?? [];
    // De-duplicate based on prompt_id
    const uniquePromptsMap = new Map<string, Prompt>();
    allPrompts.forEach(prompt => {
      if (!uniquePromptsMap.has(prompt.prompt_id)) {
        uniquePromptsMap.set(prompt.prompt_id, prompt);
      }
    });
    return Array.from(uniquePromptsMap.values());
  }, [data]);
  // --- End update ---

  const totalCount = useMemo(() => data?.pages[0]?.count ?? 0, [data]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPromptElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { threshold: 0.1 });
    if (node) observer.current.observe(node);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleSaveToVaultForCard = useCallback((promptToSave: Prompt): boolean => {
    try {
      const success = savePromptToVault(promptToSave);
      if (success) {
        toast.success('Prompt saved to Vault!');
        onVaultChange();
      } else {
        toast.error('Could not save prompt to Vault. Storage might be full or unavailable.');
      }
      return success;
    } catch (err) {
      console.error("Error saving to vault from card:", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(`Could not save prompt to Vault: ${errorMsg}`);
      return false;
    }
  }, [onVaultChange]);

  const handleRemoveFromVaultForCard = useCallback((promptId: string): boolean => {
    try {
      const success = removePromptFromVault(promptId);
      if (success) {
        toast.success('Prompt removed from Vault!');
        onVaultChange();
      } else {
        toast.error('Could not remove prompt from Vault. It might not exist.');
      }
      return success;
    } catch (err) {
      console.error("Error removing from vault from card:", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error(`Could not remove prompt from Vault: ${errorMsg}`);
      return false;
    }
  }, [onVaultChange]);

  const handleToggleCardVault = useCallback((prompt: Prompt, currentlySaved: boolean): boolean => {
    return currentlySaved ? handleRemoveFromVaultForCard(prompt.prompt_id) : handleSaveToVaultForCard(prompt);
  }, [handleRemoveFromVaultForCard, handleSaveToVaultForCard]);

  const savedPromptIds = useMemo(() => {
      return new Set(getVaultPrompts().map(p => p.prompt_id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultVersion]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveSort(event.target.value);
  };

  const clearSort = () => {
    setActiveSort(DEFAULT_SORT);
  };

  const clearTags = () => {
    onTagSelectionChange(new Set());
  };

  const isLoadingInitial = status === 'pending';
  const isError = status === 'error';
  const showEmpty = status === 'success' && !isFetching && prompts.length === 0;

  const getEmptyStateMessage = () => {
    if (activeSearchTerm && activeTags.length > 0) return `No prompts found matching "${activeSearchTerm}" with the selected tags.`;
    if (activeSearchTerm) return `No prompts found matching "${activeSearchTerm}".`;
    if (activeTags.length > 0) return `No prompts found with the selected tags.`;
    return 'No prompts available yet. Try creating one!';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-foreground">
          Discover Prompts ({totalCount})
          {(activeSearchTerm || activeTags.length > 0) && <span className="text-base font-normal text-muted-foreground ml-2">(filtered)</span>}
        </h2>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleMobileFilter}
            aria-label="Toggle Filters"
            aria-expanded={isMobileFilterVisible}
            aria-controls="mobile-filter-controls"
          >
            <IoFilter size={24} />
          </Button>
        </div>
      </div>

      <div
        id="mobile-filter-controls"
        className={cn(
          "mb-6 flex gap-4",
          "flex-col md:flex-row md:items-end",
          !isMobileFilterVisible && "hidden",
          "md:flex"
        )}
      >
        <div className="flex-grow">
          <Input
            type="search"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search prompts"
            className="w-full"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select
              options={sortOptions}
              value={activeSort}
              onChange={handleSortChange}
              aria-label="Sort prompts by"
              className="w-auto h-10"
            />
            {activeSort !== DEFAULT_SORT && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSort}
                aria-label="Clear sort"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                title="Clear sort"
              >
                <IoClose size={18} />
              </Button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={onGetRandom}
              disabled={isFetchingRandom}
              isLoading={isFetchingRandom}
              loadingText="Loading..."
              className="h-10"
            >
              <IoShuffle size={18} className="mr-2" /> Random
            </Button>
            <Button
              variant="primary"
              onClick={onCreateNew}
              className="h-10"
            >
               <IoAdd size={20} className="mr-2" /> Create
            </Button>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Select
              options={sortOptions}
              value={activeSort}
              onChange={handleSortChange}
              aria-label="Sort prompts by"
              className="w-full h-10 flex-grow"
            />
            {activeSort !== DEFAULT_SORT && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSort}
                aria-label="Clear sort"
                className="h-10 w-10 text-muted-foreground hover:text-foreground flex-shrink-0"
                title="Clear sort"
              >
                <IoClose size={18} />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              options={[{ value: '', label: `Tags (${activeTags.length} selected)` }, ...(allTags || []).map(tag => ({ value: tag, label: tag }))]}
              value=""
              onChange={(e) => {
                const tag = e.target.value;
                if (tag) {
                   const newTags = new Set(activeTags);
                   if (newTags.has(tag)) newTags.delete(tag);
                   else newTags.add(tag);
                   onTagSelectionChange(newTags);
                }
              }}
              aria-label="Filter by tags"
              className="w-full h-10 flex-grow"
            />
            {activeTags.length > 0 && (
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={clearTags}
                 aria-label="Clear selected tags"
                 className="h-10 w-10 text-muted-foreground hover:text-foreground flex-shrink-0"
                 title="Clear selected tags"
               >
                 <IoClose size={18} />
               </Button>
            )}
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty States */}
      {isLoadingInitial && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <PromptCardSkeleton key={index} />
          ))}
        </div>
      )}

      {/* --- Wrap Error/Empty states with AnimatePresence --- */}
      <AnimatePresence mode="wait"> {/* Use mode="wait" */}
        {isError && (
          <motion.div key="prompt-list-error" className="py-10"> {/* Add unique key */}
            <ErrorMessage message={`Error loading prompts: ${error?.message || 'Unknown error'}`} showIcon={true} className="justify-center" />
          </motion.div>
        )}
        {showEmpty && (
          <motion.div key="prompt-list-empty" className="py-10"> {/* Add unique key */}
            <EmptyState
              title="No Prompts Found"
              message={getEmptyStateMessage()}
              // Optionally add actions like a "Create New" button here
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- End Error/Empty states Wrap --- */}

      {/* Prompt Grid */}
      {!isLoadingInitial && !isError && prompts.length > 0 && (
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* The prompts array here is now guaranteed unique */}
            {prompts.map((prompt, index) => {
              const isSaved = savedPromptIds.has(prompt.prompt_id);
              return (
                <motion.div
                  key={prompt.prompt_id} // Key is now guaranteed unique
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  ref={index === prompts.length - 1 ? lastPromptElementRef : null}
                >
                  <PromptCard
                    prompt={prompt}
                    onClick={() => onPromptClick(prompt)}
                    isSaved={isSaved}
                    onToggleVault={handleToggleCardVault}
                    onTagClick={onTagClick}
                    activeTags={activeTags}
                  />
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* --- Loading More Indicator --- */}
      {isFetchingNextPage && (
        <div className="text-center text-muted-foreground py-6 col-span-full flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" /> Loading more...
        </div>
      )}
      {/* --- End Loading More Indicator --- */}

      {/* End Message */}
      {!hasNextPage && status === 'success' && prompts.length > 0 && (
          <div className="text-center text-muted-foreground py-6 col-span-full">You've reached the end!</div>
      )}

      {/* --- Floating Action Button (FAB) Section --- */}
      {!isModalOpen && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 lg:hidden">
          <Button
            onClick={onGetRandom}
            disabled={isFetchingRandom}
            className="bg-secondary text-secondary-foreground rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            aria-label="Get Random Prompt"
          >
            {isFetchingRandom ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <IoShuffle className="text-xl" />
            )}
          </Button>

          <Button
            onClick={onCreateNew}
            className="bg-primary text-primary-foreground rounded-full w-12 h-12 shadow-md hover:shadow-lg transition-all flex items-center justify-center"
            aria-label="Create New Prompt"
          >
            <IoAdd className="text-xl" />
          </Button>
        </div>
      )}
      {/* --- End FAB Section --- */}
    </>
  );
}

export default PromptList;