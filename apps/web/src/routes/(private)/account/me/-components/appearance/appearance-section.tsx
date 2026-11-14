import { PaletteIcon } from "lucide-react";

import { useTheme, type Theme } from "@/components/theme-provider";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <PaletteIcon className="size-4 text-muted-foreground" />
          Appearance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Training IA should look on this device.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="theme-mode">Theme mode</FieldLabel>
        <Select
          value={theme}
          onValueChange={(value) => {
            if (value === "dark" || value === "light" || value === "system") {
              setTheme(value as Theme);
            }
          }}
        >
          <SelectTrigger className="max-w-sm" id="theme-mode">
            <SelectValue placeholder="Select a theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
        <FieldDescription>
          System follows your device preference automatically.
        </FieldDescription>
      </Field>
    </section>
  );
}
