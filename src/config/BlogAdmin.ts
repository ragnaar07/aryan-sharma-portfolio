export const BLOG_CATEGORIES = [
  'Engineering',
  'AI & Machine Learning',
  'Systems & C++',
  'Next.js & React',
  'Linux & Automation',
  'Architecture',
  'Tutorials',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const BLOG_VALIDATION = {
  title: {
    min: 3,
    max: 120,
  },
  description: {
    min: 10,
    max: 300,
  },
  slug: {
    min: 2,
    max: 100,
    regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  content: {
    maxCharacters: 500_000, // ~500 KB MDX
  },
  coverImage: {
    maxUploadSizeBytes: 400 * 1024, // 400 KB server limit
    targetMaxSizeBytes: 300 * 1024, // ~300 KB client compression target
    maxDimension: 1200, // 1200px max width/height
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
    ] as const,
  },
} as const;

export const adminBlogLabels = {
  form: {
    newTitle: 'Create New Article',
    editTitle: 'Edit Article',
    newDescription:
      'Compose and publish technical articles, guides, and architectural breakdowns.',
    editDescription:
      'Update article metadata, content, tags, or publishing visibility.',
    titleLabel: 'Post Title',
    titlePlaceholder:
      'e.g. Modern Data Fetching Patterns in Next.js App Router',
    slugLabel: 'URL Slug',
    slugPlaceholder: 'e.g. modern-data-fetching-patterns',
    slugHelper:
      'Allowed: lowercase letters, numbers, and hyphens (e.g. my-post-title).',
    descriptionLabel: 'Summary / Description',
    descriptionPlaceholder:
      'A concise summary of the article used for cards and search metadata...',
    categoryLabel: 'Category',
    categoryPlaceholder: 'Select a category',
    coverImageLabel: 'Cover Image',
    coverImagePlaceholder:
      'e.g. /blog/routing-in-nextjs.png, https://images.unsplash.com/..., or uploaded image',
    coverImageHelper:
      'Upload an image (JPEG, PNG, WebP, AVIF) or enter an HTTPS image URL / static path.',
    coverUploadDropzone: 'Drop cover image here, or click to browse',
    coverUploadHint:
      'JPEG, PNG, WebP, AVIF up to 400 KB. Automatically resized and compressed.',
    coverUploading: 'Compressing and uploading image...',
    coverRemove: 'Remove Cover',
    coverExternalUrlLabel: 'External HTTPS Image URL',
    coverExternalUrlPlaceholder: 'https://images.unsplash.com/...',
    tagsLabel: 'Tags (Comma-Separated)',
    tagsPlaceholder: 'Next.js, React, Architecture, Performance',
    tagsHelper: 'Enter keywords separated by commas.',
    youtubeUrlLabel: 'YouTube Video URL or ID (Optional)',
    youtubeUrlPlaceholder: 'e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtubeUrlHelper:
      'Paste full YouTube link or 11-character video ID, or leave blank.',
    contentLabel: 'Markdown / MDX Content',
    contentPlaceholder:
      '# Introduction\n\nWrite your technical article content here in Markdown/MDX...',
    publishedLabel: 'Publish Post Live',
    publishedHelper:
      'When turned on, this article will be publicly visible on the portfolio blog.',
    saveButton: 'Save Article',
    savingButton: 'Saving Article...',
    cancelButton: 'Cancel',
    deleteButton: 'Delete Article',
    deletingButton: 'Deleting Article...',
    deleteConfirmTitle: 'Delete Article?',
    deleteConfirmDescription:
      'Are you sure you want to delete this article? This action cannot be undone.',
  },
  errors: {
    unauthorized: 'Unauthorized: Admin access required.',
    titleRequired: 'Title must be between 3 and 120 characters.',
    descriptionRequired: 'Description must be between 10 and 300 characters.',
    slugInvalid:
      'Slug must consist only of lowercase letters, numbers, and hyphens without consecutive hyphens.',
    categoryInvalid: 'Please select a valid category from the list.',
    coverImageRequired: 'Cover image URL or path is required.',
    coverImageInvalid:
      'Cover image must be an HTTPS URL, a static /... path, or an uploaded /api/blog/cover/<uuid> path. Javascript and data URIs are rejected.',
    coverImageTooLarge:
      'Cover image exceeds the maximum allowed size of 400 KB.',
    coverImageMimeInvalid:
      'Invalid image format. Supported formats: JPEG, PNG, WebP, and AVIF.',
    tagsRequired: 'Please provide at least one tag (comma-separated).',
    contentRequired: 'Article content cannot be empty.',
    contentTooLarge:
      'Article content exceeds maximum size (500,000 characters).',
    youtubeInvalid:
      'Invalid YouTube URL or ID. Must be a valid YouTube link or 11-character ID, or leave blank.',
    generalSaveError:
      'Failed to save article. Please resolve the validation errors and try again.',
    generalDeleteError: 'Failed to delete article. Please try again.',
  },
};
