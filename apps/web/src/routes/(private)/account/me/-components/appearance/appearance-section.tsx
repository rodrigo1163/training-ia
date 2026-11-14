import { PaletteIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type Theme } from "@/components/theme-provider";
import { Field, FieldDescription } from "@training-ia/ui/components/ui/field";

const themeOptions: Array<{ value: Theme; label: string }> = [
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

function ThemePreview({ theme }: { theme: Theme }) {
  const isDark = theme === "dark";
  const isLight = theme === "light";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate aspect-[1.85] w-full overflow-hidden rounded-md border",
        isDark
          ? "border-[#353535] bg-[#111111]"
          : isLight
            ? "border-[#d9dddf] bg-[#f7f8f9]"
            : "border-[#4a4c4d] bg-[#202121]",
      )}
    >
      {theme === "system" && (
        <div className="absolute inset-0 -z-10 bg-[#f7f8f9] [clip-path:polygon(80%_0,100%_0,100%_100%,20%_100%)]" />
      )}

      <div
        className={cn(
          "absolute inset-y-0 left-0 w-3 border-r",
          isLight
            ? "border-[#e1e3e4] bg-[#f2f3f4]"
            : "border-[#2b2c2c] bg-[#181919]",
        )}
      >
        <div className="absolute left-1 top-1.5 flex flex-col gap-1">
          <span className="size-1 rounded-full bg-[#929596]" />
          <span className="size-1 rounded-full bg-[#929596]" />
          <span className="size-1 rounded-full bg-[#929596]" />
        </div>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 top-0 h-4 border-b",
          isLight
            ? "border-[#e4e6e7] bg-[#fbfbfb]"
            : "border-[#292a2a] bg-[#171818]",
        )}
      >
        <div className="absolute left-5 top-1 flex items-center gap-1">
          <span className="h-1 w-6 rounded-full bg-[#32c895]" />
          <span
            className={cn(
              "h-1 w-5 rounded-full",
              isLight ? "bg-[#a9acad]" : "bg-[#555657]",
            )}
          />
          <span
            className={cn(
              "h-1 w-5 rounded-full",
              isLight ? "bg-[#a9acad]" : "bg-[#555657]",
            )}
          />
        </div>
      </div>

      <div className="absolute left-[25%] right-[18%] top-[23%] flex flex-col gap-2">
        <div
          className={cn(
            "flex h-6 items-center justify-between rounded border px-2",
            isDark
              ? "border-[#2c2d2d] bg-[#1b1c1c]"
              : "border-[#dfe2e3] bg-[#fbfbfb]",
          )}
        >
          <span
            className={cn(
              "h-0.5 w-9 rounded-full",
              isDark ? "bg-[#a5a7a8]" : "bg-[#666a6b]",
            )}
          />
          <span className="h-0.5 w-5 rounded-full bg-[#f3a813]" />
        </div>
        <div
          className={cn(
            "flex h-6 items-center gap-3 rounded border px-2",
            isDark
              ? "border-[#2c2d2d] bg-[#1b1c1c]"
              : "border-[#dfe2e3] bg-[#fbfbfb]",
          )}
        >
          <span
            className={cn(
              "h-0.5 w-7 rounded-full",
              isDark ? "bg-[#a5a7a8]" : "bg-[#666a6b]",
            )}
          />
          <span
            className={cn(
              "h-0.5 w-9 rounded-full",
              isDark ? "bg-[#eceeef]" : "bg-[#1e2425]",
            )}
          />
        </div>
      </div>
    </div>
  );
}

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

      <Field className="gap-3">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Theme mode</legend>
          <div
            aria-label="Theme mode"
            className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3"
            role="radiogroup"
          >
            {themeOptions.map((option) => {
              const isSelected = theme === option.value;

              return (
                <label className="group cursor-pointer" key={option.value}>
                  <input
                    checked={isSelected}
                    className="peer sr-only"
                    name="theme-mode"
                    onChange={() => setTheme(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span
                    className={cn(
                      "block rounded-lg border p-3 transition-colors",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                      isSelected
                        ? "border-foreground/40 bg-foreground/5"
                        : "border-border bg-card/20 hover:border-foreground/30",
                    )}
                  >
                    <ThemePreview theme={option.value} />
                    <span
                      className={cn(
                        "mt-2 flex items-center gap-2 text-sm",
                        isSelected
                          ? "font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-3 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-foreground bg-foreground"
                            : "border-muted-foreground/60",
                        )}
                      >
                        {isSelected && (
                          <span className="size-1.5 rounded-full bg-background" />
                        )}
                      </span>
                      {option.label}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <FieldDescription>
          System follows your device preference automatically.
        </FieldDescription>
      </Field>
    </section>
  );
}
