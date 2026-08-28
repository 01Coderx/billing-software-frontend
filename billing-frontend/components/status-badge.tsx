import { cn } from "@/lib/utils";
export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return <span className={cn("badge", key === "paid" ? "badge-paid" : key === "sent" ? "badge-sent" : key === "cancelled" ? "badge-cancelled" : "badge-draft")}>{status}</span>;
}
