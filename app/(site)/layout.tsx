import AOSInit from "@/components/AOSInit";
import Preloader from "@/components/Preloader";
import FloatingCartBar from "@/components/FloatingCartBar";
import PageTracker from "@/components/PageTracker";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AOSInit />
      <Preloader />
      <PageTracker />
      {children}
      <FloatingCartBar />
    </>
  );
}
