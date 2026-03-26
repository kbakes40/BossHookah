// Admin Customers — bh_customers (checkout / wholesale accounts)
import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { exportToCsv } from "@/lib/exportCsv";
import { Search, Mail, Calendar, Trash2, Users, Download } from "lucide-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data: customers, isLoading, refetch } = trpc.admin.customers.list.useQuery(
    { search: query.trim() || undefined },
    { placeholderData: keepPreviousData }
  );

  const deleteCustomer = trpc.admin.deleteCustomer.useMutation({
    onSuccess: () => void refetch(),
  });

  const handleDelete = (customerId: string, customerName: string) => {
    if (window.confirm(`Delete customer "${customerName}"? This cannot be undone.`)) {
      deleteCustomer.mutate({ customerId });
    }
  };

  const handleExport = () => {
    if (!customers?.length) return;
    exportToCsv(
      "boss-hookah-customers.csv",
      customers.map(c => ({
        id: c.id,
        email: c.email,
        name: c.name,
        orders: c.orders,
        totalSpentUsd: c.totalSpent,
        joined: c.joined,
        updated: c.updated,
      }))
    );
  };

  const searchBar = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
        <Input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && setQuery(search)}
          className="h-9 pl-8 max-w-sm text-xs bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-zinc-700 bg-zinc-900 text-white"
        onClick={() => setQuery(search)}
      >
        Search
      </Button>
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-zinc-400"
          onClick={() => {
            setSearch("");
            setQuery("");
          }}
        >
          Clear
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 border-zinc-700 bg-zinc-900 text-white"
        onClick={handleExport}
        disabled={!customers?.length}
      >
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Export CSV
      </Button>
    </div>
  );

  return (
    <AdminShell title="Customers" subtitle="Wholesale / checkout accounts (bh_customers)">
      <div className="max-w-7xl mx-auto space-y-4">
        {searchBar}
        {isLoading && !customers?.length ? (
          <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">Loading…</div>
        ) : (
          <div className="rounded-xl border border-zinc-800/90 bg-[#121214] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0c0c0e] border-b border-zinc-800/80">
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Customer
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Orders
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Spent
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Joined
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Updated
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {customers && customers.length > 0 ? (
                    customers.map(c => (
                      <tr key={c.id} className="hover:bg-zinc-900/35 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-zinc-200">{c.name}</div>
                              <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[140px]">
                                {c.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{c.email || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 tabular-nums">{c.orders}</td>
                        <td className="px-4 py-3 text-zinc-200 tabular-nums">
                          ${c.totalSpent.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {new Date(c.joined).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(c.updated).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-zinc-400 hover:text-red-300"
                            onClick={() => handleDelete(c.id, c.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-zinc-500">
                        No customers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {customers != null && (
          <p className="text-xs text-zinc-600">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
            {customers.length >= 10_000 ? " (max 10,000 shown — refine search)" : ""}
          </p>
        )}
      </div>
    </AdminShell>
  );
}
