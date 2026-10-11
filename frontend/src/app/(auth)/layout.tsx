import { BrandMark } from "@/components/layout/sidebar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_110%_at_50%_0%,rgb(94_106_210/0.14),transparent_72%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="h-11 w-11 rounded-xl text-lg" />
          <div>
            <p className="text-xl font-semibold tracking-tight text-foreground">
              TaskFlow
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Plan projects. Ship tasks. Stay in flow.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}