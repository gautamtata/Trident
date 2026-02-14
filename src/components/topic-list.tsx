'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toggleTopic, deleteTopic } from '@/app/actions/topics';

interface Topic {
  id: string;
  name: string;
  type: 'vertical' | 'company' | 'keyword';
  searchQuery: string;
  isActive: boolean;
  createdAt: Date;
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
        <Card key={topic.id} className={topic.isActive ? '' : 'opacity-50'}>
          <CardContent className="flex items-center justify-between py-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{topic.name}</span>
                <Badge variant={topic.isActive ? 'default' : 'secondary'}>
                  {topic.type}
                </Badge>
                {!topic.isActive && (
                  <Badge variant="outline">Paused</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Query: &ldquo;{topic.searchQuery}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTopic(topic.id, !topic.isActive)}
              >
                {topic.isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteTopic(topic.id)}
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
