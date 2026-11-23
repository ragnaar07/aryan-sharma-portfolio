'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { LifeOuttake } from '@/lib/life-outtakes';

interface LifeOuttakeGridProps {
  outtakes: LifeOuttake[];
}

export function LifeOuttakeGrid({ outtakes }: LifeOuttakeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, setGridWidth] = useState(0);
  const [columnCount, setColumnCount] = useState(outtakes.length >= 2 ? 2 : 1);
  const [activeOuttake, setActiveOuttake] = useState<LifeOuttake | null>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setGridWidth(width);
      setColumnCount(
        width < 640 ? 1 : width < 1024 || outtakes.length < 4 ? 2 : 3,
      );
    });
    observer.observe(grid);

    return () => observer.disconnect();
  }, [outtakes.length]);
  const columns = useMemo(() => {
    const result = Array.from(
      { length: columnCount },
      () => [] as LifeOuttake[],
    );
    const heights = Array.from({ length: columnCount }, () => 0);
    const columnWidth = Math.max(
      1,
      (gridWidth - (columnCount - 1) * 16) / columnCount,
    );

    for (const outtake of outtakes) {
      const shortestColumn = heights.indexOf(Math.min(...heights));
      result[shortestColumn].push(outtake);
      heights[shortestColumn] +=
        outtake.height && outtake.width
          ? (outtake.height / outtake.width) * columnWidth + 16
          : columnWidth * 0.75 + 16;
    }

    return result;
  }, [columnCount, gridWidth, outtakes]);
  const columnWeights =
    outtakes.length === 2 && columnCount === 2
      ? columns.map((column) => {
          const outtake = column[0];
          const aspectRatio =
            outtake?.width && outtake.height
              ? outtake.width / outtake.height
              : 1;
          return Math.min(1.5, Math.max(0.75, aspectRatio));
        })
      : columns.map(() => 1);

  return (
    <>
      <div
        ref={gridRef}
        className="grid items-start gap-4"
        style={{
          gridTemplateColumns: columnWeights
            .map((weight) => `minmax(0, ${weight}fr)`)
            .join(' '),
        }}
      >
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex min-w-0 flex-col gap-4">
            {column.map((outtake) => (
              <button
                type="button"
                key={outtake.id}
                aria-label={`View photo: ${outtake.caption}`}
                onClick={() => setActiveOuttake(outtake)}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg text-left shadow-sm focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
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
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-cover transition-[filter] duration-500 group-hover:brightness-90 group-focus-visible:brightness-90"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pt-16 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
                    {outtake.collection && (
                      <p className="mb-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                        {outtake.collection}
                      </p>
                    )}
                    <p className="line-clamp-3 text-sm leading-5">
                      {outtake.caption}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
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
        <DialogContent
          style={{ width: 'fit-content', maxWidth: '96vw', display: 'flex' }}
          className="gap-0 overflow-visible rounded-none border-0 bg-transparent p-0 text-white shadow-none [&>button]:top-3 [&>button]:right-3 [&>button]:z-10 [&>button]:flex [&>button]:size-11 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:border [&>button]:border-white/60 [&>button]:bg-black/35 [&>button]:p-0 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:hover:bg-white/15 [&>button]:hover:text-white [&>button]:focus-visible:ring-white [&>button]:focus-visible:ring-offset-black"
        >
          {activeOuttake && (
            <>
              <DialogTitle className="sr-only">
                {activeOuttake.caption}
              </DialogTitle>
              <div className="group relative inline-flex max-h-[94dvh] max-w-[96vw] items-center justify-center">
                <Image
                  key={activeOuttake.id}
                  src={activeOuttake.imageUrl}
                  alt={activeOuttake.altText}
                  width={activeOuttake.width ?? 1200}
                  height={activeOuttake.height ?? 900}
                  sizes="(max-width: 640px) 96vw, 90vw"
                  className="block h-[90dvh] max-h-[90dvh] w-auto max-w-[96vw] object-contain"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pt-12 pb-4 text-center sm:px-8 sm:pt-16 sm:pb-6">
                  {activeOuttake.collection && (
                    <p className="mb-1 text-xs font-medium tracking-[0.2em] text-white/85 uppercase sm:text-sm">
                      {activeOuttake.collection}
                    </p>
                  )}
                  <p className="mx-auto line-clamp-3 max-w-5xl text-xl leading-snug font-medium break-words text-white drop-shadow-lg sm:text-2xl md:text-3xl">
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
