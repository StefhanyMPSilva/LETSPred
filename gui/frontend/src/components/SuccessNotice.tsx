import { CheckCircle2, ArrowRight, BarChart3, FolderOpen } from "lucide-react";
import type { SelectModelUseProps } from "../pages/home/Home";
import { useEffect } from "react";

interface SuccessNoticeProps {
  runName: string;
  modelType: SelectModelUseProps;
  onGoToResults: () => void;
  onDismiss: () => void;
  seconds: number;                   
  onSecondsChange: (s: number) => void;
}

export function SuccessNotice({ runName, modelType, onGoToResults, onDismiss, seconds, onSecondsChange }: SuccessNoticeProps) {
  const isTraining = modelType === "createmodel";
  const viewLabel  = isTraining ? "View Model" : "View Predict";
  const ViewIcon   = isTraining ? BarChart3 : FolderOpen;

  const TOTAL = 15;

  useEffect(() => {
    if (seconds <= 0) {
      onDismiss();
      return;
    }
    const timer = setTimeout(() => onSecondsChange(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // Cálculo do círculo SVG
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / TOTAL) * circumference;

  return (
    <div className="border border-emerald-300 bg-emerald-50 rounded-xl p-6 flex flex-col gap-4">

      {/* Título + cronômetro */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <p className="text-emerald-800 font-semibold text-base">
            Analysis complete! Your results are ready to view.
          </p>
        </div>

        {/* Cronômetro circular */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
            {/* Trilha */}
            <circle cx="20" cy="20" r={radius}
              fill="none" stroke="#d1fae5" strokeWidth="3" />
            {/* Progresso */}
            <circle cx="20" cy="20" r={radius}
              fill="none" stroke="#059669" strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          {/* Número no centro */}
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-700">
            {seconds}
          </span>
        </div>
      </div>

      {/* Instruções */}
      <ol className="flex flex-col gap-2 text-sm text-emerald-700 pl-9 list-decimal list-outside">
        <li>
          Go to the <strong className="text-emerald-900">Results</strong> tab at the top of the page.
        </li>
        <li>
          Click{" "}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 font-semibold text-emerald-900 text-xs">
            <ViewIcon className="w-3.5 h-3.5" />
            {viewLabel}
          </span>
          {" "}to access your results.
        </li>
        <li>
          In the <strong className="text-emerald-900">Run</strong> dropdown, select:
          <span className="ml-1 font-mono text-xs bg-white border border-emerald-200 px-2 py-0.5 rounded-md text-emerald-900">
            {runName}
          </span>
        </li>
      </ol>

      {/* Botão */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onGoToResults}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition cursor-pointer">
          Go to Results
          <ArrowRight className="w-4 h-4" />
        </button>
        <span className="text-xs text-emerald-600">
          This notice will close automatically in {seconds}s
        </span>
      </div>

    </div>
  );
}