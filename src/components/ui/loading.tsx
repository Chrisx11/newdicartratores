import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = "md", text, fullScreen = false, ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };

    const content = (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-3",
          fullScreen && "min-h-screen",
          className
        )}
        {...props}
      >
        <Loader2
          className={cn(
            "animate-spin text-primary",
            sizeClasses[size]
          )}
        />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    );

    return content;
  }
);
Loading.displayName = "Loading";

export { Loading };
