import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query'; // Removed InfiniteData if only invalidating
import PromptList from '../components/PromptList';
import CreatePromptModal from '../components/CreatePromptModal';
import PromptDetailModal from '../components/PromptDetailModal';
import TagsFilter from '../components/TagsFilter';
import { Prompt, PromptDetail } from '../types';
import { getRandomPrompt, fetchTags } from '../services/api';
import { savePromptToVault, removePromptFromVault, isPromptInVault, savePromptCode, getVaultPrompts } from '../utils/localStorage';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { cn } from '../utils/cn';

function HomePage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isFetchingRandom, setIsFetchingRandom] = useState(false);
  const [randomError, setRandomError] = useState<string | null>(null);
  const [vaultVersion, setVaultVersion] = useState(0);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<Error | null>(null);
  const [isMobileFilterVisible, setIsMobileFilterVisible] = useState(false);

  // --- 1. Refactor loadTags into a useCallback ---
  const loadTags = useCallback(async () => {
    setTagsLoading(true);
    setTagsError(null);
    try {
      const fetchedTags = await fetchTags();
      setAllTags(fetchedTags.sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error("Error loading tags:", err);
      if (err instanceof Error) {
        setTagsError(err);
      } else {
        setTagsError(new Error("Failed to load tags."));
      }
    } finally {
      setTagsLoading(false);
    }
  }, []); // Empty dependency array, function itself doesn't depend on state/props

  // --- Load tags initially on mount ---
  useEffect(() => {
    loadTags();
  }, [loadTags]); // Depend on the memoized loadTags function
  // --- End initial load ---

  // --- Effect to check for incoming tag filter from navigation state ---
  useEffect(() => {
    if (location.state?.filterTag) {
      const tagToFilter = location.state.filterTag;
      setActiveTags(prevTags => {
        const newTags = new Set(prevTags);
        newTags.add(tagToFilter); // Add the tag from state
        return newTags;
      });
      // Clear the state to prevent re-filtering on refresh/re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Add location.pathname to the dependency array
  }, [location.state, navigate, location.pathname]);
  // --- End Effect ---

  const handleCreateNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleGetRandom = async () => {
    setIsFetchingRandom(true);
    setRandomError(null);
    setSelectedPrompt(null);
    const loadingToastId = toast.loading('Fetching random prompt...');
    try {
      const randomPrompt = await getRandomPrompt();
      setSelectedPrompt(randomPrompt);
      toast.dismiss(loadingToastId);
    } catch (err: unknown) {
      toast.dismiss(loadingToastId);
      console.error("Error fetching random prompt:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load random prompt.';
      setRandomError(errorMsg);
      // --- Update toast.error ---
      toast.error(`Error fetching random prompt: ${errorMsg}`);
      // --- End update ---
    } finally {
      setIsFetchingRandom(false);
    }
  };

  const handlePromptCreated = (newPrompt: Prompt & { modification_code?: string }) => {
    setIsCreateModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['prompts'] }); // Invalidate list after creation

    if (newPrompt.modification_code) {
      savePromptCode(newPrompt.prompt_id, newPrompt.modification_code);
    }
    // --- 2. Reload tags after creating a prompt ---
    loadTags();
    // --- End reload ---
  };

  const handlePromptClick = (prompt: Prompt) => {
    setRandomError(null);
    setSelectedPrompt(prompt);
  };

  const handleCloseDetailModal = (refreshNeeded: boolean = false) => {
    setSelectedPrompt(null);
    if (refreshNeeded) {
      // Invalidate queries to force refetch the list
      queryClient.invalidateQueries({ queryKey: ['prompts'] }); // Invalidate all prompt lists
    }
  };

  // --- Handler for Prompt Update ---
  const handlePromptUpdated = (updatedPrompt: PromptDetail) => {
    queryClient.invalidateQueries({ queryKey: ['prompts'] }); // Invalidate list
    if (isPromptInVault(updatedPrompt.prompt_id)) {
        savePromptToVault(updatedPrompt);
        setVaultVersion(v => v + 1);
    }
    // --- 2. Reload tags after updating a prompt ---
    loadTags();
    // --- End reload ---
  };
  // --- End Handler ---

  // --- Handler for Prompt Deletion (from Modal) ---
  const handlePromptDeleted = (deletedPromptId: string) => {
    queryClient.invalidateQueries({ queryKey: ['prompts'] }); // Invalidate list
    const removed = removePromptFromVault(deletedPromptId);
    if (removed) {
        setVaultVersion(v => v + 1);
    }
    setSelectedPrompt(null);
    // --- Optional: Reload tags after deleting a prompt ---
    // loadTags(); // Uncomment if you want to potentially remove orphaned tags immediately
    // --- End Optional Reload ---
  };
  // --- End Handler ---

  // --- Handler for Comment Added ---
  const handleCommentAdded = (promptId: string) => {
    queryClient.invalidateQueries({ queryKey: ['prompts'] });
    if (isPromptInVault(promptId)) {
        const vaultPrompts = getVaultPrompts();
        const promptIndex = vaultPrompts.findIndex(p => p.prompt_id === promptId);
        if (promptIndex !== -1) {
            const updatedPrompt = {
                ...vaultPrompts[promptIndex],
                comment_count: (vaultPrompts[promptIndex].comment_count || 0) + 1
            };
            savePromptToVault(updatedPrompt);
            setVaultVersion(v => v + 1);
        }
    }
  };
  // --- End Handler ---

  // --- Handler for Comment Deleted ---
  const handleCommentDeleted = (promptId: string) => {
    queryClient.invalidateQueries({ queryKey: ['prompts'] });
     if (isPromptInVault(promptId)) {
        const vaultPrompts = getVaultPrompts();
        const promptIndex = vaultPrompts.findIndex(p => p.prompt_id === promptId);
        if (promptIndex !== -1) {
            const updatedPrompt = {
                ...vaultPrompts[promptIndex],
                comment_count: Math.max(0, (vaultPrompts[promptIndex].comment_count || 0) - 1)
            };
            savePromptToVault(updatedPrompt);
            setVaultVersion(v => v + 1);
        }
    }
  };
  // --- End Handler ---

  const handleVaultChangedByList = useCallback(() => {
    setVaultVersion(v => v + 1);
  }, []);

  const handleSaveToVaultForModal = (promptToSave: Prompt): boolean => {
    try { // Wrap in try...catch for potential localStorage errors
      const success = savePromptToVault(promptToSave);
      if (success) {
        setVaultVersion(v => v + 1);
        toast.success('Prompt saved to Vault!');
      } else {
        // --- Update toast.error ---
        toast.error('Could not save prompt to Vault. Storage might be full or unavailable.');
        // --- End update ---
      }
      return success;
    } catch (err) {
      console.error("Error saving to vault:", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // --- Update toast.error ---
      toast.error(`Could not save prompt to Vault: ${errorMsg}`);
      // --- End update ---
      return false;
    }
  };

  const handleRemoveFromVaultForModal = (promptId: string): boolean => {
    try { // Wrap in try...catch
      const success = removePromptFromVault(promptId);
      if (success) {
        setVaultVersion(v => v + 1);
        toast.success('Prompt removed from Vault!');
      } else {
        // --- Update toast.error ---
        toast.error('Could not remove prompt from Vault. It might not exist.');
        // --- End update ---
      }
      return success;
    } catch (err) {
      console.error("Error removing from vault:", err);
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      // --- Update toast.error ---
      toast.error(`Could not remove prompt from Vault: ${errorMsg}`);
      // --- End update ---
      return false;
    }
  };

  // --- Remove useCallback from checkIsSelectedPromptSaved ---
  const checkIsSelectedPromptSaved = () => {
    if (!selectedPrompt) return false;
    // Re-runs whenever HomePage re-renders, checking the latest vault status
    return isPromptInVault(selectedPrompt.prompt_id);
  };
  // --- End Remove ---

  const handleTagSelectionChange = useCallback((newSelectedTags: Set<string>) => {
    setActiveTags(newSelectedTags);
  }, []);

  const toggleMobileFilter = () => {
    setIsMobileFilterVisible(prev => !prev);
  };

  // --- Modify handleTagClickFromCard for Toggle Behavior ---
  const handleTagClickFromCard = useCallback((tag: string) => {
    setActiveTags(prevTags => {
      const newTags = new Set(prevTags);
      if (newTags.has(tag)) {
        newTags.delete(tag); // Remove if already present
      } else {
        newTags.add(tag); // Add if not present
      }
      return newTags;
    });
    // No navigation needed, just update filters which PromptList should react to
  }, []);
  // --- End Modification ---

  // --- Handler for clicking a tag in the modal ---
  const handleModalTagClick = (tag: string) => {
    // This adds the tag and closes the modal. If navigation is desired, update here.
    setActiveTags(prevTags => {
      const newTags = new Set(prevTags);
      newTags.add(tag);
      return newTags;
    });
    handleCloseDetailModal();
  };
  // --- End handler ---

  // --- Calculate if any modal is open ---
  const isAnyModalOpen = selectedPrompt !== null || isCreateModalOpen; // Assuming isConfirmClearOpen exists for vault clear
  // --- End Calculation ---

  return (
    <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6 bg-background text-foreground relative min-h-screen">
      {/* Left Sidebar */}
      {/* --- Add scrollbar classes --- */}
      <aside className={cn(
        "w-full md:w-1/4 lg:w-1/5 flex-shrink-0 md:self-start hidden md:block sticky top-4 max-h-[85vh] overflow-y-auto",
        // Add these scrollbar styles:
        "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 active:scrollbar-thumb-gray-600 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
      )}>
      {/* --- End adding scrollbar classes --- */}
        <TagsFilter
          selectedTags={activeTags}
          onSelectionChange={handleTagSelectionChange}
          allTags={allTags}
          loading={tagsLoading}
          error={tagsError}
          // --- Pass className to TagsFilter to remove its internal scrollbar ---
          className="h-auto overflow-y-visible" // Override internal scroll behavior
          // --- End className pass ---
        />
      </aside>


      {/* Main Content Area */}
      <main className="flex-grow pb-20 lg:pb-0">

        {/* Display Random Fetch Error (Uses string message) */}
        <ErrorMessage message={randomError} className="mb-4 text-center" />

        {/* Prompt List */}
        <PromptList
          // --- Remove key prop ---
          // key={refreshKey}
          // --- End Remove ---
          onPromptClick={handlePromptClick}
          activeTags={Array.from(activeTags)}
          vaultVersion={vaultVersion}
          onVaultChange={handleVaultChangedByList}
          onTagClick={handleTagClickFromCard}
          allTags={allTags}
          onTagSelectionChange={handleTagSelectionChange}
          isMobileFilterVisible={isMobileFilterVisible}
          onToggleMobileFilter={toggleMobileFilter}
          onGetRandom={handleGetRandom}
          isFetchingRandom={isFetchingRandom}
          onCreateNew={handleCreateNew}
          isModalOpen={isAnyModalOpen}
        />
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreatePromptModal
            key="create-modal" // Add key for AnimatePresence
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onPromptCreated={handlePromptCreated}
          />
        )}
        {selectedPrompt && (
          <PromptDetailModal
            key={selectedPrompt.prompt_id}
            prompt={selectedPrompt}
            onClose={handleCloseDetailModal}
            onSaveToVault={handleSaveToVaultForModal}
            onRemoveFromVault={handleRemoveFromVaultForModal}
            isSaved={checkIsSelectedPromptSaved()} // Call the regular function
            onPromptDeleted={handlePromptDeleted}
            onTagClick={handleModalTagClick}
            onPromptUpdated={handlePromptUpdated}
            onCommentAdded={handleCommentAdded} // <-- Pass handler
            onCommentDeleted={handleCommentDeleted} // <-- Pass handler
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomePage;