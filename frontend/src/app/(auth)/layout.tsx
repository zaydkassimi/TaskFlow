export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            T
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            TaskFlow
          </span>
        </div>
        {children}
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Plan projects. Ship tasks. Stay in flow.
        </p>
      </div>
    </div>
  );
}