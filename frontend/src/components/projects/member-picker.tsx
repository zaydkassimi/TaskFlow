"use client";

import { useApi } from "@/lib/hooks/use-api";
import { usersApi } from "@/lib/api/users";
import { fullName } from "@/lib/format";
import { Avatar } from "@/components/ui/avatar";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";

interface MemberPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  excludeIds?: number[];
}

export function MemberPicker({
  selectedIds,
  onChange,
  excludeIds = [],
}: MemberPickerProps) {
  const { data, error, loading, reload } = useApi(usersApi.directory);

  function handleToggle(id: number, current: boolean) {
    if (current) {
      onChange(selectedIds.filter((selected) => selected !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border p-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={reload} />;
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No users available.</p>;
  }

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border border-border p-2">
      {data.map((member) => {
        const excluded = excludeIds.includes(member.id);
        const selected = selectedIds.includes(member.id);
        return (
          <label
            key={member.id}
            className={
              "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors " +
              (excluded
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-muted")
            }
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={selected}
              disabled={excluded}
              onChange={() => handleToggle(member.id, selected)}
            />
            <Avatar user={member} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">
                {fullName(member)}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {member.email}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
}