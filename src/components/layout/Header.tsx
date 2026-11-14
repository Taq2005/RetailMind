import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, Check, ChevronsUpDown, CircleUser, CreditCard, FileText, LogOut, Menu, MessageSquareText, Search, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { NAV } from "./nav";
import { SUGGESTED_PROMPTS } from "@/data/askEngine";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export const WORKSPACES = [
  { id: "nw", name: "Northwind Apparel & Tech", note: "Production" },
  { id: "ho", name: "Harbor Outlet", note: "Production" },
  { id: "st", name: "Northwind Staging", note: "Sandbox" },
];

interface Alert {
  id: string;
  icon: "stock" | "sync" | "report" | "user";
  title: string;
  body: string;
  time: string;
  href: string;
}
const ALERTS: Alert[] = [
  { id: "a1", icon: "stock", title: "Metro Bomber is down to 6 days of cover", body: "64 units left at 10 a day. Reorder level is 123.", time: "12 min ago", href: "/app/ask?q=Which SKUs will stock out in 14 days?" },
  { id: "a2", icon: "sync", title: "Loyalty Platform sync failed", body: "401 Unauthorized. The API key was rotated 31 hours ago.", time: "31 hr ago", href: "/app/connectors" },
  { id: "a3", icon: "report", title: "Weekly brief is ready", body: "Revenue up 12.4% on the previous 30 days.", time: "Yesterday", href: "/app/reports" },
  { id: "a4", icon: "user", title: "Dana Whitfield joined the workspace", body: "Merchandising. Viewer access.", time: "2 days ago", href: "/app/settings" },
  { id: "a5", icon: "stock", title: "Aero Smartwatch margin fell 8 points", body: "Supplier cost change detected on the last three POs.", time: "3 days ago", href: "/app/ask?q=Which products have declining profit margins?" },
];
const ICONS = { stock: AlertTriangle, sync: AlertTriangle, report: FileText, user: Users } as const;

export function Header({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate();
  const [ws, setWs] = useLocalStorage("rm.workspace", "nw");
  const [read, setRead] = useLocalStorage<string[]>("rm.alerts.read", []);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const unread = ALERTS.filter((a) => !read.includes(a.id));
  const workspace = WORKSPACES.find((w) => w.id === ws) ?? WORKSPACES[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 px-4 sm:px-6">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu className="h-[18px] w-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex h-9 items-center gap-2.5 rounded-lg border border-slate-200 bg-white/80 pl-1.5 pr-2.5 text-[13px] font-medium text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-white active:scale-[0.98]" aria-label="Switch workspace">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-ink-600 to-ink-800 text-[11px] font-semibold text-white">{workspace.name[0]}</span>
              <span className="hidden max-w-[180px] truncate sm:block">{workspace.name}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            {WORKSPACES.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onSelect={() => {
                  setWs(w.id);
                  toast.success(`Switched to ${w.name}`, { description: w.note === "Sandbox" ? "This is a sandbox. Changes won't touch production data." : undefined });
                }}
              >
                <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">{w.name[0]}</span>
                <span className="flex-1">
                  <span className="block text-[13px] leading-tight text-slate-800">{w.name}</span>
                  <span className="block text-[11px] text-slate-400">{w.note}</span>
                </span>
                {w.id === ws && <Check className="!h-4 !w-4 !text-ink-600" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => setSearchOpen(true)}
          className="group ml-auto flex h-9 w-full max-w-[340px] items-center gap-2.5 rounded-lg border border-slate-200 bg-white/70 px-3 text-[13px] text-slate-400 shadow-sm transition-all hover:border-slate-300 hover:bg-white active:scale-[0.99] md:ml-4"
          aria-label="Search (Command K)"
        >
          <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span className="flex-1 text-left">Search or ask</span>
          <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:block">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Popover
            open={bellOpen}
            onOpenChange={(o) => {
              setBellOpen(o);
              if (!o) setRead(ALERTS.map((a) => a.id));
            }}
          >
            <PopoverTrigger asChild>
              <button className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-800 active:scale-95" aria-label={`Notifications, ${unread.length} unread`}>
                <motion.span whileTap={{ rotate: [0, -14, 12, -6, 0] }} transition={{ duration: 0.45 }}>
                  <Bell className="h-[18px] w-[18px]" />
                </motion.span>
                <AnimatePresence>
                  {unread.length > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 18, delay: 0.6 }}
                      className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white"
                    >
                      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-rose-500" />
                      <span className="relative num">{unread.length}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[360px] p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                <button className="text-xs font-medium text-ink-700 hover:underline disabled:text-slate-400 disabled:no-underline" disabled={unread.length === 0} onClick={() => setRead(ALERTS.map((a) => a.id))}>
                  Mark all as read
                </button>
              </div>
              <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto scrollbar-thin">
                {ALERTS.map((a, i) => {
                  const Icon = ICONS[a.icon];
                  const isNew = !read.includes(a.id);
                  return (
                    <motion.li key={a.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i, duration: 0.25 }}>
                      <button
                        className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        onClick={() => {
                          setBellOpen(false);
                          setRead(ALERTS.map((x) => x.id));
                          navigate(a.href);
                        }}
                      >
                        <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg", a.icon === "report" ? "bg-ink-50 text-ink-700" : a.icon === "user" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700")}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-[13px] font-medium leading-snug text-slate-900">{a.title}</span>
                            {isNew && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-600" aria-label="Unread" />}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">{a.body}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">{a.time}</span>
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-105 active:scale-95" aria-label="Account menu">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-amber-signal to-orange-400 text-[12px] font-semibold text-white ring-2 ring-white">MT</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <div className="px-2.5 py-2">
                <p className="text-[13px] font-medium text-slate-900">Muhammad Taqi</p>
                <p className="text-xs text-slate-500">Admin, {workspace.name}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/app/settings")}>
                <CircleUser /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/app/settings")}>
                <Settings /> Workspace settings
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/app/settings")}>
                <CreditCard /> Plan and usage
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate("/")}>
                <LogOut /> Back to site
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  useEffect(() => {
    if (!open) setValue("");
  }, [open]);
  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };
  const ask = (q: string) => go(`/app/ask?q=${encodeURIComponent(q)}`);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="top-[18%] max-w-xl translate-y-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">Jump to a page or ask a question about your data.</DialogDescription>
        <Command loop>
          <CommandInput autoFocus value={value} onValueChange={setValue} placeholder="Jump to a page or ask a question" />
          <CommandList>
            <CommandEmpty>Nothing matches. Press Enter to ask it as a question.</CommandEmpty>
            {value.trim().length > 2 && (
              <CommandGroup heading="Ask AI">
                <CommandItem value={`ask ${value}`} onSelect={() => ask(value)}>
                  <Sparkles /> Ask: <span className="truncate font-medium">{value}</span>
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Pages">
              {NAV.map((n) => (
                <CommandItem key={n.to} value={`go ${n.label}`} onSelect={() => go(n.to)}>
                  <n.icon /> {n.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Suggested questions">
              {SUGGESTED_PROMPTS.map((p) => (
                <CommandItem key={p} value={`question ${p}`} onSelect={() => ask(p)}>
                  <MessageSquareText /> {p}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Recent">
              <CommandItem value="recent loyalty" onSelect={() => go("/app/connectors")}>
                <AlertTriangle /> Loyalty Platform connector
              </CommandItem>
              <CommandItem value="recent weekly brief" onSelect={() => go("/app/reports")}>
                <FileText /> Weekly brief, Nov 9
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
