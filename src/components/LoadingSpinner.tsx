import React from 'react';

function cx(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function LoadingSpinner({
  label,
  size = 'md'
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'sm'
      ? 'w-5 h-5 border-2'
      : size === 'lg'
        ? 'w-12 h-12 border-4'
        : 'w-8 h-8 border-[3px]';

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-[#736B63]">
      <div
        className={cx(
          dim,
          'border-[#8B2635] border-t-transparent rounded-full animate-spin'
        )}
      />
      {label && <p className="font-sans text-xs font-medium">{label}</p>}
    </div>
  );
}

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#8B2635] border-t-transparent rounded-full animate-spin" />
      <p className="font-serif text-sm font-semibold text-[#1A1817]">{label}</p>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[3/4] bg-[#EAE4D9]" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-[#EAE4D9] rounded w-1/3" />
        <div className="h-4 bg-[#EAE4D9] rounded w-3/4" />
        <div className="h-3 bg-[#EAE4D9] rounded w-full" />
        <div className="h-4 bg-[#EAE4D9] rounded w-1/4 pt-2" />
      </div>
    </div>
  );
}

export function BookCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}
