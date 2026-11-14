import { BarChart3, Database, FileText, LayoutDashboard, MessageSquareText, Plug, Settings, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}
export const NAV: NavItem[] = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/ask", label: "Ask AI", icon: MessageSquareText },
  { to: "/app/connectors", label: "Connectors", icon: Plug },
  { to: "/app/sources", label: "Data Sources", icon: Database },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/settings", label: "Settings", icon: Settings },
];
