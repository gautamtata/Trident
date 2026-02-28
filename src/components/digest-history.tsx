import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Digest {
  id: string;
  sentAt: Date;
  recipientEmail: string;
  articleCount: number;
  status: 'sent' | 'failed';
  error: string | null;
}

export function DigestHistory({ digests }: { digests: Digest[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Digests</CardTitle>
      </CardHeader>
      <CardContent>
        {digests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No digests sent yet. They will appear here after the first scheduled run.
          </p>
        ) : (
          <>
            {/* Mobile card layout */}
            <div className="md:hidden space-y-3">
              {digests.map((digest) => (
                <div
                  key={digest.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {new Date(digest.sentAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <Badge
                      variant={digest.status === 'sent' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {digest.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(digest.sentAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground break-all">
                    {digest.recipientEmail}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {digest.articleCount} articles
                  </div>
                  {digest.error && (
                    <div className="text-xs text-red-600 bg-red-50 rounded p-2 break-all">
                      {digest.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead className="text-center">Articles</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {digests.map((digest) => (
                    <TableRow key={digest.id}>
                      <TableCell className="text-sm">
                        {new Date(digest.sentAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">{digest.recipientEmail}</TableCell>
                      <TableCell className="text-center text-sm">
                        {digest.articleCount}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={digest.status === 'sent' ? 'default' : 'destructive'}
                        >
                          {digest.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-red-600 max-w-[200px] truncate">
                        {digest.error ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
