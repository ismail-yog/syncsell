export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-surface),_transparent_80%)] dark:opacity-50 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
