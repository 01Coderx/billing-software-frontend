"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: React.ReactNode }) {
  return <select className="input" value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>;
}
