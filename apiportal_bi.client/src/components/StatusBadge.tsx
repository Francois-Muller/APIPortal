import type { ReactNode } from "react";
interface StatusBadgeProps { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger"; }
export default function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) { return <span className={`status-badge ${tone}`}>{children}</span>; }
