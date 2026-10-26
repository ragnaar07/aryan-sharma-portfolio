import { DeletePostButton } from '@/components/admin/DeletePostButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdmin } from '@/lib/auth-guard';
import { getAllPostsForAdmin } from '@/lib/blog';
import {
  CheckCircle2,
  Edit,
  ExternalLink,
  FileText,
  Lock,
  Plus,
} from 'lucide-react';
import { Link } from 'next-view-transitions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await requireAdmin();

  const posts = await getAllPostsForAdmin();
  const publishedCount = posts.filter((p) => p.isPublished).length;
  const draftCount = posts.length - publishedCount;

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your technical portfolio, publish articles, and edit drafts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm">
            <Link href="/admin/posts/new" className="flex items-center gap-1.5">
              <Plus className="size-4" />
              <span>New post</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Total Articles
                </p>
                <p className="mt-1 text-2xl font-bold">{posts.length}</p>
              </div>
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <FileText className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Published Live
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-500">
                  {publishedCount}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  Unpublished Drafts
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-500">
                  {draftCount}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Lock className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Posts Management Table */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              All Articles
            </CardTitle>
            <CardDescription>
              Complete catalog of published articles and stored drafts.
            </CardDescription>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="self-start sm:self-auto"
          >
            <Link href="/admin/posts/new" className="flex items-center gap-1.5">
              <Plus className="size-4" />
              <span>New post</span>
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="border-border bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <FileText className="text-muted-foreground mb-3 size-10" />
              <h3 className="text-base font-semibold">No Articles Yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                Publish your first technical article or draft a new post.
              </p>
              <Button size="sm" className="mt-4" asChild>
                <Link href="/admin/posts/new">Create Post</Link>
              </Button>
            </div>
          ) : (
            <div className="border-border overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="min-w-[240px]">
                      Title & Slug
                    </TableHead>
                    <TableHead className="min-w-[140px]">Category</TableHead>
                    <TableHead className="min-w-[110px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[140px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => {
                    const formattedDate = new Date(
                      post.date,
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <TableRow key={post.slug} className="hover:bg-muted/30">
                        {/* Title & Slug */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="text-foreground line-clamp-1 block font-medium">
                              {post.title}
                            </span>
                            <span className="text-muted-foreground block font-mono text-xs">
                              /{post.slug}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs font-normal"
                          >
                            {post.category || 'Engineering'}
                          </Badge>
                        </TableCell>

                        {/* Status Badge */}
                        <TableCell>
                          <Badge
                            variant={post.isPublished ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {post.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {formattedDate}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {post.isPublished && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="size-8 p-0"
                                title="View published article"
                              >
                                <Link
                                  href={`/blog/${post.slug}`}
                                  target="_blank"
                                >
                                  <ExternalLink className="size-4" />
                                </Link>
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8 gap-1 px-2.5 text-xs"
                            >
                              <Link href={`/admin/posts/${post.slug}/edit`}>
                                <Edit className="size-3.5" />
                                <span>Edit</span>
                              </Link>
                            </Button>

                            <DeletePostButton
                              slug={post.slug}
                              postTitle={post.title}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
