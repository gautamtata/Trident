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
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
                onClick={() => toggleCompany(company.id, !company.isActive)}
              >
                {company.isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-0"
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
