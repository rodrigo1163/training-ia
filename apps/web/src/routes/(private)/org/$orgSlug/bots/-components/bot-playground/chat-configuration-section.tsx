import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";

import { ButtonSpinner } from "@/components/button-spinner";
import { Button } from "@training-ia/ui/components/ui/button";
import { Input } from "@training-ia/ui/components/ui/input";
import { Textarea } from "@training-ia/ui/components/ui/textarea";
import { Checkbox } from "@training-ia/ui/components/ui/checkbox";

import {
  CHAT_CONFIG_TEXT_LIMITS,
  type ChatConfigurationFormValues,
} from "./form-utils";

export function ChatConfigurationSection({
  form,
  isSaving,
  isDisabled,
  onSubmit,
}: {
  form: UseFormReturn<ChatConfigurationFormValues>;
  isSaving: boolean;
  isDisabled: boolean;
  onSubmit: (values: ChatConfigurationFormValues) => void;
}) {
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <section className="mt-6 rounded-lg border bg-card p-6">
        <div>
          <h3 className="font-medium">Chat configuration</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Changes are saved when you click Save changes.
          </p>
        </div>

        <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="assistant-name"
          >
            Assistant name
            <Input
              {...form.register("assistantName")}
              disabled={isDisabled}
              id="assistant-name"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.assistantName}
              placeholder="Virtual Assistant"
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="header-status"
          >
            Header status
            <Input
              {...form.register("headerStatusText")}
              disabled={isDisabled}
              id="header-status"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.headerStatusText}
              placeholder="We are online"
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="input-placeholder"
          >
            Input placeholder
            <Input
              {...form.register("inputPlaceholder")}
              disabled={isDisabled}
              id="input-placeholder"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.inputPlaceholder}
              placeholder="Type your message..."
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium"
            htmlFor="submit-text"
          >
            Submit button text
            <Input
              {...form.register("submitButtonText")}
              disabled={isDisabled}
              id="submit-text"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.submitButtonText}
              placeholder="Send"
            />
          </label>
          <label
            className="space-y-2 text-sm font-medium md:col-span-2"
            htmlFor="initial-message"
          >
            Initial message
            <Textarea
              {...form.register("initialMessage")}
              disabled={isDisabled}
              id="initial-message"
              maxLength={CHAT_CONFIG_TEXT_LIMITS.initialMessage}
              placeholder="Hello! 👋 How can I help you today?"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Controller
            control={form.control}
            name="showMessageTimestamps"
            render={({ field }) => (
              <label
                className="flex items-center gap-2 text-sm"
                htmlFor="show-timestamps"
              >
                <Checkbox
                  checked={field.value}
                  disabled={isDisabled}
                  id="show-timestamps"
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Show message timestamps
              </label>
            )}
          />
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            disabled={
              isDisabled || !form.formState.isDirty || !form.formState.isValid
            }
            type="submit"
          >
            {isSaving ? "Saving..." : "Save changes"}
            {isSaving && <ButtonSpinner />}
          </Button>
        </div>
      </section>
    </form>
  );
}
