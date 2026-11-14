/** Company facts used across the public pages. Edit here, not in the page files. */
export const COMPANY = {
  name: "RetailMind",
  email: "retailmind@gmail.com",
  emailSubject: "Hello RetailMind",
} as const;

export const SITE_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/vision", label: "Vision" },
  { to: "/team", label: "Team" },
  { to: "/products", label: "Products" },
  { to: "/proposed-project", label: "Proposed project" },
  { to: "/contact", label: "Contact" },
] as const;
