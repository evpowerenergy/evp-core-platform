export const healthClass = (state?: number | null) => ({
  1: "bg-slate-500/15 text-slate-300",
  2: "bg-red-500/15 text-red-300",
  3: "bg-emerald-500/15 text-emerald-300",
}[state ?? 0] ?? "bg-amber-500/15 text-amber-300");

export const severityClass = (severity?: number | null) => ({
  1: "bg-red-500/15 text-red-300",
  2: "bg-orange-500/15 text-orange-300",
  3: "bg-yellow-500/15 text-yellow-300",
  4: "bg-blue-500/15 text-blue-300",
}[severity ?? 0] ?? "bg-slate-500/15 text-slate-300");
