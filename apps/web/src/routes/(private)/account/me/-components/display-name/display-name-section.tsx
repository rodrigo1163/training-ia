import { zodResolver } from "@hookform/resolvers/zod";
import { CircleUserRoundIcon, SaveIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@training-ia/ui/components/ui/field";
import { Input } from "@training-ia/ui/components/ui/input";
import { toast } from "@training-ia/ui/components/ui/toast";
import { useUpdateDisplayNameMutation } from "../../-hooks/use-account-settings";

const displayNameSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter at least 2 characters." }),
});

type DisplayNameValues = z.infer<typeof displayNameSchema>;

type DisplayNameSectionProps = {
  name: string;
};

export function DisplayNameSection({ name }: DisplayNameSectionProps) {
  const form = useForm<DisplayNameValues>({
    defaultValues: { name },
    resolver: zodResolver(displayNameSchema),
  });
  const updateDisplayNameMutation = useUpdateDisplayNameMutation();

  useEffect(() => {
    form.reset({ name });
  }, [form, name]);

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

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <CircleUserRoundIcon className="size-4 text-muted-foreground" />
          Display name
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the name shown throughout the application.
        </p>
      </div>

      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
  );
}
