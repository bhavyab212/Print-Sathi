import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Print Job — Print Sathi",
  description: "Upload your files and submit a print job to this shop.",
};

export default function CustomerPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <i className="bx bx-printer text-xl text-white"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Print Sathi</h1>
            <p className="text-xs text-gray-500">
              Shop: <span className="font-medium">{params.slug}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Coming soon */}
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <i className="bx bx-cloud-upload text-4xl text-blue-400"></i>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          QR Print Queue
        </h2>
        <p className="text-sm text-gray-500">
          Upload your documents here and pick them up at the counter. Coming
          soon in Phase 3!
        </p>
      </div>
    </div>
  );
}
