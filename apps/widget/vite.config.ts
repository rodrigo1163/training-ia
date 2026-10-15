import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ command }) => ({
  plugins: [tailwindcss(), react()],

  // Desenvolvimento: aplicação React convencional
  ...(command === "serve"
    ? {
      server: {
        port: 5174,
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
