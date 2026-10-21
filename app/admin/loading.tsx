import { adminCopy } from "@/lib/admin/copy";

/** Loading state for every /admin screen while the bucket is read. */
export default function AdminLoading() {
  return (
    <div role="status" className="text-muted flex h-dvh items-center justify-center text-sm">
      {adminCopy.loading}
    </div>
  );
}
