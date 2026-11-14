import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Item, Reveal, Stagger } from "@/components/motion/primitives";
import { PageHeader } from "@/components/site/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import { COMPANY } from "@/config";

const REASONS = [
  "You run a shop and want to try RetailMind on your own sales data",
  "You have tried the demo and want to tell us what to improve",
  "You want to ask about our plans for markets outside Pakistan",
];

export default function Contact() {
  usePageTitle("Contact");
  const [copied, setCopied] = useState(false);
  const href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(COMPANY.emailSubject)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMPANY.email);
      setCopied(true);
      toast.success("Email address copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy. Select the address and copy it manually.");
    }
  };

  return (
    <>
      <PageHeader title="Write to us" intro="The simplest way to reach the RetailMind team is by email. We read every message." />
      <section className="mx-auto grid max-w-[1200px] gap-14 px-5 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:py-24">
        <Reveal>
          <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-slate-950">Good reasons to get in touch</h2>
          <Stagger className="mt-6 divide-y divide-slate-200 border-y border-slate-200" gap={0.08}>
            {REASONS.map((r) => (
              <Item key={r} className="py-4 text-[15.5px] leading-snug text-slate-700">
                {r}
              </Item>
            ))}
          </Stagger>
        </Reveal>
        <Reveal delay={0.1} className="self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-pop">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-50 text-ink-700 ring-1 ring-ink-100">
              <Mail className="h-5 w-5" />
            </span>
            <p className="mt-5 text-[13px] text-slate-500">Email</p>
            <a href={href} className="mt-1 block break-all text-[20px] font-semibold tracking-[-0.025em] text-slate-950 underline-offset-4 hover:underline">
              {COMPANY.email}
            </a>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href={href}>
                  <Mail /> Send an email
                </a>
              </Button>
              <Button variant="outline" onClick={copy}>
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy address"}
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
