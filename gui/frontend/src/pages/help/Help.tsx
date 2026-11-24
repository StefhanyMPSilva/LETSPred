import { useState } from "react";
import { BookOpenText, BarChart3, Download, FileBox, FileUser, FilePlus2, Layers, UserRoundPen, FileQuestion, Menu, X } from "lucide-react";
import { GuideContent } from "./GuideContent";
import { ContactContent } from "./ContactContent";
import { PAGE_CONTAINER } from "../../styles/layout";

type HelpView = "guide" | "contact";

const TOC = [
  { id: "overview",   label: "Overview",          icon: <Layers className="w-4 h-4" /> },
  { id: "create",     label: "Create New Model",  icon: <FilePlus2 className="w-4 h-4" /> },
  { id: "pretrained", label: "Pre-trained Models", icon: <FileBox className="w-4 h-4" /> },
  { id: "usermodel",  label: "User Model",         icon: <FileUser className="w-4 h-4" /> },
  { id: "results",    label: "Viewing Results",    icon: <BarChart3 className="w-4 h-4" /> },
  { id: "export",     label: "Exporting Data",     icon: <Download className="w-4 h-4" /> },
];

export function Help() {
  const [view, setView] = useState<HelpView>("guide");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <main className="px-4 md:px-6">
      <div className={`${PAGE_CONTAINER} border border-blue-300 bg-white p-8 max-s1024:p-4 rounded-3xl flex flex-col gap-4`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-200 mb-2 pb-2">
          <div className="flex items-center gap-3">
            <FileQuestion className="w-7 h-7 text-green-400" />
            <h1 className="text-3xl max-s1024:text-2xl font-semibold font-inter text-gray-800">Help</h1>
          </div>

          {/* Botão menu mobile — só aparece abaixo de 1024 */}
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            className="hidden max-s1024:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {view === "guide" ? "Guide" : "Contact"}
          </button>
        </div>

        <div className="flex gap-8 max-s1024:flex-col">

          {/* Sidebar — sempre visível em desktop, toggle em mobile */}
          <aside className={`w-52 shrink-0 max-s1024:w-full ${sidebarOpen ? "max-s1024:block" : "max-s1024:hidden"} s1024:block`}>
            <div className="sticky top-8 max-s1024:static bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contents</p>
              <nav className="flex flex-col gap-1">

                {/* Guide */}
                <button
                  type="button"
                  onClick={() => { setView("guide"); setSidebarOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition w-full text-left cursor-pointer ${
                    view === "guide"
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  <BookOpenText className="w-4 h-4" />
                  Guide
                </button>

                {/* Contact */}
                <button
                  type="button"
                  onClick={() => { setView("contact"); setSidebarOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition w-full text-left cursor-pointer ${
                    view === "contact"
                      ? "bg-orange-50 text-orange-600 font-semibold"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  <UserRoundPen className="w-4 h-4" />
                  Contact
                </button>

                {/* TOC — só no guide */}
                {view === "guide" && (
                  <div className="mt-2 border-t border-gray-100 pt-2 flex flex-col gap-1">
                    {TOC.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </nav>
            </div>
          </aside>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {view === "guide"   && <GuideContent />}
            {view === "contact" && <ContactContent />}
          </div>
        </div>
      </div>
    </main>
  );
}