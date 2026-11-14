import { Suspense, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import { COMPANY, SITE_LINKS } from "@/config";

export function SiteLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-slate-200/70">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-6">
          <Link to="/" aria-label="RetailMind home" className="rounded-md">
            <Wordmark />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {SITE_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : false} className="relative rounded-md px-3 py-1.5 text-[13px] font-medium outline-offset-0">
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="site-nav" className="absolute inset-x-3 -bottom-[13px] h-[2px] rounded-full bg-ink-700" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
                    <span className={cn("transition-colors", isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900")}>{l.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/app">Open the demo</Link>
            </Button>
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:scale-95 lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              id="mobile-nav"
              aria-label="Mobile"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-slate-200/70 bg-white/95 lg:hidden"
            >
              <div className="mx-auto flex max-w-[1200px] flex-col px-3 py-2 sm:px-4">
                {SITE_LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={"end" in l ? l.end : false} className={({ isActive }) => cn("rounded-lg px-3 py-3 text-[15px] font-medium transition-colors", isActive ? "bg-ink-50 text-ink-800" : "text-slate-700 hover:bg-slate-50")}>
                    {l.label}
                  </NavLink>
                ))}
                <Button asChild className="m-2 mt-3 sm:hidden">
                  <Link to="/app">Open the demo</Link>
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-14">
        <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-[38ch] text-[13.5px] leading-relaxed text-slate-500">Retail analytics in plain language, started in Pakistan and built for retailers everywhere.</p>
          </div>
          <nav aria-label="Company" className="flex flex-col gap-2 text-[13.5px]">
            <span className="mb-1 font-medium text-slate-900">Company</span>
            {SITE_LINKS.slice(1, 4).map((l) => (
              <Link key={l.to} to={l.to} className="w-fit text-slate-500 transition-colors hover:text-slate-900">
                {l.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Product" className="flex flex-col gap-2 text-[13.5px]">
            <span className="mb-1 font-medium text-slate-900">Product</span>
            <Link to="/products" className="w-fit text-slate-500 transition-colors hover:text-slate-900">Products</Link>
            <Link to="/proposed-project" className="w-fit text-slate-500 transition-colors hover:text-slate-900">Proposed project</Link>
            <Link to="/contact" className="w-fit text-slate-500 transition-colors hover:text-slate-900">Contact</Link>
            <Link to="/app" className="w-fit text-slate-500 transition-colors hover:text-slate-900">Open the demo</Link>
          </nav>
        </div>
        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-5 text-[12.5px] text-slate-400 sm:flex-row sm:justify-between sm:px-6">
            <p>© 2026 {COMPANY.name}. All rights reserved.</p>
            <p>The demo workspace uses synthetic sample data, not real customers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
