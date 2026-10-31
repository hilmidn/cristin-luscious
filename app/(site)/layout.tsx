import AOSInit from "@/components/AOSInit";
import Preloader from "@/components/Preloader";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AOSInit />
      <Preloader />
      {children}
    </>
  );
}
