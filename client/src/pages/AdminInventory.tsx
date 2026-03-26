// Admin Inventory — stock, pricing, unit cost (for margin reporting)
import { useEffect, useState } from "react";
import { Upload, Search, AlertTriangle, Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ADMIN_INVENTORY_PAGE_SIZE } from "@shared/const";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminPageStackClass } from "@/components/admin/adminFilterBarStyles";

export default function AdminInventory() {
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [editingStock, setEditingStock] = useState<{ id: string; quantity: number } | null>(null);
  const [editingCost, setEditingCost] = useState<{ id: string; raw: string } | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    productId: "",
    productName: "",
    brand: "",
    category: "hookahs",
    stockQuantity: 0,
    lowStockThreshold: 10,
    price: 0,
    cost: "" as string | number,
    sku: "",
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setInvPage(1);
  }, [categoryFilter, debouncedSearch]);

  const { data: inventoryData, isLoading, refetch } = trpc.admin.getInventory.useQuery({
    page: invPage,
    pageSize: ADMIN_INVENTORY_PAGE_SIZE,
    category: categoryFilter,
    search: debouncedSearch || undefined,
  });

  const updateStock = trpc.admin.updateInventoryStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated");
      setEditingStock(null);
      refetch();
    },
    onError: () => toast.error("Failed to update stock"),
  });

  const updateCost = trpc.admin.updateProductCost.useMutation({
    onSuccess: () => {
      toast.success("Cost updated");
      setEditingCost(null);
      refetch();
    },
    onError: () => toast.error("Failed to update cost"),
  });

  const { data: catalogSkuInfo } = trpc.admin.siteCatalogSkuCount.useQuery();

  const syncSiteCatalog = trpc.admin.syncSiteCatalog.useMutation({
    onSuccess: result => {
      toast.success(`Imported ${result.count} SKUs (${result.mode}).`);
      refetch();
    },
    onError: err => {
      console.error("[syncSiteCatalog]", err);
      toast.error(err.message || "Catalog import failed", { duration: 12_000 });
    },
  });

  const addItem = trpc.admin.addInventoryItem.useMutation({
    onSuccess: () => {
      toast.success("Item added to inventory");
      setAddDialogOpen(false);
      setNewItem({
        productId: "",
        productName: "",
        brand: "",
        category: "hookahs",
        stockQuantity: 0,
        lowStockThreshold: 10,
        price: 0,
        cost: "",
        sku: "",
      });
      refetch();
    },
    onError: () => toast.error("Failed to add item"),
  });

  const inventoryItems = inventoryData?.items ?? [];
  const invTotal = inventoryData?.total ?? 0;
  const invPageSize = inventoryData?.pageSize ?? ADMIN_INVENTORY_PAGE_SIZE;
  const invTotalPages = Math.max(1, Math.ceil(invTotal / invPageSize));

  const handleStockUpdate = (id: string) => {
    if (editingStock && editingStock.id === id) {
      updateStock.mutate({
        productId: id,
        stock: editingStock.quantity,
      });
    }
  };

  const parseCost = (raw: string): number | null => {
    const t = raw.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const commitCost = (productId: string) => {
    if (!editingCost || editingCost.id !== productId) return;
    const cost = parseCost(editingCost.raw);
    if (cost === null && editingCost.raw.trim() !== "") {
      toast.error("Invalid cost");
      return;
    }
    updateCost.mutate({
      productId,
      cost: cost,
    });
  };

  const handleAddItem = () => {
    const costVal =
      typeof newItem.cost === "string"
        ? parseCost(newItem.cost)
        : Number.isFinite(newItem.cost)
          ? Math.max(0, Number(newItem.cost))
          : null;
    addItem.mutate({
      name: newItem.productName,
      brand: newItem.brand || undefined,
      category: newItem.category,
      price: newItem.price,
      cost: costVal,
      stock: newItem.stockQuantity,
      sku: newItem.sku || undefined,
      in_stock: true,
    });
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700"
        disabled={syncSiteCatalog.isPending}
        onClick={() => {
          const n = catalogSkuInfo?.count ?? 0;
          if (
            !window.confirm(
              `Replace all imported catalog items (SKU starts with "catalog:") with the latest site list? About ${n} SKUs. Default stock 50.`
            )
          )
            return;
          syncSiteCatalog.mutate({ mode: "replace", defaultStock: 50 });
        }}
      >
        <Upload className="w-4 h-4" />
        Import catalog{typeof catalogSkuInfo?.count === "number" ? ` (${catalogSkuInfo.count})` : ""}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-zinc-700 bg-zinc-900 text-zinc-200"
        disabled={syncSiteCatalog.isPending}
        onClick={() => {
          if (!window.confirm("Merge new catalog SKUs only? Existing stock unchanged.")) return;
          syncSiteCatalog.mutate({ mode: "merge" });
        }}
      >
        Merge new
      </Button>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-[#3f6212] hover:bg-[#4d7c0f] text-[#ecfccb] gap-1.5">
            <Plus className="w-4 h-4" />
            Add item
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription className="text-zinc-500">Tracked in bh_products · set cost for margin reports</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="productId">Internal note</Label>
              <Input
                id="productId"
                value={newItem.productId}
                onChange={e => setNewItem({ ...newItem, productId: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
                placeholder="optional"
              />
            </div>
            <div>
              <Label htmlFor="productName">Name</Label>
              <Input
                id="productName"
                value={newItem.productName}
                onChange={e => setNewItem({ ...newItem, productName: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={newItem.brand}
                onChange={e => setNewItem({ ...newItem, brand: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newItem.category} onValueChange={value => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hookahs">Hookahs</SelectItem>
                  <SelectItem value="shisha">Shisha</SelectItem>
                  <SelectItem value="vapes">Vapes</SelectItem>
                  <SelectItem value="charcoal">Charcoal</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="bowls">Bowls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={newItem.stockQuantity}
                onChange={e => setNewItem({ ...newItem, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="lowStockThreshold">Low stock alert</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={newItem.lowStockThreshold}
                onChange={e => setNewItem({ ...newItem, lowStockThreshold: parseInt(e.target.value, 10) || 10 })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="price">Retail ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div>
              <Label htmlFor="cost">Unit cost ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={newItem.cost}
                onChange={e => setNewItem({ ...newItem, cost: e.target.value })}
                placeholder="for profit reports"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={newItem.sku}
                onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="border-zinc-700" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3f6212] hover:bg-[#4d7c0f] text-[#ecfccb]" onClick={handleAddItem}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <AdminShell title="Products" subtitle="Inventory, pricing, and landed unit cost">
      <div className={adminPageStackClass}>
        {toolbar}
        <div className="rounded-xl border border-zinc-800/90 bg-[#121214] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Category</label>
              <Select
                value={categoryFilter || "all"}
                onValueChange={value => setCategoryFilter(value === "all" ? undefined : value)}
              >
                <SelectTrigger className="h-9 bg-zinc-900 border-zinc-700 text-zinc-200 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="hookahs">Hookahs</SelectItem>
                  <SelectItem value="shisha">Shisha</SelectItem>
                  <SelectItem value="vapes">Vapes</SelectItem>
                  <SelectItem value="charcoal">Charcoal</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="bowls">Bowls</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Name, SKU, brand…"
                  className="h-9 pl-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500">
          Catalog import issues: run <code className="text-zinc-400">003_bh_products_sku_unique_fix.sql</code> in Supabase
          and confirm <code className="text-zinc-400">SUPABASE_SERVICE_ROLE_KEY</code> on the server.
        </p>

        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">Loading inventory…</div>
        ) : (
          <div className="rounded-xl border border-zinc-800/90 bg-[#121214] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#0c0c0e] border-b border-zinc-800/90">
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Product
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Category
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      SKU
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Stock
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Price
                    </th>
                    <th className="px-4 py-2.5 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {inventoryItems.length > 0 ? (
                    inventoryItems.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-900/35 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-zinc-200">{item.productName}</div>
                          <div className="text-[11px] text-zinc-500">{item.brand}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{item.category}</td>
                        <td className="px-4 py-3 text-zinc-500 font-mono">{item.sku || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {editingStock?.id === item.id ? (
                              <Input
                                type="number"
                                value={editingStock.quantity}
                                onChange={e =>
                                  setEditingStock({ id: item.id, quantity: parseInt(e.target.value, 10) || 0 })
                                }
                                className="w-16 h-8 bg-zinc-900 border-zinc-700 text-zinc-100"
                                onBlur={() => handleStockUpdate(item.id)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleStockUpdate(item.id);
                                  if (e.key === "Escape") setEditingStock(null);
                                }}
                                autoFocus
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingStock({ id: item.id, quantity: item.stockQuantity })}
                                className="text-sm font-medium text-zinc-200 hover:text-white tabular-nums"
                              >
                                {item.stockQuantity}
                              </button>
                            )}
                            {item.stockQuantity <= item.lowStockThreshold && (
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-200 tabular-nums">${Number(item.price).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {editingCost?.id === item.id ? (
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={editingCost.raw}
                              onChange={e => setEditingCost({ id: item.id, raw: e.target.value })}
                              className="w-24 h-8 bg-zinc-900 border-zinc-700 text-zinc-100"
                              placeholder="—"
                              onBlur={() => commitCost(item.id)}
                              onKeyDown={e => {
                                if (e.key === "Enter") commitCost(item.id);
                                if (e.key === "Escape") setEditingCost(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingCost({
                                  id: item.id,
                                  raw: item.cost != null ? String(item.cost) : "",
                                })
                              }
                              className={`tabular-nums text-left ${
                                item.cost != null ? "text-[#bef264]" : "text-zinc-500"
                              } hover:text-white`}
                            >
                              {item.cost != null ? `$${item.cost.toFixed(2)}` : "Set cost"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-zinc-500">
                        <Package className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                        <p className="text-sm">No products match.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {invTotal > 0 && (
              <div className="px-4 py-3 border-t border-zinc-800/90 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400">
                <span>
                  Showing {Math.min((invPage - 1) * invPageSize + 1, invTotal)}–{Math.min(invPage * invPageSize, invTotal)}{" "}
                  of {invTotal} ({invPageSize}/page)
                </span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 h-8"
                    disabled={invPage <= 1}
                    onClick={() => setInvPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="self-center tabular-nums px-2">
                    {invPage} / {invTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 h-8"
                    disabled={invPage >= invTotalPages}
                    onClick={() => setInvPage(p => Math.min(invTotalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
