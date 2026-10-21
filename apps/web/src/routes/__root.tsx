import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { Toaster } from "@training-ia/ui/components/ui/toast";

import { ThemeProvider } from "@/components/theme-provider";
import "../global.css";

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
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="pt-BR">
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
