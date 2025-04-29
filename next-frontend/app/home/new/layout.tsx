interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata = {
  title: "New Session",
};

export default function PageLayout({ children }: RootLayoutProps) {
  return children;
}
