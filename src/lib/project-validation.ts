import { z } from 'zod';

export const projectStatusSchema = z.enum(['draft', 'published', 'archived']);

export const projectMetricSchema = z.object({
  label: z.string().trim().min(1, 'Metric label is required'),
  value: z.string().trim().min(1, 'Metric value is required'),
});

export const projectRecordSchema = z.object({
  id: z.string().min(1, 'Project id is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Project slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens.',
    ),
  title: z.string().trim().min(1, 'Project title is required'),
  shortDescription: z.string().trim().min(1, 'Short description is required'),
  description: z.string().trim().min(1, 'Project description is required'),
  category: z.string().trim().min(1, 'Category is required'),
  tags: z.array(z.string().trim().min(1)).default([]),
  techStack: z.array(z.string().trim().min(1)).default([]),
  coverImage: z.string().trim().nullable().optional().default(null),
  liveUrl: z.string().trim().nullable().optional().default(null),
  repoUrl: z.string().trim().nullable().optional().default(null),
  demoUrl: z.string().trim().nullable().optional().default(null),
  github: z.string().trim().nullable().optional().default(null),
  featured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  status: projectStatusSchema.default('draft'),
  metrics: z.array(projectMetricSchema).default([]),
  highlights: z.array(z.string().trim().min(1)).default([]),
  createdAt: z
    .string()
    .datetime()
    .or(z.string().min(1))
    .default(new Date().toISOString()),
  updatedAt: z
    .string()
    .datetime()
    .or(z.string().min(1))
    .default(new Date().toISOString()),
  publishedAt: z.string().datetime().nullable().optional().default(null),
  order: z.number().int().nonnegative().default(0),
  image: z.string().trim().nullable().optional().default(null),
  details: z.boolean().default(false),
  projectDetailsPageSlug: z.string().trim().default('/projects'),
  isWorking: z.boolean().default(true),
  video: z.string().trim().nullable().optional().default(null),
  githubRepo: z.string().trim().nullable().optional().default(null),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectMetric = z.infer<typeof projectMetricSchema>;
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export const projectFormSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Project slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug may only contain lowercase letters, numbers, and hyphens.',
    ),
  shortDescription: z.string().trim().min(1, 'Short description is required'),
  description: z.string().trim().min(1, 'Description is required'),
  category: z.string().trim().min(1, 'Category is required'),
  tags: z.string().transform((value) =>
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  ),
  techStack: z.string().transform((value) =>
    value
      .split(',')
      .map((tech) => tech.trim())
      .filter(Boolean),
  ),
  coverImage: z.string().trim().default(''),
  liveUrl: z.string().trim().default(''),
  repoUrl: z.string().trim().default(''),
  demoUrl: z.string().trim().default(''),
  github: z.string().trim().default(''),
  featured: z.coerce.boolean().default(false),
  status: projectStatusSchema.default('draft'),
  order: z.coerce.number().int().nonnegative().default(0),
});

export function normalizeSlug(value: string | null | undefined): string {
  const slug = (value ?? '').trim().toLowerCase();
  return slug
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function normalizeProjectRecord(raw: unknown): ProjectRecord | null {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const slug = normalizeSlug(
    typeof candidate.slug === 'string' ? candidate.slug : undefined,
  );
  const title =
    typeof candidate.title === 'string' ? candidate.title.trim() : '';
  const shortDescription =
    typeof candidate.shortDescription === 'string'
      ? candidate.shortDescription.trim()
      : '';
  const description =
    typeof candidate.description === 'string'
      ? candidate.description.trim()
      : '';
  const category =
    typeof candidate.category === 'string' ? candidate.category.trim() : '';
  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const techStack = Array.isArray(candidate.techStack)
    ? candidate.techStack.map((tech) => String(tech).trim()).filter(Boolean)
    : [];

  const coverImage =
    typeof candidate.coverImage === 'string' && candidate.coverImage.trim()
      ? candidate.coverImage.trim()
      : typeof candidate.image === 'string' && candidate.image.trim()
        ? candidate.image.trim()
        : null;

  const resolvedStatus =
    candidate.status === 'published' || candidate.status === 'archived'
      ? candidate.status
      : 'draft';

  const isPublished =
    candidate.isPublished === true ||
    resolvedStatus === 'published' ||
    (typeof candidate.isPublished === 'string' &&
      candidate.isPublished.toLowerCase() === 'true');

  if (!slug || !title || !shortDescription || !description || !category) {
    return null;
  }

  const now = new Date().toISOString();
  const result: ProjectRecord = {
    id: String(candidate.id ?? slug),
    slug,
    title,
    shortDescription,
    description,
    category,
    tags,
    techStack,
    coverImage,
    liveUrl:
      typeof candidate.liveUrl === 'string'
        ? candidate.liveUrl.trim() || null
        : null,
    repoUrl:
      typeof candidate.repoUrl === 'string'
        ? candidate.repoUrl.trim() || null
        : null,
    demoUrl:
      typeof candidate.demoUrl === 'string'
        ? candidate.demoUrl.trim() || null
        : null,
    github:
      typeof candidate.github === 'string'
        ? candidate.github.trim() || null
        : null,
    featured: candidate.featured === true,
    isPublished,
    status: resolvedStatus,
    metrics: Array.isArray(candidate.metrics)
      ? candidate.metrics
          .map((metric) => {
            if (!metric || typeof metric !== 'object') return null;
            const item = metric as Record<string, unknown>;
            const label =
              typeof item.label === 'string' ? item.label.trim() : '';
            const value =
              typeof item.value === 'string' ? item.value.trim() : '';
            if (!label || !value) return null;
            return { label, value };
          })
          .filter(
            (metric): metric is { label: string; value: string } =>
              metric !== null,
          )
      : [],
    highlights: Array.isArray(candidate.highlights)
      ? candidate.highlights
          .map((highlight) => String(highlight).trim())
          .filter(Boolean)
      : [],
    createdAt:
      typeof candidate.createdAt === 'string' ? candidate.createdAt : now,
    updatedAt:
      typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now,
    publishedAt:
      typeof candidate.publishedAt === 'string' && candidate.publishedAt.trim()
        ? candidate.publishedAt
        : isPublished
          ? now
          : null,
    order: Number(candidate.order ?? 0),
    image: coverImage,
    details: candidate.details === true,
    projectDetailsPageSlug:
      typeof candidate.projectDetailsPageSlug === 'string'
        ? candidate.projectDetailsPageSlug.trim() || '/projects'
        : '/projects',
    isWorking: candidate.isWorking !== false,
    video:
      typeof candidate.video === 'string' && candidate.video.trim()
        ? candidate.video.trim()
        : null,
    githubRepo:
      typeof candidate.githubRepo === 'string' && candidate.githubRepo.trim()
        ? candidate.githubRepo.trim()
        : null,
  };

  return projectRecordSchema.safeParse(result).success ? result : null;
}

export function isValidUrl(value: string | null | undefined): boolean {
  if (!value || !value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function safeProjectSlug(value: string | null | undefined): string {
  return normalizeSlug(value) || 'project';
}
