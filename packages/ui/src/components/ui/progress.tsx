import * as React from "react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "../../lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const progressValue = typeof value === "number" ? value : 0;

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value ?? null}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ width: `${progressValue}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };


