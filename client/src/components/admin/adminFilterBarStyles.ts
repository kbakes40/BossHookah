/** Shared admin page header / filter bar layout (Sales, Orders, Customers). */

/** One structural border color for shell, panels, and internal rules (avoids 80/90 mismatch at joins). */
export const adminBorderClass = "border-zinc-800/90";

/** Standard outer corner radius for panels, table wrappers, and section cards. */
export const adminRadiusPanelClass = "rounded-xl";

/** Vertical rhythm inside `AdminShell` main (one consistent stack). */
export const adminPageStackClass = "space-y-6";

/** Standard gutter between dashboard KPI rows, chart, and twin panels. */
export const adminDashboardGridGapClass = "gap-4";

/** Panel/card surface — consistent radius, border, bg; use `overflow-hidden` on wrapper when clipping tables. */
export const adminPanelClass = `${adminRadiusPanelClass} border ${adminBorderClass} bg-[#121214] shadow-sm`;

/** Table / section title row inside a panel (full-width rule, no extra radius). */
export const adminPanelHeaderClass =
  "px-4 py-3 border-b border-zinc-800/90 shrink-0 bg-[#121214]";

export const adminFilterBarRowClass =
  "flex flex-wrap items-end gap-x-3 gap-y-3 sm:gap-x-4 justify-start lg:justify-end";

/** SelectTrigger + text inputs in filter bars */
export const adminFilterControlClass =
  "h-9 w-full min-h-9 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 placeholder:text-zinc-600";

export const adminFilterLabelClass = "text-[10px] uppercase tracking-wide text-zinc-500";

/** Typical fixed-width column for selects (matches Orders) */
export const adminFilterFieldSmClass =
  "flex flex-col gap-1 w-[calc(50%-0.375rem)] min-w-[9.5rem] sm:w-40 sm:min-w-[9.5rem] md:w-44";
