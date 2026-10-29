import { about } from './About';
import { heroConfig } from './Hero';

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Resolves the canonical production site URL.
 * Checks environment variables in priority order:
 * 1. NEXT_PUBLIC_SITE_URL (explicit production domain)
 * 2. SITE_URL
 * 3. NEXT_PUBLIC_URL (if not localhost in production)
 * 4. VERCEL_PROJECT_PRODUCTION_URL (automatic Vercel system env var)
 * 5. VERCEL_URL (deployment URL on Vercel)
 * 6. Localhost fallback for local development
 */
export function getSiteUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_URL;

  if (envUrl && envUrl.trim().length > 0) {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    const isLocalhost =
      trimmed.includes('localhost') || trimmed.includes('127.0.0.1');

    // If running in production but envUrl points to localhost, prefer Vercel production domains
    if (process.env.NODE_ENV === 'production' && isLocalhost) {
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
          /\/+$/,
          '',
        );
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
      }
    }

    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  }

  // Automatic Vercel production system environment variables
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(
      /\/+$/,
      '',
    );
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
}

// Base site configuration
export const siteConfig = {
  name: heroConfig.name,
  title: 'Aryan Sharma Portfolio',
  description:
    'Portfolio of Aryan Sharma, software engineer focused on C++, Linux, Python, AI/ML, and industrial automation.',
  get url() {
    return getSiteUrl();
  },
  ogImage: '/meta/share/home.jpg',
  author: {
    name: about.name,
    twitter: '',
    github: 'ragnaar07',
    linkedin: 'aryansh7',
    email: 'aryan.engineer783@gmail.com',
  },
  keywords: [
    'portfolio',
    'software engineer',
    'c++',
    'linux',
    'python',
    'machine learning',
    'ai engineer',
    'embedded systems',
    'industrial automation',
    heroConfig.name.toLowerCase(),
  ],
};

export const pageMetadata: Record<string, PageMeta> = {
  // Home page
  '/': {
    title: `${heroConfig.name} - ${heroConfig.title}`,
    description: `${about.seoDescription} Explore my projects, experience, and technical expertise.`,
    keywords: [
      'portfolio',
      'software engineer',
      'ai engineer',
      'machine learning',
      'projects',
    ],
    ogImage: '/meta/share/home.jpg',
    twitterCard: 'summary_large_image',
  },

  // Contact page
  '/contact': {
    title: 'Contact - Get in Touch',
    description:
      "Get in touch with me for collaborations, projects, or opportunities. I'd love to hear from you!",
    keywords: ['contact', 'hire', 'collaboration', 'freelance', 'developer'],
    ogImage: '/meta/share/contact.jpg',
    twitterCard: 'summary',
  },

  // Work Experience page
  '/work-experience': {
    title: 'Work Experience - Professional Journey',
    description:
      'Explore my professional work experience across different companies and roles in software development.',
    keywords: [
      'work experience',
      'career',
      'professional',
      'software engineer',
      'employment history',
    ],
    ogImage: '/meta/share/work-experience.jpg',
    twitterCard: 'summary_large_image',
  },

  // Projects page
  '/projects': {
    title: 'Projects - My Work & Projects Portfolio',
    description:
      'Discover my projects and work across different technologies and domains. From web apps to mobile solutions.',
    keywords: [
      'projects',
      'portfolio',
      'machine learning',
      'systems programming',
      'applications',
      'software',
    ],
    ogImage: '/meta/share/projects.jpg',
    twitterCard: 'summary_large_image',
  },

  // Blog page
  '/blog': {
    title: 'Blog - Thoughts & Tutorials',
    description:
      'Read my thoughts, tutorials, and insights on engineering, programming, and AI/ML.',
    keywords: [
      'blog',
      'tutorials',
      'programming',
      'machine learning',
      'technical writing',
    ],
    ogImage: '/meta/share/blog.jpg',
    twitterCard: 'summary_large_image',
  },

  // Resume page
  '/resume': {
    title: 'Resume - Professional CV',
    description: `View and download ${heroConfig.name}'s professional resume and CV. Technical skills, experience, and qualifications.`,
    keywords: [
      'resume',
      'cv',
      'professional',
      'skills',
      'qualifications',
      'download',
    ],
    ogImage: '/meta/share/resume.jpg',
    twitterCard: 'summary',
  },

  // Gears page
  '/gears': {
    title: 'Gears - My Setup & Tools',
    description:
      'Discover the tools, devices, and software I use to get my work done efficiently.',
    keywords: [
      'setup',
      'tools',
      'devices',
      'software',
      'productivity',
      'development environment',
    ],
    ogImage: '/meta/share/gears.jpg',
    twitterCard: 'summary_large_image',
  },

  // Setup page
  '/setup': {
    title: 'Setup Guide - VS Code Configuration',
    description:
      'Complete guide to setting up VS Code with my preferred configuration, extensions, and fonts for optimal development.',
    keywords: [
      'vscode',
      'setup',
      'configuration',
      'extensions',
      'development environment',
      'guide',
    ],
    ogImage: '/meta/share/setup.jpg',
    twitterCard: 'summary_large_image',
  },

  // Journey page
  '/journey': {
    title: 'Journey - Milestones & Personal Growth',
    description:
      'Explore my journey, key milestones, learning paths, and personal growth in software engineering and artificial intelligence.',
    keywords: [
      'journey',
      'milestones',
      'career path',
      'growth',
      'software engineering',
      'ai',
    ],
    ogImage: '/meta/share/journey.jpg',
    twitterCard: 'summary_large_image',
  },

  // Certificates page
  '/journey/certificates': {
    title: 'Certificates & Credentials - Aryan Sharma',
    description:
      'Browse professional certifications, credentials, and achievements earned in software development, machine learning, and cloud computing.',
    keywords: [
      'certificates',
      'credentials',
      'achievements',
      'certifications',
      'awards',
      'learning',
    ],
    ogImage: '/meta/share/certificates.jpg',
    twitterCard: 'summary_large_image',
  },
};

// Helper function to get metadata for a specific page
export function getPageMetadata(pathname: string): PageMeta {
  return pageMetadata[pathname] || pageMetadata['/'];
}

// Helper function to generate complete metadata object for Next.js
export function generateMetadata(pathname: string) {
  const pageMeta = getPageMetadata(pathname);
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: pageMeta.title,
    description: pageMeta.description,
    keywords: pageMeta.keywords?.join(', '),
    authors: [{ name: siteConfig.author.name }],
    creator: siteConfig.author.name,
    openGraph: {
      type: 'website',
      url: `${siteUrl}${pathname}`,
      title: pageMeta.title,
      description: pageMeta.description,
      siteName: siteConfig.title,
      images: [
        {
          url: pageMeta.ogImage || siteConfig.ogImage,
          alt: pageMeta.title,
        },
      ],
    },
    twitter: {
      card: pageMeta.twitterCard || 'summary_large_image',
      title: pageMeta.title,
      description: pageMeta.description,
      creator: siteConfig.author.twitter,
      images: [pageMeta.ogImage || siteConfig.ogImage],
    },
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
    alternates: {
      canonical: `${siteUrl}${pathname}`,
    },
  };
}
