import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends Management",
  description: "Manage your friends, requests, and connections",
};

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}