import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, actionHref, actionLabel }: { eyebrow?: string; title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-1 text-xs font-black uppercase tracking-[.16em] text-blue-600">{eyebrow || "Workspace"}</div><h1 className="text-3xl font-black tracking-[-.03em] text-slate-950">{title}</h1>{description && <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{description}</p>}</div>{actionHref && actionLabel && <Button asChild><Link href={actionHref}><Plus size={17}/>{actionLabel}<ArrowRight size={15}/></Link></Button>}</div>
}
