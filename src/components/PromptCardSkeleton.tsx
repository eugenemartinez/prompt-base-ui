function PromptCardSkeleton() {
  return (
    <div className="relative p-4 bg-card rounded-lg shadow-sm border h-full flex flex-col animate-pulse">
      {/* Star Placeholder */}
      <div className="absolute top-2 right-2 h-6 w-6 bg-muted rounded-full"></div>

      {/* Title Placeholder */}
      <div className="h-5 w-3/4 bg-muted rounded mb-1.5"></div>

      {/* Date Placeholder */}
      <div className="h-3 w-1/4 bg-muted rounded mb-2"></div>

      {/* Content Placeholder */}
      <div className="space-y-1.5 mb-3 flex-grow">
        <div className="h-3 w-full bg-muted rounded"></div>
        <div className="h-3 w-full bg-muted rounded"></div>
        <div className="h-3 w-5/6 bg-muted rounded"></div>
      </div>

      {/* Tags Placeholder */}
      <div className="flex flex-wrap items-center gap-1 mb-3">
        <div className="h-4 w-12 bg-muted rounded-full"></div>
        <div className="h-4 w-16 bg-muted rounded-full"></div>
        <div className="h-4 w-10 bg-muted rounded-full"></div>
      </div>

      {/* Footer Placeholder */}
      <div className="mt-auto pt-2 border-t flex items-center justify-between gap-2 min-h-[28px]">
        {/* Username Placeholder */}
        <div className="h-3 w-1/3 bg-muted rounded"></div>
        {/* Comment Count Placeholder */}
        <div className="h-3 w-8 bg-muted rounded"></div>
      </div>
    </div>
  );
}

export default PromptCardSkeleton;