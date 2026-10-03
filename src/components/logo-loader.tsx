import { cn } from "cn";
import { Logo } from "@/components/logo";

type LogoLoaderProps = {
  label?: string;
  className?: string;
};

/** Brand loading indicator: the S logo with a spinning ring around it. */
function LogoLoader({ label, className }: LogoLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="relative flex size-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-primary border-r-primary/60 [animation-duration:900ms]" />
        <Logo size="lg" className="animate-pulse" />
      </div>
      {label && (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  );
}

export { LogoLoader };
