import { useEffect } from "react";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | RetailMind` : "RetailMind: ask your retail data anything";
  }, [title]);
}
