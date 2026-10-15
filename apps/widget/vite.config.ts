import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // Desenvolvimento: aplicação React convencional
  ...(command === "serve"
    ? {
      server: {
        port: 5173,
      },
    }
    : {
      // Produção: JavaScript incorporável
      build: {
        lib: {
          entry: resolve(import.meta.dirname, "src/embed.tsx"),
          name: "ChatWidget",
          formats: ["iife" as const],
          fileName: () => "embed.js",
        },
      },
    }),
}));