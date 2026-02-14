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
import { toggleCompany, deleteCompany } from '@/app/actions/companies';

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);

  async function handleToggle() {
    setLoadingToggle(true);
    try {
      await toggleCompany(company.id, !company.isActive);
      toast.success(company.isActive ? 'Company paused' : 'Company resumed');
    } catch (err) {
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
    } catch (err) {
      toast.error('Failed to delete company');
    } finally {
      setLoadingDelete(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <>
      <Card className={company.isActive ? '' : 'opacity-50'}>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between py-3 md:py-4 gap-3">
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
                company.isActive ? 'Pause' : 'Resume'
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
