import { Metadata } from 'next';
import { Link } from 'next-view-transitions';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import Container from '@/components/common/Container';
import { ProjectContent } from '@/components/projects/ProjectContent';
import { ProjectNavigation } from '@/components/projects/ProjectNavigation';
import ArrowLeft from '@/components/svgs/ArrowLeft';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { siteConfig } from '@/config/Meta';
import {
  getProjectCaseStudyBySlug,
  getProjectNavigation,
  getPublishedProjectCaseStudies,
  getRelatedProjectCaseStudies,
} from '@/lib/project';
import { getProjectBySlug, getPublishedProjects } from '@/lib/projects';

interface ProjectCaseStudyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all project case studies
export async function generateStaticParams() {
  const caseStudies = getPublishedProjectCaseStudies();
  const projectRecords = await getPublishedProjects();

  const slugs = new Set([
    ...caseStudies.map((caseStudy) => caseStudy.slug),
    ...projectRecords.map((project) => project.slug),
  ]);

  return Array.from(slugs).map((slug) => ({ slug }));
}

// Generate metadata for each project case study
export async function generateMetadata({
  params,
}: ProjectCaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getProjectCaseStudyBySlug(slug);

  if (caseStudy && caseStudy.frontmatter.isPublished) {
    const { title, description, image } = caseStudy.frontmatter;
    return {
      metadataBase: new URL(siteConfig.url),
      title: `${title} - Project Case Study`,
      description,
      openGraph: {
        title: `${title} - Project Case Study`,
        description,
        images: [image],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - Project Case Study`,
        description,
        images: [image],
      },
    };
  }

  const project = await getProjectBySlug(slug);
  if (project) {
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

  return {
    title: 'Project Not Found',
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: ProjectCaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = await getProjectCaseStudyBySlug(slug);
  const dynamicProject = await getProjectBySlug(slug);

  if (caseStudy && caseStudy.frontmatter.isPublished) {
    const navigation = await getProjectNavigation(slug);
    const relatedProjects = await getRelatedProjectCaseStudies(slug, 2);

    return (
      <Container className="py-16">
        <div className="space-y-12">
          <div>
            <Button variant="ghost" asChild className="group">
              <Link href="/projects" className="flex items-center space-x-2">
                <ArrowLeft className="size-4" />
                <span>Back to Projects</span>
              </Link>
            </Button>
          </div>

          <ProjectContent
            frontmatter={caseStudy.frontmatter}
            content={caseStudy.content}
          />

          <ProjectNavigation
            previous={navigation.previous}
            next={navigation.next}
          />

          {relatedProjects.length > 0 && (
            <div className="space-y-6">
              <Separator />
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Related Projects</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {relatedProjects.map((project) => (
                    <div
                      key={project.slug}
                      className="group bg-card hover:bg-muted/50 rounded-lg border p-6 transition-colors"
                    >
                      <Link href={`/projects/${project.slug}`}>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <h3 className="group-hover:text-primary text-lg font-semibold">
                              {project.frontmatter.title}
                            </h3>
                            <div className="text-xs">
                              <div
                                className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                                  project.frontmatter.status === 'completed'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : project.frontmatter.status ===
                                        'in-progress'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                }`}
                              >
                                {project.frontmatter.status
                                  .charAt(0)
                                  .toUpperCase() +
                                  project.frontmatter.status.slice(1)}
                              </div>
                            </div>
                          </div>
                          <p className="text-muted-foreground line-clamp-2 text-sm">
                            {project.frontmatter.description}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {project.frontmatter.technologies
                              .slice(0, 3)
                              .map((tech) => (
                                <span
                                  key={tech}
                                  className="bg-muted rounded px-2 py-1 text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            {project.frontmatter.technologies.length > 3 && (
                              <span className="bg-muted rounded px-2 py-1 text-xs">
                                +{project.frontmatter.technologies.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Separator className="mb-8" />
            <Button asChild size="lg">
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (dynamicProject) {
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
            {dynamicProject.coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-lg border">
                <Image
                  src={dynamicProject.coverImage}
                  alt={dynamicProject.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{dynamicProject.status}</Badge>
                {dynamicProject.techStack.slice(0, 5).map((tech) => (
                  <Badge key={tech} variant="outline">
                    {tech}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                {dynamicProject.title}
              </h1>
              <p className="text-muted-foreground text-xl">
                {dynamicProject.shortDescription}
              </p>
            </div>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-3 text-lg font-semibold">Overview</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {dynamicProject.description}
              </p>
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="mb-3 text-lg font-semibold">Links</h2>
              <div className="space-y-2">
                {dynamicProject.liveUrl && (
                  <a
                    href={dynamicProject.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Live Demo
                  </a>
                )}
                {dynamicProject.repoUrl && (
                  <a
                    href={dynamicProject.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary block underline"
                  >
                    Repository
                  </a>
                )}
                {dynamicProject.demoUrl && (
                  <a
                    href={dynamicProject.demoUrl}
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

          {dynamicProject.metrics.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {dynamicProject.metrics.map((metric) => (
                <div
                  key={`${dynamicProject.slug}-${metric.label}`}
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

  notFound();
}
