'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toggleCompany, deleteCompany } from '@/app/actions/companies';

interface Company {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  createdAt: Date;
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
        <Card key={company.id} className={company.isActive ? '' : 'opacity-50'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{company.name}</span>
                <Badge variant="secondary">Company</Badge>
                {company.domain && (
                  <Badge variant="outline">{company.domain}</Badge>
                )}
                {!company.isActive && (
                  <Badge variant="outline">Paused</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleCompany(company.id, !company.isActive)}
              >
                {company.isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteCompany(company.id)}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
