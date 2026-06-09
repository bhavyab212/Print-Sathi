import Link from "next/link";

export default function DownloadPage() {
  const downloadUrl = process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL || "#";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <i className="bx bx-printer text-white"></i>
            </div>
            <span className="font-bold text-gray-900">Print Sathi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Web Login (Backup)
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100">
            <i className="bx bxl-windows text-4xl text-blue-600"></i>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Download Print Sathi for Windows
          </h1>
          <p className="mb-10 text-lg text-gray-600">
            The ultimate desktop OS for your print shop. Manage queues, auto-print passports, and calculate bills seamlessly.
          </p>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={downloadUrl}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl"
            >
              <i className="bx bx-download text-xl"></i>
              Download for Windows (x64)
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">Requires Windows 10 or 11.</p>
        </div>
        
        <div className="mx-auto mt-24 max-w-5xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <i className="bx bx-bolt-circle text-2xl"></i>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Real-time Queue</h3>
              <p className="text-sm text-gray-600">Get instant desktop notifications when customers submit print jobs.</p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <i className="bx bx-id-card text-2xl"></i>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">1-Click Passports</h3>
              <p className="text-sm text-gray-600">Auto-remove backgrounds and print perfect A4 sheets directly from the app.</p>
            </div>
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <i className="bx bx-printer text-2xl"></i>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Direct Printing</h3>
              <p className="text-sm text-gray-600">Bypass browser print dialogs. Send jobs directly to your configured printers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
