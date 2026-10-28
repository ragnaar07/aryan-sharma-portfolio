import { Link } from 'next-view-transitions';
import React from 'react';

import { getPublishedBlogPostsAsync } from '@/lib/blog';

import { BlogCard } from '../blog/BlogCard';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import { Button } from '../ui/button';

export default async function Blog() {
  const posts = await getPublishedBlogPostsAsync();

  return (
    <Container className="mt-20">
      <SectionHeading subHeading="Featured" heading="Blogs" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {posts.slice(0, 2).map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/blog">Show all blogs</Link>
        </Button>
      </div>
    </Container>
  );
}
