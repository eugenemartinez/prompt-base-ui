import React, { useState, useEffect, useMemo } from 'react';
import { Prompt } from '../types';
import { BsStar, BsStarFill, BsChatDots } from 'react-icons/bs';
import { Button } from './common/Button';
import clsx from 'clsx';

interface PromptCardProps {
  prompt: Prompt;
  onClick: () => void;
  isSaved: boolean;
  onToggleVault: (prompt: Prompt, currentlySaved: boolean) => boolean;
  onTagClick: (tag: string) => void;
  activeTags?: string[]; // <-- Add activeTags prop (optional array of strings)
}

// Helper function to format date (can be moved to a utils file later)
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};


function PromptCard({ prompt, onClick, isSaved, onToggleVault, onTagClick, activeTags = [] }: PromptCardProps) {
  const [currentlySaved, setCurrentlySaved] = useState(isSaved);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setCurrentlySaved(isSaved);
    setIsProcessing(false);
  }, [isSaved]);

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;

    setIsProcessing(true);
    const success = onToggleVault(prompt, currentlySaved);
    if (success) {
      setCurrentlySaved(!currentlySaved);
    } else {
      console.error("Failed to toggle vault status for card:", prompt.prompt_id);
    }
    setTimeout(() => setIsProcessing(false), 200);
  };


  const tagsToDisplay = prompt.tags?.slice(0, 3) || [];
  const remainingTagsCount = (prompt.tags?.length || 0) - tagsToDisplay.length;
  const formattedDate = formatDate(prompt.updated_at);

  // --- Handler for clicking a tag ---
  const handleTagButtonClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation(); // Prevent card click
    onTagClick(tag);
  };
  // --- End Handler ---

  // --- Create a Set for efficient lookup of active tags ---
  const activeTagSet = useMemo(() => new Set(activeTags), [activeTags]);

  return (
    <div
      // --- Add transition and hover effects ---
      className="relative p-4 bg-card text-card-foreground rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] cursor-pointer flex flex-col h-full border border-transparent hover:border-primary/30"
      // --- End Change ---
      onClick={onClick}
      aria-label={`View details for prompt: ${prompt.title}`} // Added aria-label
    >
      {/* Star Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIconClick}
        disabled={isProcessing}
        // --- Added transition for color change ---
        className={`absolute top-2 right-2 z-10 transition-colors duration-150 ${
        // --- End Change ---
          currentlySaved
            ? 'text-primary hover:bg-accent'
            : 'text-muted-foreground hover:text-primary hover:bg-accent'
        }`}
        aria-label={currentlySaved ? 'Remove from Vault' : 'Save to Vault'}
      >
        {isProcessing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : (currentlySaved ? <BsStarFill className="h-4 w-4" /> : <BsStar className="h-4 w-4" />)}
      </Button>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground mb-1 truncate pr-8">{prompt.title}</h3>

      {/* Date Updated */}
      <p className="text-xs text-muted-foreground mb-2">{formattedDate}</p>

      {/* Content Area */}
      <div className="relative flex-grow mb-3">
        <p className="text-sm text-muted-foreground overflow-hidden line-clamp-3 mb-2">
          {prompt.content}
        </p>
        {/* Tags Section */}
        <div className="flex flex-wrap items-center gap-1">
          {tagsToDisplay.length > 0 && (
            <>
              {tagsToDisplay.map((tag) => {
                const isActive = activeTagSet.has(tag);
                const buttonAriaProps: { 'aria-pressed'?: 'true' | 'false' } = {};
                buttonAriaProps['aria-pressed'] = isActive ? 'true' : 'false';

                return (
                  <button
                    key={tag}
                    onClick={(e) => handleTagButtonClick(e, tag)}
                    // --- Remove transition-colors, add transform if needed ---
                    className={clsx(
                      "px-2 py-0.5 text-xs rounded-full whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 transition-transform duration-150 ease-in-out cursor-pointer", // Removed transition-colors, added transform/duration/ease
                      {
                        'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105': isActive, // Added hover:scale-105
                        'bg-accent text-accent-foreground hover:bg-accent/80 hover:scale-105': !isActive, // Added hover:scale-105
                      }
                    )}
                    // --- End Change ---
                    aria-label={`Filter by tag: ${tag}${isActive ? ' (active)' : ''}`}
                    {...buttonAriaProps}
                  >
                    {tag}
                  </button>
                );
              })}
              {remainingTagsCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{remainingTagsCount} more
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {/* --- End Content Area --- */}


      {/* --- Footer Area (Username Left, Comments Right) --- */}
      <div className="mt-auto pt-2 border-t flex flex-wrap items-center justify-between gap-2 min-h-[28px] text-xs text-muted-foreground">
        {/* Username */}
        <div>
          {prompt.username && (
            <span className="italic">
              @{prompt.username} {/* Changed prefix */}
            </span>
          )}
        </div>

        {/* Comment Count */}
        <div>
          {(prompt.comment_count !== undefined && prompt.comment_count !== null) && (
            <div className="flex items-center gap-1" title={`${prompt.comment_count} comments`}>
              <BsChatDots className="h-3 w-3" />
              <span>{prompt.comment_count}</span>
            </div>
          )}
        </div>
      </div>
      {/* --- End Footer Area --- */}

    </div>
  );
}

export default PromptCard;