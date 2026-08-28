import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", asChild = false, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn("btn", variant === "primary" ? "btn-primary" : variant === "secondary" ? "btn-secondary" : variant === "danger" ? "btn-danger" : "btn-ghost", className)} {...props} />;
}
