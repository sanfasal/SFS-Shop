"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onView && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="View details"
          title="View details"
          onClick={onView}
          className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          <Eye />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit"
        title="Edit"
        onClick={onEdit}
        className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete"
        title="Delete"
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
