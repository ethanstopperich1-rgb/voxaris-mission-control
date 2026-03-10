export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      {/* Subtle radial glow behind card */}
      <div className="login-bg-glow" aria-hidden="true" />

      {/* Faint grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(rgba(228,228,231,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(228,228,231,0.3) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
