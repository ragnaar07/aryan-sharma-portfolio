import React from 'react';

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
      className={`animate-fade-in-blur container mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10 xl:max-w-7xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
