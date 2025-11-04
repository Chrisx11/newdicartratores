import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",            
          description: "group-[.toast]:text-muted-foreground",
          actionButton: 
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-all",
          cancelButton: 
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-all",
          success: "group-[.toaster]:border-green-500/50 group-[.toaster]:bg-green-50 dark:group-[.toaster]:bg-green-950/20",
          error: "group-[.toaster]:border-red-500/50 group-[.toaster]:bg-red-50 dark:group-[.toaster]:bg-red-950/20",
          info: "group-[.toaster]:border-blue-500/50 group-[.toaster]:bg-blue-50 dark:group-[.toaster]:bg-blue-950/20",
          warning: "group-[.toaster]:border-yellow-500/50 group-[.toaster]:bg-yellow-50 dark:group-[.toaster]:bg-yellow-950/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
