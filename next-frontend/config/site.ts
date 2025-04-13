export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Nowaster",
  description: "Track your time!",
  mainNav: [
    {
      title: "History",
      href: "/home/history",
    },
    {
      title: "Plan",
      href: "/home/new",
    },
    {
      title: "Tags",
      href: "/home/tags",
    },
    {
      title: "Friends",
      href: "/home/friends",
    },
  ],
} as const;
