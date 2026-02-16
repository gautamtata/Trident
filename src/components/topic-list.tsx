'use client';

import { useState } from 'react';
import { Loader2, MoreVertical, Pencil, Pause, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { toggleTopic, deleteTopic, updateTopic } from '@/app/actions/topics';

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
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [editName, setEditName] = useState(topic.name);
  const [editType, setEditType] = useState(topic.type);
  const [editQuery, setEditQuery] = useState(topic.searchQuery);

  const isLoading = loadingToggle || loadingDelete || loadingEdit;

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      await toggleTopic(topic.id, !topic.isActive);
      toast.success(topic.isActive ? 'Topic paused' : 'Topic resumed');
    } catch {
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
    } catch {
      toast.error('Failed to delete topic');
    } finally {
      setLoadingDelete(false);
      setShowDeleteDialog(false);
    }
  }

  async function handleEdit() {
    setLoadingEdit(true);
    try {
      const result = await updateTopic(topic.id, {
        name: editName,
        type: editType,
        searchQuery: editQuery,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Topic updated');
      setShowEditDialog(false);
    } catch {
      toast.error('Failed to update topic');
    } finally {
      setLoadingEdit(false);
    }
  }

  function openEditDialog() {
    setEditName(topic.name);
    setEditType(topic.type);
    setEditQuery(topic.searchQuery);
    setShowEditDialog(true);
  }

  return (
    <>
      <Card className={topic.isActive ? '' : 'opacity-50'}>
        <CardContent className="flex items-center justify-between py-3 md:py-4 gap-3">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openEditDialog} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowPauseDialog(true)}
                className="cursor-pointer"
              >
                {topic.isActive ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Edit topic</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${topic.id}`} className="text-sm">Name</Label>
              <Input
                id={`edit-name-${topic.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Type</Label>
              <Select value={editType} onValueChange={(v) => setEditType(v as Topic['type'])}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical / Industry</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="keyword">Keyword</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-query-${topic.id}`} className="text-sm">Search Query</Label>
              <Input
                id={`edit-query-${topic.id}`}
                value={editQuery}
                onChange={(e) => setEditQuery(e.target.value)}
                className="min-h-[44px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the query sent to Exa for web search. Be specific for better results.
              </p>
            </div>

            <Button type="submit" className="w-full min-h-[44px]" disabled={loadingEdit}>
              {loadingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pause/Resume Dialog */}
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

      {/* Delete Dialog */}
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
