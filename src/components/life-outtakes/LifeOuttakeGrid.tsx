'use client';

import Image from 'next/image';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { LifeOuttake } from '@/lib/life-outtakes';

interface LifeOuttakeGridProps {
  outtakes: LifeOuttake[];
}

export function LifeOuttakeGrid({ outtakes }: LifeOuttakeGridProps) {
  const [activeOuttake, setActiveOuttake] = useState<LifeOuttake | null>(null);

  return (
    <>
      <div
        className={`grid grid-cols-1 items-start gap-4 sm:grid-cols-2 ${
          outtakes.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        }`}
      >
        {outtakes.map((outtake) => (
          <button
            type="button"
            key={outtake.id}
            aria-label={`View photo: ${outtake.caption}`}
            onClick={() => setActiveOuttake(outtake)}
            className="border-border bg-card group relative w-full cursor-zoom-in overflow-hidden rounded-lg border text-left focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: `${outtake.width ?? 4} / ${outtake.height ?? 3}`,
              }}
            >
              <Image
                src={outtake.imageUrl}
                alt={outtake.altText}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.04] group-focus-visible:scale-[1.04]"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                {outtake.collection && (
                  <p className="mb-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                    {outtake.collection}
                  </p>
                )}
                <p className="text-sm leading-6">{outtake.caption}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog
        open={activeOuttake !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActiveOuttake(null);
          }
        }}
      >
        <DialogContent className="w-fit max-w-[96vw] gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 text-white shadow-none sm:max-w-[96vw] [&>button]:top-3 [&>button]:right-3 [&>button]:z-10 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/60 [&>button]:bg-black/35 [&>button]:p-0 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:hover:bg-white/15 [&>button]:hover:text-white [&>button]:focus-visible:ring-white [&>button]:focus-visible:ring-offset-black">
          {activeOuttake && (
            <>
              <DialogTitle className="sr-only">
                {activeOuttake.caption}
              </DialogTitle>
              <div className="group relative inline-flex max-h-[94dvh] max-w-[96vw] items-center justify-center">
                <Image
                  src={activeOuttake.imageUrl}
                  alt={activeOuttake.altText}
                  width={activeOuttake.width ?? 1200}
                  height={activeOuttake.height ?? 900}
                  sizes="(max-width: 640px) 96vw, 90vw"
                  className="block h-auto max-h-[94dvh] w-auto max-w-[96vw] object-contain"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pt-24 pb-5 text-center sm:px-8 sm:pt-32 sm:pb-8">
                  {activeOuttake.collection && (
                    <p className="mb-2 text-xs font-medium tracking-[0.2em] text-white/85 uppercase sm:text-sm">
                      {activeOuttake.collection}
                    </p>
                  )}
                  <p className="mx-auto max-w-5xl text-xl leading-snug font-medium break-words text-white drop-shadow-lg sm:text-2xl md:text-3xl">
                    {activeOuttake.caption}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
