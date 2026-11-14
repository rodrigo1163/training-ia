import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon } from "lucide-react";
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
import { useUpdateOrganizationNameMutation } from "../-hooks/use-organization-settings";

const organizationNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Enter at least 2 characters." })
    .max(80, { error: "Use at most 80 characters." }),
});

type OrganizationNameValues = z.infer<typeof organizationNameSchema>;

type OrganizationNameSectionProps = {
  name: string;
  organizationId: string;
};

export function OrganizationNameSection({
  name,
  organizationId,
}: OrganizationNameSectionProps) {
  const form = useForm<OrganizationNameValues>({
    defaultValues: { name },
    resolver: zodResolver(organizationNameSchema),
  });
  const updateOrganizationNameMutation = useUpdateOrganizationNameMutation();

  useEffect(() => {
    form.reset({ name });
  }, [form, name]);

  function onSubmit(values: OrganizationNameValues) {
    updateOrganizationNameMutation.mutate(
      { name: values.name.trim(), organizationId },
      {
        onSuccess: () => {
          toast.add({ title: "Organization name updated.", type: "success" });
        },
        onError: (error) => {
          toast.add({ title: error.message, type: "error" });
        },
      },
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          Organization name
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
              <FieldLabel htmlFor={field.name}>Organization name</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="organization"
                id={field.name}
                maxLength={80}
                placeholder="Your organization"
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
            disabled={updateOrganizationNameMutation.isPending}
            type="submit"
          >
            {updateOrganizationNameMutation.isPending ? (
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
