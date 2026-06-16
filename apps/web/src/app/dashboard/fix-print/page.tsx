import { FixPrintFlow } from "@/components/document/FixPrintFlow";

export const metadata = {
  title: "Fix & Print Document | Print Sathi",
  description: "Format, scale, and layout PDFs automatically.",
};

export default function FixPrintPage() {
  return (
    <main className="h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 mesh-bg">
      <FixPrintFlow />
    </main>
  );
}
