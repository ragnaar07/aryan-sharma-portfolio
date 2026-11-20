import Image from 'next/image';

import type { LifeOuttake } from '@/lib/life-outtakes';

interface LifeOuttakeGridProps {
  outtakes: LifeOuttake[];
}

export function LifeOuttakeGrid({ outtakes }: LifeOuttakeGridProps) {
  return (
    <div
      className={`grid grid-cols-1 items-start gap-4 sm:grid-cols-2 ${
        outtakes.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
      }`}
    >
      {outtakes.map((outtake) => (
        <article
          key={outtake.id}
          tabIndex={0}
          className="border-border bg-card group relative w-full overflow-hidden rounded-lg border"
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
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04] group-focus:scale-[1.04]"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus:opacity-100 [@media(hover:none)]:opacity-100">
              {outtake.collection && (
                <p className="mb-1 text-xs font-medium tracking-wide text-white/75 uppercase">
                  {outtake.collection}
                </p>
              )}
              <p className="text-sm leading-6">{outtake.caption}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
