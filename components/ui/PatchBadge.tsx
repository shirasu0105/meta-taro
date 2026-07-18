export function PatchBadge({ patch }: { patch: string }) {
  return (
    <span className="whitespace-nowrap rounded-[2px] border border-border px-2 py-1 font-mono text-[10px] text-text-muted">
      Patch {patch} · JP
    </span>
  );
}
