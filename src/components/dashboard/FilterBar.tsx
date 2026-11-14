import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CHANNEL_OPTIONS, RANGE_OPTIONS } from "@/data/selectors";
import type { ChannelFilter, RangeKey } from "@/data/types";

function Segmented<T extends string>({ value, onChange, options, id, label }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[]; id: string; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100/90 p-0.5 ring-1 ring-inset ring-slate-200/70">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.key)}
            className={cn("relative h-8 rounded-md px-3 text-[13px] font-medium transition-colors active:scale-[0.97]", active ? "text-slate-900" : "text-slate-500 hover:text-slate-800")}
          >
            {active && <motion.span layoutId={id} className="absolute inset-0 rounded-md bg-white shadow-[0_0_0_1px_rgb(15_23_42/.06),0_1px_2px_rgb(15_23_42/.08)]" transition={{ type: "spring", stiffness: 520, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FilterBar({ range, channel, onRange, onChannel }: { range: RangeKey; channel: ChannelFilter; onRange: (r: RangeKey) => void; onChannel: (c: ChannelFilter) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented id="range-thumb" label="Date range" value={range} onChange={onRange} options={RANGE_OPTIONS} />
      <Segmented id="channel-thumb" label="Channel" value={channel} onChange={onChannel} options={CHANNEL_OPTIONS} />
    </div>
  );
}
