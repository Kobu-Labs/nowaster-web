export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  description: "Track your time!",
  mainNav: [
    {
      href: "/home/history",
      title: "History",
    },
    {
      href: "/home/new",
      title: "Plan",
    },
    {
      href: "/home/tags",
      title: "Tags",
    },
    {
      href: "/home/friends",
      title: "Friends",
    },
    {
      href: "/home/templates",
      title: "Templates",
    },
  ],
  name: "Nowaster",
} as const;
