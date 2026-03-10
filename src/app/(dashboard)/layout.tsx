import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Providers } from "@/lib/providers";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <Sidebar />
      <div className="lg:pl-[220px]">
        <Header />
        <main className="px-4 pb-8 pt-4 lg:px-6">{children}</main>
      </div>
    </Providers>
  );
}
