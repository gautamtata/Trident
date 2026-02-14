'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { sendDigestNow } from '@/app/actions/send-digest';

export function SendDigestButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const toastId = toast.loading('Searching, summarizing, and sending digest...');

    try {
      const result = await sendDigestNow();
      if (result.success) {
        toast.success(result.message, { id: toastId });
      } else {
        toast.error(result.message, { id: toastId });
      }
    } catch (err) {
      toast.error(`Unexpected error: ${err}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? 'Sending digest...' : 'Send Test Digest Now'}
    </Button>
  );
}
