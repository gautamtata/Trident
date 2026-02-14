'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createCompany } from '@/app/actions/companies';

export function CompanyForm() {
  const [open, setOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createCompany(formData);
    if (result?.success) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Company</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Track a company</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm">Company Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Boston Dynamics"
              className="min-h-[44px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll automatically search for the latest news and updates about this company.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="text-sm">Website (optional)</Label>
            <Input
              id="domain"
              name="domain"
              placeholder="e.g. bostondynamics.com"
              className="min-h-[44px]"
            />
            <p className="text-xs text-muted-foreground">
              Adding the website helps us find updates directly from the company.
            </p>
          </div>

          <Button type="submit" className="w-full min-h-[44px]">
            Start Tracking
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
