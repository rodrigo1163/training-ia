import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRoundIcon, SaveIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { PasswordInput } from "@/components/password-input";
import { ButtonSpinner } from "@/components/button-spinner";
import { authClient } from "@/lib/auth-client";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { toast } from "@training-ia/ui/components/ui/toast";

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Enter your current password." }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(1, { error: "Repeat your new password." }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const Route = createFileRoute("/(private)/account/security")({
  head: () => ({ meta: [{ title: "Security | Training IA" }] }),
  component: SecurityPage,
});

function SecurityPage() {
  const form = useForm<ChangePasswordValues>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    resolver: zodResolver(changePasswordSchema),
  });
  const {
    formState: { isDirty },
  } = form;

  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: ChangePasswordValues) => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (result.error) {
        throw new Error(result.error.message ?? "Unable to change password.");
      }
    },
    onSuccess: () => {
      form.reset();
      toast.add({ title: "Password updated.", type: "success" });
    },
    onError: (error) => {
      toast.add({ title: error.message, type: "error" });
    },
  });

  function onSubmit(values: ChangePasswordValues) {
    changePasswordMutation.mutate(values);
  }

  return (
    <main className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep your account secure by updating your password regularly.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <KeyRoundIcon className="size-4 text-muted-foreground" />
            Change password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a strong password that you do not use elsewhere.
          </p>
        </div>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-5">
            <Controller
              control={form.control}
              name="currentPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                    id={field.name}
                    placeholder="Enter your current password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="newPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id={field.name}
                    placeholder="At least 8 characters"
                  />
                  <FieldDescription>
                    Your password must be at least 8 characters long.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Repeat new password
                  </FieldLabel>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    id={field.name}
                    placeholder="Repeat your new password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex justify-end">
              <Button
                disabled={changePasswordMutation.isPending || !isDirty}
                type="submit"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    Saving...
                    <ButtonSpinner />
                  </>
                ) : (
                  <>
                    <SaveIcon />
                    Update password
                  </>
                )}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </section>
    </main>
  );
}
