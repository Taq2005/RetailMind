import { Database } from "lucide-react";
import { DEMO_ACCOUNT_EMAIL } from "@/config";

export function NoSalesData() {
  return (
    <div className="mx-auto grid min-h-[65vh] max-w-[560px] place-items-center px-5 py-12 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-50 text-ink-700 ring-1 ring-ink-100">
          <Database className="h-5 w-5" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950">No sales data in this workspace yet</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          This account does not have sales data connected. The sample analytics are only available to the <code>{DEMO_ACCOUNT_EMAIL}</code> demo account.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Data import for individual accounts is not set up yet. Your dashboard will stay empty until your own data is added.
        </p>
      </div>
    </div>
  );
}
