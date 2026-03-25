// Admin Customers — bh_customers (checkout / wholesale accounts)
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Mail, Calendar, Trash2, Users } from "lucide-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");

  const { data: customersData, isLoading, refetch } = trpc.admin.getCustomers.useQuery({
    page: 1,
    pageSize: 50,
    search: search.trim() || undefined,
  });

  const deleteCustomer = trpc.admin.deleteCustomer.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDelete = (customerId: string, customerName: string) => {
    if (
      window.confirm(`Delete customer "${customerName}"? This cannot be undone.`)
    ) {
      deleteCustomer.mutate({ customerId });
    }
  };

  const customers = customersData?.customers ?? [];

  const searchBar = (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search name or email…"
        className="h-9 pl-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200"
      />
    </div>
  );

  return (
    <AdminShell title="Customers" subtitle="Wholesale / checkout accounts (bh_customers)" actions={searchBar}>
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
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
                  {customers.length > 0 ? (
                    customers.map(customer => (
                      <tr key={customer.id} className="hover:bg-zinc-900/35 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                              <Users className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-zinc-200">{customer.name || "Guest"}</div>
                              <div className="text-[11px] font-mono text-zinc-500 truncate max-w-[140px]">{customer.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            {customer.email || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300 tabular-nums">{customer.orderCount}</td>
                        <td className="px-4 py-3 text-zinc-200 tabular-nums">${customer.totalSpent.toFixed(2)}</td>
                        <td className="px-4 py-3 text-zinc-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(customer.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {new Date(customer.lastSignedIn).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-zinc-400 hover:text-red-300"
                            onClick={() => handleDelete(customer.id, customer.name || "Guest")}
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
      </div>
    </AdminShell>
  );
}
