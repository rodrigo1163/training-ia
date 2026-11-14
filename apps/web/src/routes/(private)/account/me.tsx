import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ImagePlusIcon, PaletteIcon, SaveIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ButtonSpinner } from "@/components/button-spinner";
import { UserAvatar } from "@/components/user-avatar";
import { useTheme, type Theme } from "@/components/theme-provider";
import {
  useUpdateDisplayNameMutation,
  useUploadAccountAvatarMutation,
} from "./-hooks/use-account-settings";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@training-ia/ui/components/ui/select";
import { Button } from "@training-ia/ui/components/ui/button";
import { toast } from "@training-ia/ui/components/ui/toast";

const privateRouteApi = getRouteApi("/(private)");

const displayNameSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter at least 2 characters." }),
});

type DisplayNameValues = z.infer<typeof displayNameSchema>;

export const Route = createFileRoute("/(private)/account/me")({
  head: () => ({ meta: [{ title: "Preferences | Training IA" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = privateRouteApi.useRouteContext();
  const { theme, setTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(user.image ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<DisplayNameValues>({
    defaultValues: { name: user.name },
    resolver: zodResolver(displayNameSchema),
  });
  const updateDisplayNameMutation = useUpdateDisplayNameMutation();
  const uploadAvatarMutation = useUploadAccountAvatarMutation();

  useEffect(() => {
    form.reset({ name: user.name });
    setAvatarUrl(user.image ?? null);
  }, [form, user.image, user.name]);

  function onSubmit(values: DisplayNameValues) {
    updateDisplayNameMutation.mutate(values.name.trim(), {
      onSuccess: () => {
        toast.add({ title: "Name updated.", type: "success" });
      },
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
    });
  }

  function onAvatarSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    uploadAvatarMutation.mutate(file, {
      onSuccess: (result) => {
        setAvatarUrl(result.imageUrl);
        toast.add({ title: "Avatar updated.", type: "success" });
      },
      onError: (error) => {
        toast.add({ title: error.message, type: "error" });
      },
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and application appearance.
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
          <div className="mb-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ImagePlusIcon className="size-4 text-muted-foreground" />
              Profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your avatar and display name.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <UserAvatar
                className="size-20 text-xl"
                image={avatarUrl}
                name={user.name}
              />
              <div>
                <p className="text-sm font-medium">Profile avatar</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG or WebP up to 2 MB.
                </p>
              </div>
            </div>
            <div className="sm:ml-auto">
              <input
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={onAvatarSelected}
                type="file"
              />
              <Button
                disabled={uploadAvatarMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
                type="button"
                variant="outline"
              >
                {uploadAvatarMutation.isPending ? (
                  <>
                    Uploading...
                    <ButtonSpinner />
                  </>
                ) : (
                  "Change avatar"
                )}
              </Button>
            </div>
          </div>

          <form
            className="mt-8 border-t border-border pt-6"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                    id={field.name}
                    placeholder="Your name"
                  />
                  <FieldDescription>
                    This name is shown throughout the application.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="mt-4 flex justify-end">
              <Button
                disabled={updateDisplayNameMutation.isPending}
                type="submit"
              >
                {updateDisplayNameMutation.isPending ? (
                  <>
                    Saving...
                    <ButtonSpinner />
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Save name
                  </>
                )}
              </Button>
            </div>
          </form>
        </section>

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
                if (
                  value === "dark" ||
                  value === "light" ||
                  value === "system"
                ) {
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
      </div>
    </main>
  );
}
