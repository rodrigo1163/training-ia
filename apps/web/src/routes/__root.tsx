import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { Toaster } from "@training-ia/ui/components/ui/toast";

import { ThemeProvider } from "@/components/theme-provider";
import "../global.css";
import { RootError } from "./-components/root-error";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Training IA",
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootError,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          {children}

          <Toaster />
        </ThemeProvider>

        <Scripts />
      </body>
    </html>
  );
}
