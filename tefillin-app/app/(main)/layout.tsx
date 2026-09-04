import { AppShell } from "@/components/nav/AppShell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
