'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { createTopic } from '@/app/actions/topics';

export function TopicForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('keyword');

  async function handleSubmit(formData: FormData) {
    formData.set('type', type);
    const result = await createTopic(formData);
    if (result?.success) {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Topic</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new topic to track</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Robotics Industry"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
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
            <Label htmlFor="searchQuery">Search Query</Label>
            <Input
              id="searchQuery"
              name="searchQuery"
              placeholder="e.g., latest robotics industry news and developments"
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the query sent to Exa for web search. Be specific for better results.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Create Topic
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
