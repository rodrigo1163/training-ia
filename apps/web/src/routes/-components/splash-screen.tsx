export function SplashScreen() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando aplicação"
      className="grid min-h-svh place-items-center bg-background px-6 text-foreground"
      role="status"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-2 border-muted border-r-primary border-t-primary motion-reduce:animate-none"
        />

        <span className="text-base font-medium text-foreground">
          Carregando...
        </span>
      </div>
    </main>
  )
}
