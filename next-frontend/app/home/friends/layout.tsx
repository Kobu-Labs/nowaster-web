import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Manage your friends, requests, and connections",
  title: "Friends Management",
};

export default function FriendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}