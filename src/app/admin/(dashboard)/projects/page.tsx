import { Plus } from 'lucide-react';
import { Link } from 'next-view-transitions';

import { DeleteProjectButton } from '@/components/admin/DeleteProjectButton';
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
import { getAllProjectsForAdmin } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  await requireAdmin();

  const projects = await getAllProjectsForAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage published, draft, and archived portfolio projects.
          </p>
        </div>

        <Button asChild size="sm">
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            <span>New project</span>
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            Dynamic project entries are merged with the repo-backed static seed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="min-w-[220px]">Title / Slug</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.slug} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="block font-medium">
                          {project.title}
                        </span>
                        <span className="text-muted-foreground block font-mono text-xs">
                          /{project.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {project.category || 'Engineering'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.status === 'published'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.featured ? (
                        <Badge className="text-xs">Featured</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/projects/${project.slug}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        <DeleteProjectButton slug={project.slug} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
