'use client';

import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';

import { deleteProjectAction } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

export function DeleteProjectButton({ slug }: { slug: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deleteProjectAction(slug);
        });
      }}
      className="flex items-center gap-2"
    >
      <Trash2 className="size-4" />
      {isPending ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
