import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

import { Toaster } from "@training-ia/ui/components/ui/toast";

import { ThemeProvider } from "@/components/theme-provider";
import { authClient } from "@/lib/auth-client";
import "../global.css";
import { RootError } from "./-components/root-error";
import { SplashScreen } from "#/components/splash-screen";

export const Route = createRootRoute({
  ssr: false,
  beforeLoad: async () => {
    const { data: session, error } = await authClient.getSession();

    if (error) {
      throw new Error(error.message ?? "Unable to load your session.");
    }

    return { session };
  },
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
  pendingComponent: SplashScreen,
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
