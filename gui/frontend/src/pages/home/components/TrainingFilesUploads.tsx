import { CheckCircle, FileText, Upload, X } from "lucide-react";
import type { SelectModelUseProps } from "../Home";

interface TrainingFilesProps {
    externalFiles: (File | null)[];
    onFilesChange: (files: (File | null)[]) => void;
    onError: (message: string) => void;
    selectedModel: SelectModelUseProps;
}

const ALLOWED_TYPES = ["text/plain", "text/csv", "application/vnd.ms-excel"];
const ALLOWED_EXTENSIONS = [".csv", ".txt"];

const LABELS_TRAINER = ['DataWarrior active', 'DataWarrior decoy', 'Gold active', 'Gold decoy'];
const LABELS_PREDICT = ['DataWarrior active', 'Gold active']


//trocando os states pelos props
export function TrainingFilesUploads({ externalFiles, onFilesChange, onError, selectedModel }: TrainingFilesProps){
    const isPredictMode = selectedModel === "prebuildmodel" || selectedModel === "usermodel";
    const totalSlots = isPredictMode ? 2 : 4;
    const labels = isPredictMode ? LABELS_PREDICT : LABELS_TRAINER;

    const handleFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Verifica se o nome já existe em outro slot
        const isDuplicate = externalFiles.some(
            (existing, i) => i !== index && existing?.name === file.name
        );

        if (isDuplicate) {
            onError(`File "${file.name}" has already been uploaded in another slot.`);
            e.target.value = "";
            return;
        }

        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        const validExtension = ALLOWED_EXTENSIONS.includes(extension);
        const validType = ALLOWED_TYPES.includes(file.type) || file.type === "";

        if (!validExtension || !validType) {
            onError(`Invalid file: ${file.name}.\nOnly .csv and .txt are allowed.`);
            e.target.value = "";
            return;
        }

        const updated = [...externalFiles];
        updated[index] = file;
        onFilesChange(updated);
    };

    const removeFile = (index: number) => {
        const updated = [...externalFiles];
        updated[index] = null;
        onFilesChange(updated);
    };

    const filledCount = externalFiles.slice(0, totalSlots).filter(Boolean).length;
    
    return (
        <div className="w-full p-2 rounded-lg">
            <section className="px-16">
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        <Upload className="text-blue-500 w-5 h-5" />
                        <p className="font-inter font-semibold text-xl text-gray-600">Training Files Uploads</p>
                    </div>

                    <p className={`text-sm ${filledCount === totalSlots ? "text-emerald-600" : ""} my-2`}>
                        {filledCount}/{totalSlots} files
                    </p>

                    <p className="text-gray-500 font-inter">
                        {isPredictMode
                            ? "Upload 2 files: DataWarrior and Gold actives."
                            : "Upload exactly 4 files for model training (Gold and DataWarrior active/decoy files)."}
                    </p>
                </div>

                <div className="grid gap-3 mt-4 grid-cols-2 max-w-[1200px] mx-auto">
                    {Array.from({ length: totalSlots }).map((_, i) => {
                        const file = externalFiles[i];
                        return (
                            <label key={i}
                                className={`relative flex flex-col items-center justify-center gap-2 p-6 h-42 rounded-lg border-2 border-dashed cursor-pointer transition
                                    ${file ? "border-emerald-500 bg-emerald-500/10" : "border-gray-300 hover:border-gray-400"}`}
                            >
                                {file ? (
                                    <>
                                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">{labels[i]}</span>
                                        <div className="flex items-center gap-2 w-full bg-white border border-gray-200 rounded-md px-2 py-1">
                                            <span className="text-xs text-gray-400 uppercase">{file.name.split(".").pop()}</span>
                                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                            <span className="text-xs text-gray-600 truncate flex-1">{file.name}</span>
                                            <button type="button"
                                                onClick={(e) => { e.preventDefault(); removeFile(i); }}
                                                className="text-red-400 hover:text-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <span className="text-gray-500">{labels[i]}</span>
                                        <span className="text-xs text-gray-400">CSV, TXT</span>
                                        <input type="file" accept=".csv,.txt" className="hidden"
                                            onChange={(e) => handleFile(i, e)}
                                        />
                                    </>
                                )}
                            </label>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}