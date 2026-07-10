import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F4FAFA]">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-teal-700">MedBook</h1>
          <p className="text-sm text-gray-500">Administraçao</p>
        </div>
        <nav className="flex flex-col gap-2">
          <Link
            href="/admin"
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
          >
            Calendário
          </Link>
          <Link
            href="/admin/contexto"
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
          >
            Contexto da Clínica
          </Link>
          <a
            href="/chat"
            target="_blank"
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
          >
            Chat Web
          </a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
