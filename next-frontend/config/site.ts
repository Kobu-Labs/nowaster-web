export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Nowaster",
  description:
    "Track your time!",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "History",
      href: "/history",
    },
    {
      title: "New Session",
      href: "/new"
    },
  ],
};
