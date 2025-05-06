function PromptDetailModalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Prompt Content Placeholder */}
      <div>
        <div className="h-3 w-1/6 bg-muted rounded mb-1"></div> {/* Label */}
        <div className="bg-muted p-4 rounded-lg border space-y-2">
          <div className="h-3 w-full bg-muted-foreground/20 rounded"></div>
          <div className="h-3 w-full bg-muted-foreground/20 rounded"></div>
          <div className="h-3 w-5/6 bg-muted-foreground/20 rounded"></div>
          <div className="h-3 w-full bg-muted-foreground/20 rounded"></div>
          <div className="h-3 w-3/4 bg-muted-foreground/20 rounded"></div>
        </div>
      </div>

      {/* Metadata Placeholder */}
      <div className="text-sm space-y-1.5 border-t pt-4">
        <div className="h-3 w-1/3 bg-muted rounded"></div>
        <div className="h-3 w-1/4 bg-muted rounded"></div>
        <div className="h-3 w-1/4 bg-muted rounded"></div>
        <div className="flex flex-wrap gap-1 pt-1 items-center">
          <div className="h-3 w-8 bg-muted rounded mr-1"></div> {/* Tags label */}
          <div className="h-4 w-12 bg-muted rounded-full"></div>
          <div className="h-4 w-16 bg-muted rounded-full"></div>
        </div>
      </div>

      {/* Action Buttons Placeholder */}
      <div className="pt-4 border-t flex flex-wrap justify-center gap-3">
        <div className="h-9 w-36 bg-muted rounded"></div>
        <div className="h-9 w-36 bg-muted rounded"></div>
        <div className="h-9 w-32 bg-muted rounded"></div>
        <div className="h-9 w-32 bg-muted rounded"></div>
      </div>

      {/* Comments Section Placeholder */}
      <div className="border-t pt-4 space-y-4">
        <div className="h-5 w-1/2 bg-muted rounded mb-3"></div> {/* Heading */}
        {/* Add Comment Form Placeholder */}
        <div className="mb-4 space-y-2">
          <div className="h-20 w-full bg-muted rounded"></div> {/* Textarea */}
          <div className="flex items-end gap-2">
            <div className="h-9 flex-grow bg-muted rounded"></div> {/* Input */}
            <div className="h-9 w-36 bg-muted rounded"></div> {/* Button */}
          </div>
        </div>
        {/* Comment Card Skeletons */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 bg-muted rounded-lg border space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3 w-1/4 bg-muted-foreground/20 rounded"></div> {/* User/Date */}
                <div className="h-3 w-1/5 bg-muted-foreground/20 rounded"></div> {/* Date */}
              </div>
              <div className="h-3 w-full bg-muted-foreground/20 rounded"></div>
              <div className="h-3 w-5/6 bg-muted-foreground/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromptDetailModalSkeleton;