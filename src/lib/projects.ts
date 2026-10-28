import type { ReactNode } from 'react';

import { projects as staticProjects } from '@/config/Projects';
import {
  type ProjectRecord,
  normalizeProjectRecord,
} from '@/lib/project-validation';
import { listRedisProjects } from '@/lib/redis-projects';
import type { Project } from '@/types/project';

function slugFromProjectTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function normalizeStaticProject(
  project: (typeof staticProjects)[number],
  index = 0,
): ProjectRecord | null {
  const configuredSlug = project.projectDetailsPageSlug?.match(
    /^\/projects\/([^/]+)\/?$/,
  )?.[1];
  const slug = configuredSlug || slugFromProjectTitle(project.title);

  const record: ProjectRecord = {
    id: slug,
    slug,
    title: project.title,
    shortDescription: project.description,
    description: project.description,
    category: 'Engineering',
    tags: project.technologies.map((tech) => tech.name),
    techStack: project.technologies.map((tech) => tech.name),
    coverImage: project.image || null,
    liveUrl: project.live || null,
    repoUrl: project.github || null,
    demoUrl: project.link || null,
    github: project.github || null,
    featured: false,
    isPublished: true,
    status: 'published',
    metrics: [],
    highlights: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    order: index,
    image: project.image || null,
    details: project.details,
    projectDetailsPageSlug: project.projectDetailsPageSlug || '/projects',
    isWorking: project.isWorking,
    video: project.video || null,
    githubRepo: project.github || null,
  };

  return normalizeProjectRecord(record);
}

export function mergeProjects(
  staticProjectList: Array<ProjectRecord | null>,
  dynamicProjectList: Array<ProjectRecord | null>,
): ProjectRecord[] {
  const mergedMap = new Map<string, ProjectRecord>();

  for (const item of staticProjectList.filter(Boolean) as ProjectRecord[]) {
    mergedMap.set(item.slug, item);
  }

  for (const item of dynamicProjectList.filter(Boolean) as ProjectRecord[]) {
    const existing = mergedMap.get(item.slug);
    if (!existing) {
      mergedMap.set(item.slug, item);
      continue;
    }

    mergedMap.set(item.slug, {
      ...existing,
      ...item,
      tags: item.tags.length > 0 ? item.tags : existing.tags,
      techStack:
        item.techStack.length > 0 ? item.techStack : existing.techStack,
      metrics: item.metrics.length > 0 ? item.metrics : existing.metrics,
      highlights:
        item.highlights.length > 0 ? item.highlights : existing.highlights,
      updatedAt: item.updatedAt || existing.updatedAt,
      publishedAt: item.publishedAt || existing.publishedAt,
      isPublished: item.isPublished,
      status: item.status,
      featured: item.featured,
    });
  }

  return Array.from(mergedMap.values())
    .filter((project) => project.status !== 'archived')
    .sort((a, b) => {
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      if ((a.order ?? 0) !== (b.order ?? 0)) {
        return (a.order ?? 0) - (b.order ?? 0);
      }
      const aDate = new Date(a.publishedAt || a.updatedAt).valueOf();
      const bDate = new Date(b.publishedAt || b.updatedAt).valueOf();
      return bDate - aDate;
    });
}

export function projectRecordToProject(project: ProjectRecord): Project {
  return {
    title: project.title,
    description: project.shortDescription || project.description,
    image: project.coverImage || project.image || '/project/default.svg',
    video: project.video || undefined,
    link:
      project.demoUrl ||
      project.liveUrl ||
      project.repoUrl ||
      project.github ||
      '/projects',
    technologies: project.techStack.map((tech) => ({
      name: tech,
      icon: null as unknown as ReactNode,
    })),
    github: project.github || project.repoUrl || undefined,
    live:
      project.liveUrl ||
      project.demoUrl ||
      project.repoUrl ||
      project.github ||
      '/projects',
    details: true,
    projectDetailsPageSlug: `/projects/${project.slug}`,
    isWorking: project.isWorking,
    featured: project.featured,
  };
}

export async function getAllProjectsForAdmin(): Promise<ProjectRecord[]> {
  const [staticList, dynamicList] = await Promise.all([
    Promise.resolve(
      staticProjects
        .map(normalizeStaticProject)
        .filter(Boolean) as ProjectRecord[],
    ),
    listRedisProjects(),
  ]);

  return mergeProjects(staticList, dynamicList);
}

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  const allProjects = await getAllProjectsForAdmin();
  return allProjects.filter(
    (project) => project.isPublished && project.status !== 'archived',
  );
}

export async function getPublishedProjectsForUi(): Promise<Project[]> {
  const projects = await getPublishedProjects();
  return projects.map(projectRecordToProject);
}

export async function getProjectBySlug(
  slug: string,
): Promise<ProjectRecord | null> {
  const allProjects = await getPublishedProjects();
  return allProjects.find((project) => project.slug === slug) ?? null;
}

export async function getProjectForAdminBySlug(
  slug: string,
): Promise<ProjectRecord | null> {
  const allProjects = await getAllProjectsForAdmin();
  return allProjects.find((project) => project.slug === slug) ?? null;
}
