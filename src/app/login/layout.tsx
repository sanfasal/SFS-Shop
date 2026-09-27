import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in · sfs-shop admin",
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
