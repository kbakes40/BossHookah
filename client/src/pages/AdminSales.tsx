import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Info } from "lucide-react";

type Preset = "today" | "7" | "30" | "month" | "custom";

function localYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addCalendarDays(ymd: string, delta: number): string {
  const [y, mo, dd] = ymd.split("-").map(Number);
  const d = new Date(y, mo - 1, dd);
  d.setDate(d.getDate() + delta);
  return localYmd(d);
}

function firstOfMonthYmd(ref: Date) {
  return `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}-01`;
}

function fmtMoney(n: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function pct(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  const body = rows.map(r => r.map(c => esc(c)).join(",")).join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

type SortKey = "profit" | "revenue" | "units" | "margin" | "cost";
type SortDir = "asc" | "desc";

export default function AdminSales() {
  const [preset, setPreset] = useState<Preset>("30");
  const [customFrom, setCustomFrom] = useState(() => localYmd(new Date()));
  const [customTo, setCustomTo] = useState(() => localYmd(new Date()));
  const [deliveryMethod, setDeliveryMethod] = useState<"all" | "shipping" | "pickup">("all");
  const [sortKey, setSortKey] = useState<SortKey>("profit");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { dateFrom, dateTo, datesWereSwapped } = useMemo(() => {
    const today = localYmd(new Date());
    let from: string;
    let to: string;
    if (preset === "custom") {
      from = customFrom;
      to = customTo;
    } else if (preset === "today") {
      from = today;
      to = today;
    } else if (preset === "7") {
      from = addCalendarDays(today, -6);
      to = today;
    } else if (preset === "30") {
      from = addCalendarDays(today, -29);
      to = today;
    } else {
      from = firstOfMonthYmd(new Date());
      to = today;
    }
    if (from > to) {
      return { dateFrom: to, dateTo: from, datesWereSwapped: true };
    }
    return { dateFrom: from, dateTo: to, datesWereSwapped: false };
  }, [preset, customFrom, customTo]);

  const reportQuery = trpc.admin.getSalesReport.useQuery({
    dateFrom,
    dateTo,
    deliveryMethod,
  });

  const report = reportQuery.data;

  const chartData = useMemo(() => {
    if (!report?.series?.length) return [];
    return report.series.map(s => ({
      ...s,
      label: s.date.slice(5),
    }));
  }, [report]);

  const costVsRevenue = useMemo(() => {
    if (!report) return [];
    return [
      { name: "Revenue", value: report.grossSales },
      { name: "Cost", value: report.totalCost },
      { name: "Gross profit", value: report.grossProfit },
    ];
  }, [report]);

  const sortedProfitability = useMemo(() => {
    const rows = report?.productProfitability ?? [];
    const dir = sortDir === "desc" ? -1 : 1;
    const copy = [...rows];
    copy.sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "profit") {
        av = a.profit;
        bv = b.profit;
      } else if (sortKey === "revenue") {
        av = a.revenue;
        bv = b.revenue;
      } else if (sortKey === "units") {
        av = a.unitsSold;
        bv = b.unitsSold;
      } else if (sortKey === "cost") {
        av = a.cost;
        bv = b.cost;
      } else {
        av = a.marginPct ?? -Infinity;
        bv = b.marginPct ?? -Infinity;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [report, sortKey, sortDir]);

  const exportCsv = () => {
    if (!report) return;
    const rows: string[][] = [
      ["Boss Hookah Sales Report"],
      ["Date from", report.dateFrom],
      ["Date to", report.dateTo],
      ["Delivery filter", report.deliveryMethod],
      [],
      ["Gross sales", String(report.grossSales)],
      ["Refunds", String(report.refundedTotal)],
      ["Net sales", String(report.netSales)],
      ["Total cost (matched lines)", String(report.totalCost)],
      ["Gross profit", String(report.grossProfit)],
      ["Profit margin (on gross)", String(report.profitMargin ?? "")],
      ["Net profit after refunds", String(report.netProfitAfterRefunds)],
      ["Avg order value (paid)", String(report.averageOrderValue ?? "")],
      ["Orders in range", String(report.orderCount)],
      ["Paid orders", String(report.paidOrderCount)],
      ["Pending orders", String(report.pendingOrderCount)],
      ["Shipping / pickup (paid)", `${report.shippingOrders} / ${report.pickupOrders}`],
      ["Unknown cost line items", String(report.unknownCostLineCount)],
      [],
      ["Top products (name, units, revenue, cost, profit)"],
    ];
    for (const p of report.topProducts.slice(0, 20)) {
      rows.push([p.name, String(p.units), String(p.revenue), String(p.cost), String(p.profit)]);
    }
    downloadCsv(`boss-hookah-sales-${report.dateFrom}_${report.dateTo}.csv`, rows);
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 p-0.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
        {(
          [
            ["today", "Today"],
            ["7", "7d"],
            ["30", "30d"],
            ["month", "Month"],
            ["custom", "Custom"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setPreset(k)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              preset === k
                ? "bg-[#1a2312] text-[#bef264] border border-[#3f6212]/40"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="h-9 w-36 text-xs bg-zinc-900 border-zinc-700 text-zinc-200"
          />
          <span className="text-zinc-600">–</span>
          <Input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="h-9 w-36 text-xs bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>
      )}
      <Select value={deliveryMethod} onValueChange={(v: "all" | "shipping" | "pickup") => setDeliveryMethod(v)}>
        <SelectTrigger className="h-9 w-[140px] text-xs bg-zinc-900 border-zinc-700 text-zinc-200">
          <SelectValue placeholder="Delivery" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All delivery</SelectItem>
          <SelectItem value="shipping">Shipping</SelectItem>
          <SelectItem value="pickup">Pickup</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        className="h-9 bg-[#3f6212] hover:bg-[#4d7c0f] text-[#ecfccb] border border-[#65a30d]/50"
        disabled={!report || reportQuery.isFetching}
        onClick={exportCsv}
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Export CSV
      </Button>
    </div>
  );

  return (
    <AdminShell title="Sales" subtitle="Revenue, cost, and profit (paid orders in range)">
      <div className="max-w-7xl mx-auto space-y-6">
        {headerActions}
        {reportQuery.isError && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 text-red-200 text-sm px-4 py-3">
            {reportQuery.error.message}
          </div>
        )}

        {report?.hasUnknownCost && (
          <div className="flex gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 text-amber-100/90 text-xs px-4 py-3">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <p>
              Some line items have no matching product cost ({report.unknownCostLineCount} line
              {report.unknownCostLineCount === 1 ? "" : "s"}). Set unit cost on products in Inventory so totals are
              complete.
            </p>
          </div>
        )}

        {datesWereSwapped && (
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 text-amber-100/90 text-xs px-4 py-2">
            Start date was after end date — range was swapped for this report.
          </div>
        )}

        {!report && reportQuery.isFetching && (
          <div className="h-32 flex items-center justify-center text-zinc-500 text-sm">Loading report…</div>
        )}

        {report && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <Kpi label="Gross sales" value={fmtMoney(report.grossSales)} />
              <Kpi label="Net sales" value={fmtMoney(report.netSales)} hint="After refunds" />
              <Kpi label="Total cost" value={fmtMoney(report.totalCost)} />
              <Kpi label="Gross profit" value={fmtMoney(report.grossProfit)} accent={report.grossProfit >= 0} />
              <Kpi label="Margin" value={pct(report.profitMargin)} accent={Boolean(report.profitMargin && report.profitMargin > 0)} />
              <Kpi label="AOV" value={report.averageOrderValue != null ? fmtMoney(report.averageOrderValue) : "—"} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800/90 bg-[#121214] px-4 py-3">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Refunds (in range)</p>
                <p className="text-lg font-semibold text-zinc-100 mt-1 tabular-nums">
                  {report.refundedTotal > 0 ? fmtMoney(report.refundedTotal) : "—"}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {report.refundedTotal === 0 ? "No refunded orders in this range." : "Subtracted from gross for net sales."}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800/90 bg-[#121214] px-4 py-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#84cc16]/70" aria-hidden />
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 pl-2">Net profit after refunds</p>
                <p
                  className={`text-lg font-semibold mt-1 tabular-nums pl-2 ${
                    report.netProfitAfterRefunds >= 0 ? "text-[#bef264]" : "text-red-300"
                  }`}
                >
                  {fmtMoney(report.netProfitAfterRefunds)}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5 pl-2">Net sales − matched COGS</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Sales over time">
                {chartData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="label" stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                        labelStyle={{ color: "#a1a1aa" }}
                        formatter={(v: unknown) => [fmtMoney(Number(v)), "Revenue"]}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#a3e635" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
              <ChartCard title="Profit over time">
                {chartData.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="label" stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                        formatter={(v: unknown) => [fmtMoney(Number(v)), "Profit"]}
                      />
                      <Line type="monotone" dataKey="profit" stroke="#84cc16" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard title="Cost vs revenue vs profit">
                {report.grossSales === 0 && report.totalCost === 0 ? (
                  <EmptyChart msg="No paid revenue in this range." />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={costVsRevenue}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis stroke="#71717a" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={v => `$${v}`} />
                      <Tooltip
                        contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
                        formatter={(v: unknown) => fmtMoney(Number(v))}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {costVsRevenue.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i === 0 ? "#52525b" : i === 1 ? "#3f3f46" : "rgba(132, 204, 22, 0.85)"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Order performance">
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <Perf label="Orders in range" value={String(report.orderCount)} />
                  <Perf label="Paid" value={String(report.paidOrderCount)} accent />
                  <Perf label="Pending" value={String(report.pendingOrderCount)} />
                  <Perf label="AOV" value={report.averageOrderValue != null ? fmtMoney(report.averageOrderValue) : "—"} />
                  <Perf label="Shipping (paid)" value={String(report.shippingOrders)} />
                  <Perf label="Pickup (paid)" value={String(report.pickupOrders)} />
                </div>
              </ChartCard>
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-[#121214] overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/80">
                <p className="text-sm font-medium text-zinc-200">Top products</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">By revenue in range (paid lines)</p>
              </div>
              {report.topProducts.length === 0 ? (
                <p className="py-10 text-center text-zinc-500 text-sm">No product lines in paid orders for this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#0c0c0e]/80">
                        <th className="text-left px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium">Product</th>
                        <th className="text-right px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium">Units</th>
                        <th className="text-right px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium">Revenue</th>
                        <th className="text-right px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium">Cost</th>
                        <th className="text-right px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {report.topProducts.slice(0, 12).map(p => (
                        <tr key={p.name} className="hover:bg-zinc-900/40">
                          <td className="px-4 py-2.5 text-zinc-200 max-w-[220px] truncate">{p.name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{p.units}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{fmtMoney(p.revenue)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{fmtMoney(p.cost)}</td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                              p.profit >= 0 ? "text-[#bef264]" : "text-red-300"
                            }`}
                          >
                            {fmtMoney(p.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-[#121214] overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-200">Product profitability</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Paid order lines · click column to sort</p>
                </div>
              </div>
              {sortedProfitability.length === 0 ? (
                <p className="py-10 text-center text-zinc-500 text-sm">No data for this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-[#0c0c0e]/80">
                        <th className="text-left px-4 py-2.5 text-zinc-500 font-medium">Product</th>
                        <SortTh label="Units" k="units" active={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                        <SortTh label="Revenue" k="revenue" active={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                        <SortTh label="Cost" k="cost" active={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                        <SortTh label="Profit" k="profit" active={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                        <SortTh label="Margin" k="margin" active={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70">
                      {sortedProfitability.slice(0, 40).map(row => (
                        <tr key={row.name} className="hover:bg-zinc-900/40">
                          <td className="px-4 py-2.5 text-zinc-200 max-w-[200px] truncate">{row.name}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{row.unitsSold}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">{fmtMoney(row.revenue)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-400">{fmtMoney(row.cost)}</td>
                          <td
                            className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                              row.profit >= 0 ? "text-[#bef264]" : "text-red-300"
                            }`}
                          >
                            {fmtMoney(row.profit)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-zinc-300">
                            {row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {report && report.grossSales === 0 && report.paidOrderCount === 0 && (
          <p className="text-center text-zinc-500 text-sm py-6">
            No paid sales in this range. Try a wider date range or another delivery filter.
          </p>
        )}
      </div>
    </AdminShell>
  );
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 bg-[#121214] ${
        accent ? "border-[#3f6212]/40 shadow-[inset_0_0_0_1px_rgba(132,204,22,0.08)]" : "border-zinc-800/90"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</p>
      <p className={`text-lg font-semibold mt-1 tabular-nums ${accent ? "text-[#bef264]" : "text-zinc-50"}`}>{value}</p>
      {hint && <p className="text-[10px] text-zinc-600 mt-0.5">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-[#121214] p-3 shadow-sm">
      <p className="text-sm font-medium text-zinc-200 px-1 mb-2">{title}</p>
      {children}
    </div>
  );
}

function EmptyChart({ msg = "No series data for this range." }: { msg?: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-zinc-500 text-sm px-4 text-center">{msg}</div>
  );
}

function Perf({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${accent ? "border-[#3f6212]/35 bg-[#18181b]" : "border-zinc-800/80 bg-[#18181b]"}`}>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`text-base font-semibold tabular-nums mt-0.5 ${accent ? "text-[#bef264]" : "text-zinc-100"}`}>{value}</p>
    </div>
  );
}

function SortTh({
  label,
  k,
  active,
  dir,
  onSort,
  align,
}: {
  label: string;
  k: SortKey;
  active: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align: "left" | "right";
}) {
  return (
    <th className={`px-4 py-2.5 text-[10px] uppercase text-zinc-500 font-medium ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={`hover:text-zinc-300 ${active === k ? "text-[#a3e635]" : ""}`}
      >
        {label}
        {active === k ? (dir === "desc" ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
}
