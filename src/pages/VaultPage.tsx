import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Prompt, PromptDetail } from '../types';
import { getVaultPrompts, removePromptFromVault, savePromptToVault, clearVault } from '../utils/localStorage';
import { fetchPromptsBatch } from '../services/api';
import PromptCard from '../components/PromptCard';
import PromptDetailModal from '../components/PromptDetailModal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Button } from '../components/common/Button';
import { IoFilter, IoClose, IoTrash } from 'react-icons/io5';
import { ConfirmationModal } from '../components/common/ConfirmationModal'; // Adjust path as needed
import { cn } from '../utils/cn'; // <-- Import cn
import PromptCardSkeleton from '../components/PromptCardSkeleton'; // <-- Import skeleton

// --- Define Sort Options and Default ---
const sortOptions = [
  { value: 'updated_at_desc', label: 'Last Updated (Newest)' },
  { value: 'updated_at_asc', label: 'Last Updated (Oldest)' },
  { value: 'created_at_desc', label: 'Date Added (Newest)' },
  { value: 'created_at_asc', label: 'Date Added (Oldest)' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
];
const DEFAULT_SORT = sortOptions[0].value; // Define default sort value
// --- End Sort Options ---

// --- 2. Define Card Animation Variants ---
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ // Stagger effect
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05, // Stagger delay based on index
      duration: 0.3,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } } // Optional exit animation
};
// --- End Card Animation Variants ---

function VaultPage() {
  const navigate = useNavigate();
  const [vaultPrompts, setVaultPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial local storage read
  const [isBatchLoading, setIsBatchLoading] = useState(false); // For the API sync
  const [batchError, setBatchError] = useState<string | null>(null); // For API sync errors
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState(DEFAULT_SORT); // Use default
  const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false); // <-- Add state
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false); // <-- State for confirmation

  // Reads from local storage - kept synchronous
  const loadFromLocalStorage = useCallback(() => {
      setVaultPrompts(getVaultPrompts());
      setIsInitialLoading(false); // Done reading local storage
  }, []);

  // Effect for initial load from local storage
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Effect for batch fetching updates after initial load
  useEffect(() => {
    const localPrompts = getVaultPrompts(); // Get current IDs directly
    // Only run if not initially loading and there are prompts in local storage
    if (!isInitialLoading && localPrompts.length > 0) {
      const syncWithServer = async () => {
        setIsBatchLoading(true);
        setBatchError(null);
        const promptIds = localPrompts.map(p => p.prompt_id);
        try {
          const freshPrompts = await fetchPromptsBatch(promptIds);
          // Create a map for efficient lookup of fresh data
          const freshPromptsMap = new Map(freshPrompts.map(p => [p.prompt_id, p]));

          // Update state: Use fresh data if available, otherwise keep local.
          // Filter out any prompts that were in local storage but NOT returned by the batch endpoint
          // (this handles cases where a prompt might have been deleted server-side).
          setVaultPrompts(
             localPrompts
                .map(localPrompt => freshPromptsMap.get(localPrompt.prompt_id) || localPrompt) // Use fresh if available
                .filter(p => freshPromptsMap.has(p.prompt_id)) // Keep only those confirmed by server
          );

          // Optional: Update local storage to remove prompts not found in batch
          const freshIds = new Set(freshPrompts.map(p => p.prompt_id));
          localPrompts.forEach(localPrompt => {
              if (!freshIds.has(localPrompt.prompt_id)) {
                  console.log(`Removing prompt ${localPrompt.prompt_id} from local vault as it wasn't found on server.`);
                  removePromptFromVault(localPrompt.prompt_id); // Clean up local storage
              }
          });


        } catch (error) {
          console.error("Vault sync failed:", error);
          setBatchError(error instanceof Error ? error.message : "Failed to sync vault with server.");
          // On error, we keep the prompts loaded initially from local storage.
          // We already loaded them in the first effect.
        } finally {
          setIsBatchLoading(false);
        }
      };
      syncWithServer();
    }
    // Dependency: Run only when initial load finishes.
  }, [isInitialLoading]);


  const handlePromptDeletedCallback = useCallback((deletedPromptId: string) => {
    // Remove directly from state and local storage
    removePromptFromVault(deletedPromptId);
    setVaultPrompts(prev => prev.filter(p => p.prompt_id !== deletedPromptId));
    setSelectedPrompt(null); // Close modal if the deleted prompt was selected
  }, []);


  const handlePromptClick = (prompt: Prompt) => setSelectedPrompt(prompt);
  const handleCloseModal = (refreshNeeded: boolean = false) => {
    setSelectedPrompt(null);
    // Refresh from local might be needed if a prompt was EDITED and saved within the modal
    // OR if a comment was added/deleted (though PromptDetailModal handles its own comment state)
    // Let's keep the refresh for now after edits.
    if (refreshNeeded) {
      loadFromLocalStorage(); // Reload from local storage
    }
  };

  // --- Handler for Prompt Update ---
  const handlePromptUpdated = (updatedPrompt: PromptDetail) => {
    // Update the state directly
    setVaultPrompts((currentPrompts) =>
      currentPrompts.map((p) =>
        p.prompt_id === updatedPrompt.prompt_id
          ? { ...p, ...updatedPrompt } // Merge updated data into the existing prompt object
          : p
      )
    );
    // Local storage is already updated by savePromptToVault in the modal's handleSavePromptEdit
  };
  // --- End Handler ---

  // This handler updates local storage and state after modal save
  const handleSaveToVault = useCallback((promptToSave: Prompt): boolean => {
    try { // Wrap in try...catch
      const success = savePromptToVault(promptToSave);
      if (success) {
          setVaultPrompts(prev => prev.map(p => p.prompt_id === promptToSave.prompt_id ? promptToSave : p));
          toast.success('Prompt saved/updated in Vault!');
      } else {
          // --- Update toast.error ---
          toast.error('Failed to save prompt changes locally. Storage might be full.');
          // --- End update ---
      }
      return success;
    } catch (err) {
      console.error("Error saving to vault (modal):", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // --- Update toast.error ---
      toast.error(`Could not save prompt to Vault: ${errorMsg}`);
      // --- End update ---
      return false;
    }
  }, []);

  // This handler removes from local storage and state after modal remove
  const handleRemoveFromVault = useCallback((promptId: string): boolean => {
    try { // Wrap in try...catch
      const success = removePromptFromVault(promptId);
      if (success) {
          setVaultPrompts(prev => prev.filter(p => p.prompt_id !== promptId));
          setSelectedPrompt(currentSelected =>
            currentSelected?.prompt_id === promptId ? null : currentSelected
          );
          toast.success('Prompt removed from Vault!');
      } else {
          // --- Update toast.error ---
          toast.error('Could not remove prompt from Vault locally. It might not exist.');
          // --- End update ---
      }
      return success;
    } catch (err) {
      console.error("Error removing from vault (modal):", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // --- Update toast.error ---
      toast.error(`Could not remove prompt from Vault: ${errorMsg}`);
      // --- End update ---
      return false;
    }
  }, []);

  // This handler is for the card's toggle button
   const handleToggleCardVault = useCallback((prompt: Prompt, currentlySaved: boolean): boolean => {
    if (currentlySaved) {
      try { // Wrap in try...catch
        const success = removePromptFromVault(prompt.prompt_id);
        if (success) {
            setVaultPrompts(prev => prev.filter(p => p.prompt_id !== prompt.prompt_id));
            toast.success('Prompt removed from Vault!');
        } else {
            // --- Update toast.error ---
            toast.error('Could not remove prompt from Vault locally. It might not exist.');
            // --- End update ---
        }
        return success;
      } catch (err) {
        console.error("Error removing from vault (card toggle):", err);
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
        // --- Update toast.error ---
        toast.error(`Could not remove prompt from Vault: ${errorMsg}`);
        // --- End update ---
        return false;
      }
    }
    return false;
  }, []);


  const checkIsSelectedPromptSaved = useCallback(() => {
    // A prompt viewed from the vault is always considered "saved" in this context
    return !!selectedPrompt;
  }, [selectedPrompt]);

  // --- Handler for clicking a tag on a card in the vault (redirects) ---
  const handleTagClickRedirect = (tag: string) => {
    navigate('/', { state: { filterTag: tag } }); // Navigate to home with tag in state
  };
  // --- End Handler ---

  // --- Handler for clicking a tag IN THE MODAL (also redirects) ---
  const handleModalTagClickRedirect = (tag: string) => {
    navigate('/', { state: { filterTag: tag } }); // Navigate to home with tag in state
    handleCloseModal(); // Close the modal after initiating navigation
  };
  // --- End Handler ---


  const displayedPrompts = useMemo(() => {
    let filtered = [...vaultPrompts];

    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(lowerSearchTerm) ||
        prompt.content.toLowerCase().includes(lowerSearchTerm) ||
        (prompt.tags && prompt.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }

    filtered.sort((a, b) => {
      switch (sortCriteria) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'created_at_asc': {
          const dateA_created = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB_created = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA_created - dateB_created;
        }
        case 'created_at_desc': {
          const dateA_created_desc = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB_created_desc = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB_created_desc - dateA_created_desc;
        }
        case 'updated_at_asc': {
           const dateA_updated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
           const dateB_updated = b.updated_at ? new Date(b.updated_at).getTime() : 0;
           return dateA_updated - dateB_updated;
        }
        case 'updated_at_desc': // Default
        default: {
          const dateA_updated_desc = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB_updated_desc = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB_updated_desc - dateA_updated_desc;
        }
      }
    });

    return filtered;
  }, [vaultPrompts, searchTerm, sortCriteria]);


  // --- Updated Loading/Empty State Logic ---
  if (isInitialLoading) { // Show skeletons only during the very initial local storage read
    return (
      <div className="container mx-auto p-4">
        {/* --- Heading Placeholder (Optional but good for layout) --- */}
        <div className="flex justify-between items-center mb-4 gap-2 animate-pulse">
          <div className="h-8 w-1/3 bg-muted rounded"></div> {/* Heading */}
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 bg-muted rounded"></div> {/* Filter Button */}
            <div className="h-9 w-32 bg-muted rounded"></div> {/* Clear Button */}
          </div>
        </div>
        {/* --- Filter Panel Placeholder (Optional) --- */}
        <div className="mb-6 flex gap-4 flex-col sm:flex-row sm:items-end animate-pulse">
          <div className="flex-grow h-10 bg-muted rounded"></div> {/* Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            <div className="h-10 flex-grow sm:flex-grow-0 sm:w-[240px] bg-muted rounded"></div> {/* Sort */}
            <div className="h-10 w-10 bg-muted rounded"></div> {/* Clear Sort */}
          </div>
        </div>
        {/* --- End Placeholders --- */}

        {/* --- Skeleton Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <PromptCardSkeleton key={index} />
          ))}
        </div>
        {/* --- End Skeleton Grid --- */}
      </div>
);
  }
  // --- End Loading/Empty State Logic ---

  // --- Handler to toggle mobile filter visibility ---
  const toggleMobileFilter = () => {
    setIsMobileFilterVisible(prev => !prev);
  };
  // --- End Handler ---

  // --- Handler to clear sort ---
  const clearSort = () => {
    setSortCriteria(DEFAULT_SORT);
  };
  // --- End Handler ---

  // --- Handler to initiate clearing the vault ---
  const handleClearVaultClick = () => {
    if (vaultPrompts.length > 0) { // Only open if vault is not empty
      setIsClearConfirmOpen(true);
    } else {
      toast.error("Vault is already empty.");
    }
  };
  // --- End Handler ---

  // --- Handler to confirm and execute clearing the vault ---
  const handleConfirmClearVault = () => {
    try {
      clearVault();
      setVaultPrompts([]); // Clear state
      setIsClearConfirmOpen(false); // Close dialog
      toast.success('Vault cleared successfully!');
    } catch (error) {
      console.error("Failed to clear vault:", error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred.';
      // --- Update toast.error ---
      toast.error(`Failed to clear vault: ${errorMsg}`);
      // --- End update ---
      setIsClearConfirmOpen(false);
    }
  };
  // --- End Handler ---

  // --- Handler for Comment Added ---
  const handleCommentAdded = (promptId: string) => {
    // Find the prompt in the current state to update local storage correctly
    const promptToUpdate = vaultPrompts.find(p => p.prompt_id === promptId);

    // Update the state directly
    setVaultPrompts((currentPrompts) =>
      currentPrompts.map((p) =>
        p.prompt_id === promptId
          ? { ...p, comment_count: (p.comment_count || 0) + 1 }
          : p
      )
    );

    // Update local storage if the prompt was found
    if (promptToUpdate) {
        savePromptToVault({ ...promptToUpdate, comment_count: (promptToUpdate.comment_count || 0) + 1 });
    } else {
        console.warn(`VaultPage: Could not find prompt ${promptId} in state to update local storage after comment added.`);
    }
  };
  // --- End Handler ---

  // --- Handler for Comment Deleted ---
  const handleCommentDeleted = (promptId: string) => {
    // Find the prompt in the current state to update local storage correctly
    const promptToUpdate = vaultPrompts.find(p => p.prompt_id === promptId);

    // Update the state directly
    setVaultPrompts((currentPrompts) =>
      currentPrompts.map((p) =>
        p.prompt_id === promptId
          ? { ...p, comment_count: Math.max(0, (p.comment_count || 0) - 1) } // Ensure count doesn't go below 0
          : p
      )
    );

     // Update local storage if the prompt was found
    if (promptToUpdate) {
        savePromptToVault({ ...promptToUpdate, comment_count: Math.max(0, (promptToUpdate.comment_count || 0) - 1) });
    } else {
        console.warn(`VaultPage: Could not find prompt ${promptId} in state to update local storage after comment deleted.`);
    }
  };
  // --- End Handler ---

  return (
    <div className="container mx-auto p-4 bg-background text-foreground">

      {/* Heading & Action Buttons */}
      <div className="flex justify-between items-center mb-4 gap-2"> {/* Added gap */}
          <h2 className="text-2xl font-semibold text-foreground flex-shrink-0 mr-auto"> {/* Added flex-shrink-0 mr-auto */}
              My Vault ({displayedPrompts.length}{vaultPrompts.length !== displayedPrompts.length ? <span className="text-base font-normal text-muted-foreground ml-1">{` of ${vaultPrompts.length}`}</span> : ''})
          </h2>

          {/* --- Action Buttons Container --- */}
          <div className="flex items-center gap-2 flex-shrink-0"> {/* Container for buttons */}
            {/* Filter Toggle Button */}
            <Button
              variant="ghost"
              className="px-3"
              onClick={toggleMobileFilter}
              aria-label="Toggle Filters and Sort"
              aria-expanded={isMobileFilterVisible}
              aria-controls="vault-filter-panel"
            >
              <IoFilter size={20} className="mr-0 md:mr-2" />
              <span className="hidden md:inline">Filter / Sort</span>
            </Button>

            {/* Clear Vault Button */}
            <Button
              variant="outline" // Keep variant="outline"
              // --- Update className to match modal's delete button style ---
              className="px-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground focus:ring-destructive"
              // --- End Update ---
              onClick={handleClearVaultClick}
              disabled={vaultPrompts.length === 0 || isBatchLoading} // Disable if empty or syncing
              aria-label="Clear Vault"
            >
              <IoTrash size={20} className="mr-0 md:mr-2" /> {/* Responsive margin */}
              <span className="hidden md:inline">Clear Vault</span> {/* Responsive text */}
            </Button>
          </div>
          {/* --- End Action Buttons Container --- */}

          {/* --- Sync Indicator (Position might need adjustment if buttons wrap) --- */}
          {isBatchLoading && !isMobileFilterVisible && (
              <div className="hidden md:flex items-center text-sm text-muted-foreground pl-4"> {/* Hide on mobile */}
                  <LoadingSpinner size="sm" className="mr-1" /> Syncing...
              </div>
          )}
          {/* --- End Sync Indicator --- */}
      </div>

      {/* --- Filter Panel (Collapsible, All Screens) --- */}
      <div
        id="vault-filter-panel"
        className={cn(
          "mb-6 flex gap-4",
          "flex-col sm:flex-row sm:items-end", // Stacked by default, row layout on sm+
          isMobileFilterVisible ? "block" : "hidden"
        )}
      >
        {/* Search Input Container */}
        <div className="flex-grow"> {/* Takes available space in row layout */}
          <Input
            type="search"
            id="vault-search"
            placeholder="Search title, content, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search Vault"
            className="w-full" // Ensure it takes full width of its container
          />
        </div>

        {/* Sort Dropdown & Clear Button Container */}
        {/* --- Adjusted width for row layout --- */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"> {/* Full width on mobile, auto on sm+ */}
          <Select
            id="vault-sort"
            options={sortOptions}
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value)}
            aria-label="Sort by"
            // --- Adjusted width classes ---
            className="h-10 flex-grow sm:flex-grow-0 sm:w-[240px]" // Grow on mobile, fixed width on sm+
          />
          {sortCriteria !== DEFAULT_SORT && (
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

        {/* Sync indicator inside panel */}
        {isBatchLoading && isMobileFilterVisible && (
          // --- Ensure indicator doesn't interfere with flex layout ---
          <div className="w-full sm:w-auto text-center sm:text-left pt-2 sm:pt-0 sm:pb-2"> {/* Adjust padding/alignment */}
            <div className="flex items-center justify-center sm:justify-start text-sm text-muted-foreground">
                <LoadingSpinner size="sm" className="mr-1" /> Syncing...
            </div>
          </div>
          // --- End Indicator ---
        )}
      </div>
      {/* --- End Filter Panel --- */}


      {/* --- REMOVE Desktop Search and Sort Controls --- */}
      {/*
      <div className="mb-6 hidden md:flex gap-4">
         ... desktop controls ...
      </div>
      */}
      {/* --- End REMOVE --- */}


      {/* Batch Error Message */}
      {/* --- 2. Wrap ErrorMessage with AnimatePresence --- */}
      <AnimatePresence>
        {!isInitialLoading && batchError && (
          <motion.div key="batch-error"> {/* Add key */}
            <ErrorMessage message={batchError} className="mb-4 text-center" />
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- End ErrorMessage Wrap --- */}


      {/* Prompt Grid or Empty/No Match Message */}
      {/* --- 3. Wrap Empty/No Match states with AnimatePresence --- */}
      <AnimatePresence mode="wait"> {/* Use mode="wait" */}
        {!isInitialLoading && vaultPrompts.length === 0 && !isBatchLoading ? (
          <motion.div key="vault-empty" className="py-10"> {/* Add key */}
            <EmptyState
              title="Your Vault is Empty"
              message={
                <>
                  Browse the <a href="/" className="text-primary hover:text-primary/80 underline">Home page</a> and save prompts you like!
                </>
              }
              className="bg-card border rounded-lg p-6"
            />
          </motion.div>
        ) : !isInitialLoading && displayedPrompts.length === 0 && vaultPrompts.length > 0 ? (
          <motion.div key="vault-no-match" className="text-center text-muted-foreground py-10"> {/* Add key */}
            No prompts in your vault match the current search.
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* --- End Empty/No Match Wrap --- */}

      {/* --- Prompt Grid --- */}
      {!isInitialLoading && displayedPrompts.length > 0 && (
        // --- 3. Wrap Grid with AnimatePresence ---
        <AnimatePresence>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPrompts.map((prompt, index) => (
              // --- 4. Wrap PromptCard with motion.div ---
              <motion.div
                key={prompt.prompt_id} // Essential key
                custom={index} // For stagger
                variants={cardVariants} // Apply variants
                initial="hidden"
                animate="visible"
                exit="exit"
                layout // For smooth layout changes on filter/sort
              >
                <PromptCard
                  prompt={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  isSaved={true} // Prompts in vault are always "saved"
                  onToggleVault={handleToggleCardVault}
                  onTagClick={handleTagClickRedirect}
                />
              </motion.div>
              // --- End motion.div wrapper ---
            ))}
          </div>
        </AnimatePresence>
        // --- End AnimatePresence ---
      )}
      {/* --- End Prompt Grid --- */}


      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPrompt && (
          <PromptDetailModal
            key={selectedPrompt.prompt_id}
            prompt={selectedPrompt}
            onClose={handleCloseModal}
            onSaveToVault={handleSaveToVault}
            onRemoveFromVault={handleRemoveFromVault}
            isSaved={checkIsSelectedPromptSaved()} // Use the function here
            onPromptDeleted={handlePromptDeletedCallback}
            onTagClick={handleModalTagClickRedirect}
            onPromptUpdated={handlePromptUpdated}
            onCommentAdded={handleCommentAdded} // <-- Pass handler
            onCommentDeleted={handleCommentDeleted} // <-- Pass handler
          />
        )}
      </AnimatePresence>

      {/* Clear Vault Confirmation Dialog */}
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)} // Use onClose to set state
        onConfirm={handleConfirmClearVault}
        title="Are you absolutely sure?"
        message={
          <>
            This action cannot be undone. This will permanently remove all
            prompts ({vaultPrompts.length}) from your vault storage.
          </>
        }
        confirmText="Clear Vault"
        confirmVariant="danger" // Use danger variant for the confirm button
        cancelText="Cancel"
      />
    </div>
  );
}

export default VaultPage;