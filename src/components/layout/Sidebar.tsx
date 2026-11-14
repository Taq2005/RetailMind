import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronsLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "./nav";
import { Wordmark } from "@/components/Logo";
import { Tip } from "@/components/ui/tooltip";
import { StatusDot } from "@/components/motion/primitives";
import { useAuth } from "@/auth/AuthContext";
import { isDemoEmail } from "@/config";

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: Props) {
  const { user } = useAuth();
  const isDemoAccount = isDemoEmail(user?.email);

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        aria-label="Primary"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-[#FBFBFC] transition-[width,transform] duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]",
          collapsed ? "lg:w-[68px]" : "lg:w-[248px]",
          "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn("flex h-14 items-center border-b border-slate-200/80 px-4", collapsed ? "lg:justify-center lg:px-0" : "justify-between")}>
          <NavLink to="/" aria-label="RetailMind home" className="rounded-md">
            <Wordmark collapsed={collapsed} className={collapsed ? "lg:[&>span]:hidden" : ""} />
          </NavLink>
          <button onClick={onCloseMobile} className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2.5 scrollbar-thin">
          {NAV.map((item) => (
            <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
          ))}
        </nav>

        <div className="space-y-3 border-t border-slate-200/80 p-3">
          {isDemoAccount && (
            !collapsed ? (
              <NavLink to="/app/connectors" onClick={onCloseMobile} className="block rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-lift">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Query allowance</span>
                  <span className="num text-slate-500">1,284 / 5,000</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div className="h-full rounded-full bg-ink-600" initial={{ width: 0 }} animate={{ width: "25.7%" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <StatusDot tone="bad" />
                  Loyalty Platform needs attention
                </div>
              </NavLink>
            ) : (
              <Tip label="Loyalty Platform needs attention" side="right">
                <NavLink to="/app/connectors" className="mx-auto hidden h-9 w-9 place-items-center rounded-lg hover:bg-slate-100 lg:grid" aria-label="Connector status">
                  <StatusDot tone="bad" />
                </NavLink>
              </Tip>
            )
          )}
          <button
            onClick={onToggle}
            className={cn("hidden h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 lg:flex", collapsed && "justify-center px-0")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
          >
            <ChevronsLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({ item, collapsed, onNavigate }: { item: (typeof NAV)[number]; collapsed: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  const link = (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} className="group relative block rounded-lg outline-offset-0">
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-lg bg-white shadow-[0_0_0_1px_rgb(15_23_42/.07),0_1px_2px_rgb(15_23_42/.06)]"
              transition={{ type: "spring", stiffness: 520, damping: 38 }}
            />
          )}
          {isActive && <motion.span layoutId="nav-bar" className="absolute -left-2.5 top-2 bottom-2 w-[3px] rounded-r-full bg-ink-600" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
          <span className={cn("relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium transition-colors", collapsed && "lg:justify-center lg:px-0", isActive ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900")}>
            <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95", isActive ? "text-ink-700" : "text-slate-400 group-hover:text-slate-700")} strokeWidth={isActive ? 2.1 : 1.8} />
            <span className={cn("truncate transition-transform duration-200 group-hover:translate-x-0.5", collapsed && "lg:hidden")}>{item.label}</span>
          </span>
        </>
      )}
    </NavLink>
  );
  return collapsed ? (
    <Tip label={item.label}>
      <div>{link}</div>
    </Tip>
  ) : (
    link
  );
}
