import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

// Placeholder rows shown while a table loads.
export function TableLoadingRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, row) => (
    <TableRow key={row}>
      {Array.from({ length: columns }, (_, col) => (
        <TableCell key={col}>
          <Skeleton className="h-4 w-full max-w-32" />
        </TableCell>
      ))}
    </TableRow>
  ));
}

export function TableMessageRow({
  columns,
  children,
}: {
  columns: number;
  children: ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={columns} className="h-40 text-center">
        {children}
      </TableCell>
    </TableRow>
  );
}

export function TableEmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <TableMessageRow columns={columns}>
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Inbox className="size-6" />
        <p className="text-sm">{message}</p>
      </div>
    </TableMessageRow>
  );
}

export function TableErrorRow({
  columns,
  message,
  onRetry,
}: {
  columns: number;
  message: string;
  onRetry: () => void;
}) {
  return (
    <TableMessageRow columns={columns}>
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-destructive">{message}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </TableMessageRow>
  );
}
