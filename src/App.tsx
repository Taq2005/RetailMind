import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ScrollProgress, SmoothScroll } from "@/components/motion/primitives";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AskAI = lazy(() => import("@/pages/AskAI"));
const Connectors = lazy(() => import("@/pages/Connectors"));
const Placeholders = lazy(() => import("@/pages/Placeholders"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <TooltipProvider>
      <SmoothScroll />
      <ScrollProgress />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen" />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname.startsWith("/app") ? "app" : location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="ask" element={<AskAI />} />
              <Route path="connectors" element={<Connectors />} />
              <Route path="sources" element={<Placeholders kind="sources" />} />
              <Route path="analytics" element={<Placeholders kind="analytics" />} />
              <Route path="reports" element={<Placeholders kind="reports" />} />
              <Route path="settings" element={<Placeholders kind="settings" />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <Toaster />
    </TooltipProvider>
  );
}
