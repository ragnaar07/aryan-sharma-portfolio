import { Metadata } from 'next';

import Container from '@/components/common/Container';
import { FeaturedProject } from '@/components/projects/FeaturedProject';
import { ProjectList } from '@/components/projects/ProjectList';
import { Separator } from '@/components/ui/separator';
import { generateMetadata as getMetadata } from '@/config/Meta';
import { getPublishedProjectsForUi } from '@/lib/projects';

export const metadata: Metadata = {
  ...getMetadata('/projects'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjectsForUi();
  const featuredIndex = projects.findIndex((project) => project.featured);
  const selectedProjectIndex =
    featuredIndex === -1 && projects.length > 0 ? 0 : featuredIndex;
  const featuredProject = projects[selectedProjectIndex];
  const remainingProjects = projects.filter(
    (_, index) => index !== selectedProjectIndex,
  );

  return (
    <Container className="py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Projects
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            My projects and work across different technologies and domains.
          </p>
        </div>

        <Separator />

        {featuredProject && (
          <section
            aria-labelledby="featured-project-heading"
            className="space-y-5"
          >
            <div>
              <p className="text-muted-foreground text-sm font-medium tracking-[0.18em] uppercase">
                A closer look
              </p>
              <h2
                id="featured-project-heading"
                className="mt-1 text-2xl font-semibold"
              >
                Featured project
              </h2>
            </div>
            <FeaturedProject project={featuredProject} />
          </section>
        )}

        {remainingProjects.length > 0 ? (
          <section aria-labelledby="all-projects-heading" className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium tracking-[0.18em] uppercase">
                  Selected work
                </p>
                <h2
                  id="all-projects-heading"
                  className="mt-1 text-2xl font-semibold"
                >
                  All projects
                </h2>
              </div>
              <span className="text-muted-foreground text-sm">
                {projects.length}{' '}
                {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            <ProjectList
              projects={remainingProjects}
              className="lg:grid-cols-3"
            />
          </section>
        ) : projects.length === 0 ? (
          <section aria-labelledby="all-projects-heading" className="space-y-6">
            <h2 id="all-projects-heading" className="text-2xl font-semibold">
              All projects
            </h2>
            <ProjectList projects={[]} />
          </section>
        ) : null}
      </div>
    </Container>
  );
}
