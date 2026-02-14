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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="text-center">Articles</TableHead>
                <TableHead className="text-center">Status</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
