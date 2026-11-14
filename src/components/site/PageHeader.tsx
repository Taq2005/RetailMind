import { motion } from "framer-motion";

/** Page title block shared by the company pages. */
export function PageHeader({ title, intro }: { title: string; intro: string }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80">
      <div className="ambient absolute inset-0" aria-hidden />
      <div className="grid-fade absolute inset-x-0 top-0 h-[360px]" aria-hidden />
      <div className="relative mx-auto max-w-[1200px] px-5 pb-14 pt-16 sm:px-6 lg:pb-20 lg:pt-24">
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="max-w-[18ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] text-slate-950 sm:text-[56px]">
          {title}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-slate-600">
          {intro}
        </motion.p>
      </div>
    </section>
  );
}
