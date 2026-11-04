import { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import Container from '@/components/common/Container';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/Meta';
import { getProjectBySlug, getPublishedProjects } from '@/lib/projects';

interface ProjectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return { title: 'Project Not Found' };
  }

  return {
    metadataBase: new URL(siteConfig.url),
    title: `${project.title} - Project`,
    description: project.shortDescription,
    openGraph: {
      title: `${project.title} - Project`,
      description: project.shortDescription,
      images: [project.coverImage || '/meta/share/projects.jpg'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} - Project`,
      description: project.shortDescription,
      images: [project.coverImage || '/meta/share/projects.jpg'],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Button variant="ghost" asChild className="group">
            <Link href="/projects" className="flex items-center space-x-2">
              <ArrowLeft className="size-4" />
              <span>Back to Projects</span>
            </Link>
          </Button>
        </div>

        <header className="space-y-6">
          {project.coverImage && (
            <div className="relative aspect-video overflow-hidden rounded-lg border">
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{project.status}</Badge>
              {project.techStack.slice(0, 5).map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              {project.title}
            </h1>
            <p className="text-muted-foreground text-xl">
              {project.shortDescription}
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-3 text-lg font-semibold">Overview</h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {project.description}
            </p>
          </div>

          <div className="bg-card rounded-lg border p-6">
            <h2 className="mb-3 text-lg font-semibold">Links</h2>
            <div className="space-y-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Live Demo
                </a>
              )}
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary block underline"
                >
                  Repository
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary block underline"
                >
                  Demo
                </a>
              )}
            </div>
          </div>
        </div>

        {project.metrics.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {project.metrics.map((metric) => (
              <div
                key={`${project.slug}-${metric.label}`}
                className="bg-card rounded-lg border p-4"
              >
                <div className="text-muted-foreground text-sm">
                  {metric.label}
                </div>
                <div className="mt-2 text-2xl font-bold">{metric.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
