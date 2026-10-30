import { useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, BrainCircuitIcon } from "lucide-react";

import { Button } from "@/components/animate-ui/components/buttons/button";

export function OrganizationsEmpty() {
  const navigate = useNavigate();

  return (
    <main className="grid min-h-svh place-items-center bg-muted px-4 py-10 text-foreground">
      <div className="w-full max-w-[27rem]">
        <div className="mb-7 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <BrainCircuitIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-semibold">Training IA</span>
        </div>

        <section className="rounded-md border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
          <header>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Organization
            </p>
            <h1 className="text-2xl font-semibold tracking-normal">
              No organizations yet
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create your first organization to access the dashboard.
            </p>
          </header>

          <Button
            className="mt-7 h-11 w-full"
            hoverScale={1.01}
            onClick={() => navigate({ to: "/create-organization" })}
            tapScale={0.99}
            type="button"
          >
            <ArrowRightIcon />
            Create organization
          </Button>
        </section>
      </div>
    </main>
  );
}
