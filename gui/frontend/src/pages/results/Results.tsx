import { ArrowUp, ChartScatter, ChevronDown, Download, FileDigit, FolderOpen, TrendingUpDown, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { TrainedModels } from "./components/trainedmodels/TrainedModels";
import { PredctionModels } from "./components/predictmodel/PredctionModels";
import { ApplicabilityDomain } from "./components/applicabilitydomain/ApplicabilityDomain";
import { useRunList } from "@hooks/useRunList";

type ViewMode = "usermodel" | "output_predictions" | null;

interface ResultsProps {
    onUserModelDeleted?: () => void;
}

function ComponentsDahsboard({ icon, title }: { icon: ReactNode; title: string }){
  return(
    <div className="flex items-center gap-4 mb-2">
     <div>
       {icon}
     </div>
      <p className="font-inter font-semibold text-2xl text-gray-700"> {title} </p>
    </div>
  );
}


// === Seletor dos run ==
function RunSelector({runs, selectedRun, onSelect}:{runs: {id: string; name: string}[]; selectedRun: string | null; onSelect: (id: string) => void;}){
  const [open, setOpen] = useState(false);
  const selected = runs.find(r => r.id === selectedRun);

  return (
    <div className="relative w-72">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-blue-400 transition cursor-pointer">
        <span className="truncate">{selected?.name ?? "Select a run..."}</span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {runs.map(run => (
            <button key={run.id} type="button"
              onClick={() => { onSelect(run.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition ${
                run.id === selectedRun ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700"
              }`}>
              {run.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Back to top
function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => { setIsVisible(window.scrollY > 300);};
    window.addEventListener("scroll", toggle);
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  if (!isVisible) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-32 right-10.5 z-50 bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all cursor-pointer">
      <ArrowUp className="w-8 h-8" />
    </button>
  );
}

export function Results({ onUserModelDeleted }: ResultsProps) { 
  const [viewMode, setViewMode] = useState<ViewMode>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  const usermodelRuns = useRunList("usermodel");
  const predictRuns = useRunList("output_predictions");

  const activeRuns = viewMode === "usermodel" ? usermodelRuns : predictRuns;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Função de delete
  async function handleDelete() {
      if (!selectedRun || !viewMode) return;
      setIsDeleting(true);
      try {
          const response = await fetch(
              `/results/${viewMode}/${selectedRun}`,
              { method: "DELETE" }
          );
          if (!response.ok) throw new Error("Delete failed");

          setSelectedRun(null);
          setConfirmDelete(false);

          if (viewMode === "usermodel") {
            usermodelRuns.refetch();
            onUserModelDeleted?.();  // ← notifica o Home para refetch
          } else {
            predictRuns.refetch();
          }

      } catch (err) {
          console.error("Delete error:", err);
      } finally {
          setIsDeleting(false);
      }
  }

  // Ao trocar de modo, carrega o run mais recente automaticamente
  useEffect(() => {
      if (!viewMode) return;

      if (activeRuns.loadState === "success") {
          if (activeRuns.runs.length === 0) {
              // Lista ficou vazia após delete → resetar tudo
              setSelectedRun(null);
              setViewMode(null);
          } else if (!selectedRun) {
              // Selecionar o mais recente automaticamente
              setSelectedRun(activeRuns.latest?.id ?? null);
          }
      }
  }, [viewMode, activeRuns.runs.length, activeRuns.loadState]);

  // URLs dinâmicas baseadas no run selecionado
  const basePath = viewMode ? `/results/${viewMode}/${selectedRun}` : null;
  const metricsUrl = basePath ? `${basePath}/metrics` : null;
  const domainUrl = basePath ? `${basePath}/domain`: null;
  const predictUrl = basePath ? `${basePath}/predictions` : null;

  // Função de download
  async function handleExport() {
      if (!selectedRun || !viewMode) return;
      
      const url = `/results/${viewMode}/${selectedRun}/export`;
      
      try {
          const response = await fetch(url);
          if (!response.ok) throw new Error("Export failed");
          
          const blob     = await response.blob();
          const link     = document.createElement("a");
          link.href      = URL.createObjectURL(blob);
          link.download  = `${selectedRun}_results.zip`;
          link.click();
          URL.revokeObjectURL(link.href);
      } catch (err) {
          console.error("Export error:", err);
      }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Botões de seleção de modo */}
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={() => { setViewMode("usermodel"); setSelectedRun(null); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition cursor-pointer ${
            viewMode === "usermodel"
              ? "bg-blue-500 border-blue-500 text-white shadow-md"
              : "bg-white border-blue-300 text-blue-500 hover:border-blue-500"
          }`}
        >
          <FileDigit className="w-5 h-5" />
          View Model
        </button>

        <button
          type="button"
          onClick={() => { setViewMode("output_predictions"); setSelectedRun(null); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition cursor-pointer ${
            viewMode === "output_predictions"
              ? "bg-indigo-500 border-indigo-500 text-white shadow-md"
              : "bg-white border-indigo-300 text-indigo-500 hover:border-indigo-500"
          }`}
        >
          <FolderOpen className="w-5 h-5" />
          View Predict
        </button>
      </div>

      {/* Conteúdo */}
      {!viewMode && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
          <FolderOpen className="w-16 h-16" />
          <p className="text-lg font-medium">Select a view mode to explore results</p>
        </div>
      )}

      {viewMode && (
        <>
          {/* Seletor de run */}
          <div className="flex items-center gap-4 px-2">
            <span className="text-sm text-gray-500 font-medium">Run:</span>
            <RunSelector
              runs={activeRuns.runs}
              selectedRun={selectedRun}
              onSelect={setSelectedRun}
            />
          </div>

          {selectedRun && (
            <div className="flex flex-col gap-4">
              {/* Botões Export + Delete */}
              <div className="flex justify-end items-center gap-2">

                {/* Export */}
                <button type="button" onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-emerald-500 text-emerald-600 font-semibold text-sm hover:bg-emerald-50 transition cursor-pointer">
                  <Download className="w-4 h-4" />
                  Export Results
                </button>

                {/* Delete — com confirmação inline */}
                {!confirmDelete ? (
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 transition cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-400 bg-red-50">
                    <span className="text-red-600 text-sm font-semibold">Delete this run?</span>
                    <button type="button" onClick={handleDelete} disabled={isDeleting}
                        className="px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer transition disabled:opacity-50">
                        {isDeleting ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold cursor-pointer transition">
                      Cancel
                    </button>
                  </div>
                )}
              </div>

            
              {/* Trained Model Performance — só para usermodel */}
              {viewMode === "usermodel" && metricsUrl && (
                <section className="border border-gray-200 rounded-lg p-8">
                  <ComponentsDahsboard
                    icon={<FileDigit className="text-blue-500 w-7 h-7" />}
                    title="Trained Model Performance"
                  />
                  <TrainedModels metricsUrl={metricsUrl} />
                </section>
              )}

              {/* Applicability Domain */}
              {domainUrl && (
                <section className="border border-gray-200 rounded-lg p-8">
                  <ComponentsDahsboard
                    icon={<ChartScatter className="text-indigo-500 w-7 h-7" />}
                    title="Applicability Domain"
                  />
                  <ApplicabilityDomain domainUrl={domainUrl} />
                </section>
              )}

              {/* Prediction */}
              {predictUrl && (
                <section className="border border-gray-200 rounded-lg p-8">
                  <ComponentsDahsboard
                    icon={<TrendingUpDown className="text-emerald-500 w-7 h-7" />}
                    title="Prediction"
                  />
                  <PredctionModels predictUrl={predictUrl} metricsUrl={metricsUrl ?? undefined}/>
                </section>
              )}

            </div>
          )}
        </>
      )}

      <BackToTopButton />
    </div>
  );
}
