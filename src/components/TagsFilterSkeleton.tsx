// Define a set of Tailwind width classes to choose from
const skeletonTagWidths = [
  'w-10', // 40px
  'w-12', // 48px
  'w-14', // 56px
  'w-16', // 64px
  'w-20', // 80px
  'w-24', // 96px
];

function TagsFilterSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Search Input Placeholder */}
      <div className="h-10 w-full bg-muted rounded"></div>

      {/* Tag List Placeholder */}
      <div className="flex flex-wrap gap-2">
        {[...Array(15)].map((_, index) => {
          // Randomly select a width class for each tag
          const randomWidthClass = skeletonTagWidths[Math.floor(Math.random() * skeletonTagWidths.length)];
          return (
            <div
              key={index}
              // Apply the randomly selected width class along with other classes
              className={`h-6 rounded-full bg-muted ${randomWidthClass}`}
              // --- Removed inline style ---
              // style={{ width: `${Math.floor(Math.random() * 60) + 40}px` }}
            ></div>
          );
        })}
      </div>
    </div>
  );
}

export default TagsFilterSkeleton;