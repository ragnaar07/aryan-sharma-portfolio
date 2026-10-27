import React from 'react';

import { cn } from '@/lib/utils';

export default function Container({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'animate-fade-in-blur container mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 xl:max-w-7xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
