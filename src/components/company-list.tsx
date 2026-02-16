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
import { toggleCompany, deleteCompany, updateCompany } from '@/app/actions/companies';

interface Company {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  createdAt: Date;
}

function CompanyCard({ company }: { company: Company }) {
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const [editName, setEditName] = useState(company.name);
  const [editDomain, setEditDomain] = useState(company.domain ?? '');

  const isLoading = loadingToggle || loadingDelete || loadingEdit;

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      await toggleCompany(company.id, !company.isActive);
      toast.success(company.isActive ? 'Company paused' : 'Company resumed');
    } catch {
      toast.error(`Failed to ${company.isActive ? 'pause' : 'resume'} company`);
    } finally {
      setLoadingToggle(false);
      setShowPauseDialog(false);
    }
  }

  async function handleDelete() {
    setLoadingDelete(true);
    try {
      await deleteCompany(company.id);
      toast.success('Company deleted');
    } catch {
      toast.error('Failed to delete company');
    } finally {
      setLoadingDelete(false);
      setShowDeleteDialog(false);
    }
  }

  async function handleEdit() {
    setLoadingEdit(true);
    try {
      const result = await updateCompany(company.id, {
        name: editName,
        domain: editDomain || null,
      });
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Company updated');
      setShowEditDialog(false);
    } catch {
      toast.error('Failed to update company');
    } finally {
      setLoadingEdit(false);
    }
  }

  function openEditDialog() {
    setEditName(company.name);
    setEditDomain(company.domain ?? '');
    setShowEditDialog(true);
  }

  return (
    <>
      <Card className={company.isActive ? '' : 'opacity-50'}>
        <CardContent className="flex items-center justify-between py-3 md:py-4 gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm md:text-base wrap-break-word">{company.name}</span>
              <Badge variant="secondary" className="text-xs">Company</Badge>
              {company.domain && (
                <Badge variant="outline" className="text-xs break-all">{company.domain}</Badge>
              )}
              {!company.isActive && (
                <Badge variant="outline" className="text-xs">Paused</Badge>
              )}
            </div>
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
                {company.isActive ? (
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
            <DialogTitle className="text-base md:text-lg">Edit company</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${company.id}`} className="text-sm">Company Name</Label>
              <Input
                id={`edit-name-${company.id}`}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-h-[44px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-domain-${company.id}`} className="text-sm">
                Website (optional)
              </Label>
              <Input
                id={`edit-domain-${company.id}`}
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="e.g. bostondynamics.com"
                className="min-h-[44px]"
              />
              <p className="text-xs text-muted-foreground">
                Adding the website helps us find updates directly from the company.
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
              {company.isActive ? 'Pause' : 'Resume'} company?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {company.isActive
                ? `"${company.name}" will stop appearing in digests until you resume it.`
                : `"${company.name}" will start appearing in digests again.`}
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
              {company.isActive ? 'Pause' : 'Resume'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{company.name}&rdquo;? This action cannot be undone.
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

export function CompanyList({ companies }: { companies: Company[] }) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No companies tracked yet. Add one to get news and updates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
