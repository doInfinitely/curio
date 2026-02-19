import { Header } from "@/components/header";
import { PaletteProvider } from "@/components/palette-provider";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PaletteProvider>
      <Header />
      {children}
    </PaletteProvider>
  );
}
