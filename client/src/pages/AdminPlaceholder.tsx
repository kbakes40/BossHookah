import { useLocation } from "wouter";
import { AdminShell } from "@/components/admin/AdminShell";
import { FileText, Tag, BarChart3, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const PLACEHOLDER: Record<
  string,
  { title: string; subtitle: string; body: string; Icon: LucideIcon }
> = {
  "/admin/content": {
    title: "Content",
    subtitle: "Store pages, policies, and media",
    body:
      "This section is reserved for storefront content: pages, policy text, media library, and navigation menus. Wire it to your CMS or custom tables when you are ready.",
    Icon: FileText,
  },
  "/admin/discounts": {
    title: "Discounts",
    subtitle: "Promotions and codes",
    body:
      "Placeholder for discount rules, coupon codes, and promotional pricing. Connect to checkout when discount logic is implemented.",
    Icon: Tag,
  },
  "/admin/analytics": {
    title: "Analytics",
    subtitle: "Traffic and conversion (coming soon)",
    body:
      "Use Sales for revenue and margin. Broader analytics (sessions, funnels) can be added later without changing the main reporting model.",
    Icon: BarChart3,
  },
  "/admin/marketing": {
    title: "Marketing",
    subtitle: "Campaigns and messaging",
    body:
      "Placeholder for email campaigns, announcements, and integrations. Keeps the admin structure aligned with a full ecommerce stack.",
    Icon: Megaphone,
  },
};

export default function AdminPlaceholder() {
  const [location] = useLocation();
  const cfg = PLACEHOLDER[location] ?? {
    Icon: FileText,
    title: "Admin",
    subtitle: "Section",
    body: "This route is not configured. Use the sidebar to pick a primary area.",
  };
  const Icon = cfg.Icon;

  return (
    <AdminShell title={cfg.title} subtitle={cfg.subtitle}>
      <div className="max-w-xl rounded-xl border border-zinc-800/90 bg-[#121214] p-6">
        <div className="flex gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Icon className="h-5 w-5 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Not configured yet</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Intentional placeholder · navigation stays complete</p>
          </div>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">{cfg.body}</p>
      </div>
    </AdminShell>
  );
}
