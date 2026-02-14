'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toggleTopic, deleteTopic } from '@/app/actions/topics';

interface Topic {
  id: string;
  name: string;
  type: 'vertical' | 'company' | 'keyword';
  searchQuery: string;
  isActive: boolean;
  createdAt: Date;
}

function TopicCard({ topic }: { topic: Topic }) {
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      await toggleTopic(topic.id, !topic.isActive);
      toast.success(topic.isActive ? 'Topic paused' : 'Topic resumed');
    } catch (err) {
      console.error('Failed to toggle topic:', err);
      toast.error(`Failed to ${topic.isActive ? 'pause' : 'resume'} topic`);
    } finally {
      setLoadingToggle(false);
      setShowPauseDialog(false);
    }
  }

  async function handleDelete() {
    setLoadingDelete(true);
    try {
      await deleteTopic(topic.id);
      toast.success('Topic deleted');
    } catch (err) {
      console.error('Failed to delete topic:', err);
      toast.error('Failed to delete topic');
    } finally {
      setLoadingDelete(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <Card className={topic.isActive ? '' : 'opacity-50'}>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between py-3 md:py-4 gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm md:text-base wrap-break-word">{topic.name}</span>
              <Badge variant={topic.isActive ? 'default' : 'secondary'} className="text-xs">
                {topic.type}
              </Badge>
              {!topic.isActive && (
                <Badge variant="outline" className="text-xs">Paused</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground wrap-break-word">
              Query: &ldquo;{topic.searchQuery}&rdquo;
            </p>
          </div>
          <div className="flex items-center gap-2 sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 cursor-pointer"
              onClick={() => setShowPauseDialog(true)}
              disabled={loadingToggle || loadingDelete}
            >
              {loadingToggle ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                topic.isActive ? 'Pause' : 'Resume'
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0 cursor-pointer"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loadingToggle || loadingDelete}
            >
              {loadingDelete ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {topic.isActive ? 'Pause' : 'Resume'} topic?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {topic.isActive
                ? `"${topic.name}" will stop appearing in digests until you resume it.`
                : `"${topic.name}" will start appearing in digests again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingToggle}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              disabled={loadingToggle}
              className="cursor-pointer"
            >
              {loadingToggle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {topic.isActive ? 'Pause' : 'Resume'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{topic.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loadingDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {loadingDelete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function TopicList({ topics }: { topics: Topic[] }) {
  if (topics.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No topics yet. Add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <TopicCard key={topic.id} topic={topic} />
      ))}
    </div>
  );
}
