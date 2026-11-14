import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ScrollProgress, SmoothScroll } from "@/components/motion/primitives";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SiteLayout } from "@/components/site/SiteLayout";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AskAI = lazy(() => import("@/pages/AskAI"));
const Connectors = lazy(() => import("@/pages/Connectors"));
const Placeholders = lazy(() => import("@/pages/Placeholders"));
const About = lazy(() => import("@/pages/site/About"));
const Vision = lazy(() => import("@/pages/site/Vision"));
const Team = lazy(() => import("@/pages/site/Team"));
const Products = lazy(() => import("@/pages/site/Products"));
const ProposedProject = lazy(() => import("@/pages/site/ProposedProject"));
const Contact = lazy(() => import("@/pages/site/Contact"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <TooltipProvider>
      <SmoothScroll />
      <ScrollProgress />
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/team" element={<Team />} />
              <Route path="/products" element={<Products />} />
              <Route path="/proposed-project" element={<ProposedProject />} />
              <Route path="/contact" element={<Contact />} />
            </Route>
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
      </Suspense>
      <Toaster />
    </TooltipProvider>
  );
}
