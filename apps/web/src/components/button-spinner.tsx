import { LoaderCircleIcon } from "lucide-react";

export function ButtonSpinner() {
  return (
    <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
  );
}
