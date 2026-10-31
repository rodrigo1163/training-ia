import type { ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@training-ia/ui/components/ui/button'
import { env } from '@/env'
import { ErrorLayout } from './error-layout'

function getErrorDetails(error: ErrorComponentProps['error']) {
  if (error instanceof Error) {
    return error.stack ?? error.message
  }

  return String(error)
}

export function RootError({ error, reset }: ErrorComponentProps) {
  const errorDetails = getErrorDetails(error)

  return (
    <ErrorLayout>
      <div role="alert" className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          500 - Server Error
        </h1>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          The server encountered an error. Please try again later or contact
          support if the issue persists.
        </p>
        <Button className="mt-8" onClick={reset} type="button">
          Try again
        </Button>

        {env.NODE_ENV === 'development' ? (
          <pre className="mx-auto mt-6 max-h-48 max-w-xl overflow-auto rounded-md border border-border bg-muted p-4 text-left text-xs leading-5 text-muted-foreground">
            {errorDetails}
          </pre>
        ) : null}
      </div>
    </ErrorLayout>
  )
}
