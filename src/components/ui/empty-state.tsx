import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {title && (
          <h3 className="h5 text-foreground mb-2 text-balance">{title}</h3>
        )}
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed text-pretty">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="default" size="sm">
            {action.label}
          </Button>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
