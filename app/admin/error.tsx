"use client";

import { Button } from "@vodkadav/ui";
import { adminCopy } from "@/lib/admin/copy";

/** Error state for /admin screens (e.g. the bucket could not be read). */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="alert" className="text-foreground font-medium">
        {adminCopy.loadError}
      </p>
      <Button variant="primary" onClick={reset}>
        {adminCopy.retry}
      </Button>
    </div>
  );
}
