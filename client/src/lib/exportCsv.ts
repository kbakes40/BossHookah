/** RFC 4180-style CSV cell (quote only when needed). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s =
    typeof value === "object" && value !== null && !(value instanceof Date)
      ? JSON.stringify(value)
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Download a CSV in the browser. Rows should share the same keys; header row
 * is taken from the first object’s keys in insertion order.
 */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(h => csvCell(h)).join(","),
    ...rows.map(r => headers.map(h => csvCell(r[h])).join(",")),
  ];
  const csv = `\uFEFF${lines.join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
