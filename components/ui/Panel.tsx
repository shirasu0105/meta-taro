export function Panel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[2px] border border-border bg-panel ${className}`}>
      {children}
    </div>
  );
}
