"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, FileText, LayoutDashboard, Menu, Settings2, Users, X, Zap } from "lucide-react";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/customers", label: "Customers", icon: Users },
];

function Sidebar({ close }: { close?: () => void }) {
  const pathname = usePathname();
  return <aside className="flex h-full w-[260px] flex-col bg-[var(--sidebar)] text-white">
    <div className="flex h-20 items-center gap-3 px-6 border-b border-white/10">
      <div className="grid size-10 place-items-center rounded-xl bg-blue-500 shadow-lg shadow-blue-900/30"><Zap size={20} fill="currentColor" /></div>
      <div><div className="font-black tracking-tight">BillFlow</div><div className="text-xs text-slate-400">Smart billing workspace</div></div>
      {close && <button className="ml-auto lg:hidden" onClick={close}><X size={20}/></button>}
    </div>
    <div className="flex-1 p-4">
      <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500">Workspace</div>
      <nav className="space-y-1">{nav.map((item) => { const Icon = item.icon; const active = pathname === item.href || pathname.startsWith(item.href + "/"); return <Link key={item.href} href={item.href} onClick={close} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition", active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white")}><Icon size={18}/>{item.label}{item.label === "Invoices" && <span className="ml-auto rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300">Core</span>}</Link>})}</nav>
      <div className="mt-8 mb-2 px-3 text-[11px] font-bold uppercase tracking-[.16em] text-slate-500">System</div>
      <Link href="#" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500"><Settings2 size={18}/>Settings</Link>
      <Link href="#" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500"><BarChart3 size={18}/>Reports <span className="ml-auto text-[10px]">Soon</span></Link>
    </div>
    <div className="m-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-full bg-blue-500/15 text-blue-300 font-bold">BF</div><div className="min-w-0"><div className="truncate text-sm font-bold">Business workspace</div><div className="text-xs text-slate-500">Spring Boot backend</div></div></div>
    </div>
  </aside>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-[var(--background)]"><div className="fixed inset-y-0 left-0 z-40 hidden lg:block"><Sidebar /></div>{open && <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)}><div className="h-full w-[275px]" onClick={(e) => e.stopPropagation()}><Sidebar close={() => setOpen(false)}/></div></div>}
    <div className="lg:pl-[260px]"><header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur"><div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8"><button className="btn btn-ghost lg:hidden" onClick={() => setOpen(true)}><Menu size={21}/></button><div className="min-w-0 flex-1"><div className="text-lg font-black tracking-tight">Billing workspace</div><div className="hidden text-xs text-slate-500 sm:block">Manage sales, products, customers and invoices</div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex"><div className="size-2 rounded-full bg-emerald-500"/><span className="text-xs font-bold text-slate-600">API ready</span></div><div className="grid size-10 place-items-center rounded-full bg-slate-900 text-sm font-black text-white">{initials("BillFlow")}</div></div></div></header><main className="p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>
}
