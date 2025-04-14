interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata = {
  title: "Tags",
};

export default function PageLayout({ children }: RootLayoutProps) {
  return children;
}
