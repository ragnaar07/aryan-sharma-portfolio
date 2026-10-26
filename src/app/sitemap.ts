import { getSiteUrl } from '@/config/Meta';
import { getPublishedBlogPostsAsync } from '@/lib/blog';
import { getPublishedProjectCaseStudies } from '@/lib/project';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // 1. Static Portfolio Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/work-experience`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/journey`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/journey/certificates`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/resume`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/gears`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/setup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 2. Published Blog Posts (merges local MDX files and Redis; drafts are strictly excluded)
  const publishedBlogPosts = await getPublishedBlogPostsAsync();
  const blogRoutes: MetadataRoute.Sitemap = publishedBlogPosts.map((post) => {
    const rawDate = post.frontmatter.updatedDate || post.frontmatter.date;
    const dateObj = rawDate ? new Date(rawDate) : new Date();
    const lastModified = isNaN(dateObj.getTime()) ? new Date() : dateObj;

    return {
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    };
  });

  // 3. Published Project Case Studies (drafts strictly excluded)
  const caseStudies = getPublishedProjectCaseStudies();
  const projectRoutes: MetadataRoute.Sitemap = caseStudies.map((study) => {
    return {
      url: `${siteUrl}/projects/${study.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    };
  });

  // Note: /admin, /admin/login, and all draft posts are strictly excluded
  return [...staticRoutes, ...blogRoutes, ...projectRoutes];
}
