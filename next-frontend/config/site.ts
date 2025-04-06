export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Nowaster",
  description: "Track your time!",
  mainNav: [
    {
      title: "History",
      href: "/history",
    },
    {
      title: "Plan",
      href: "/new",
    },
    {
      title: "Tags",
      href: "/tags",
    },
    {
      title: "Friends",
      href: "/friends",
    },
  ],
} as const;
