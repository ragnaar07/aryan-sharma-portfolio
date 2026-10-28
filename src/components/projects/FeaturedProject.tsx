import { Link } from 'next-view-transitions';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/project';

import ArrowRight from '../svgs/ArrowRight';

interface FeaturedProjectProps {
  project: Project;
}

export function FeaturedProject({ project }: FeaturedProjectProps) {
  return (
    <article className="bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="grid lg:grid-cols-2">
        <Link
          href={project.projectDetailsPageSlug}
          aria-label={`View ${project.title} project`}
          className="group bg-muted relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[380px]"
        >
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            preload
          />
          <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/5 to-transparent p-6 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View project
          </span>
        </Link>

        <div className="flex flex-col justify-center gap-6 p-6 sm:p-8 lg:p-10">
          <div className="space-y-4">
            <Badge variant="outline" className="w-fit">
              Featured project
            </Badge>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {project.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </div>
          </div>

          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 6).map((technology) => (
                <Badge key={technology.name} variant="secondary">
                  {technology.name}
                </Badge>
              ))}
            </div>
          )}

          <Button asChild className="w-fit">
            <Link href={project.projectDetailsPageSlug}>
              Explore project
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
