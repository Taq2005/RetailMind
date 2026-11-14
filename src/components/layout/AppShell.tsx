import { Suspense, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export function AppShell() {
  const [collapsed, setCollapsed] = useLocalStorage("rm.sidebar.collapsed", false);
  const [mobile, setMobile] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobile} onCloseMobile={() => setMobile(false)} />
      <div className={cn("transition-[padding] duration-300 [transition-timing-function:cubic-bezier(.22,1,.36,1)]", collapsed ? "lg:pl-[68px]" : "lg:pl-[248px]")}>
        <Header onOpenMobileNav={() => setMobile(true)} />
        <motion.main key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="relative">
          <div className="ambient pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px]" aria-hidden />
          <div className="relative z-10">
            <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
