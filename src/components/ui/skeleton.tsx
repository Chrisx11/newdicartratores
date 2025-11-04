import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 relative overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// Componente para skeleton de linha de tabela
function TableRowSkeleton({ colCount = 6 }: { colCount?: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border/50">
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <td key={colIdx} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export { Skeleton, TableRowSkeleton };
