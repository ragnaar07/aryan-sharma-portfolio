'use client';

import { Loader2, Trash2 } from 'lucide-react';
import React, { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deletePostAction } from '@/app/admin/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { adminBlogLabels } from '@/config/BlogAdmin';

interface DeletePostButtonProps {
  slug: string;
  postTitle: string;
}

export function DeletePostButton({ slug, postTitle }: DeletePostButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deletePostAction(slug);
      if (!result.success) {
        const errorText =
          result.error || adminBlogLabels.errors.generalDeleteError;
        setErrorMessage(errorText);
        toast.error(errorText);
        return;
      }

      toast.success('Post deleted successfully');
      setOpen(false);
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setErrorMessage(null);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 p-0"
          title="Delete Post"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {adminBlogLabels.form.deleteConfirmTitle}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{postTitle}&rdquo;? This will
            remove the article from Upstash Redis and cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {errorMessage ? 'Close' : adminBlogLabels.form.cancelButton}
          </AlertDialogCancel>
          {!errorMessage && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <span>Delete</span>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
