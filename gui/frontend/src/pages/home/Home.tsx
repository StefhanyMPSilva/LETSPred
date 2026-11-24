import { TrainingFilesUploads } from "./components/TrainingFilesUploads";
import { useEffect, useRef, useState } from "react";

import { ModelConfiguration } from "./components/ModelConfiguration";
import { Results } from "../results/Results";
import { CheckCircle, X } from "lucide-react";
import { SelectingModel } from "./components/SelectingModel";
import { PrefixFiles } from "./components/PrefixFiles";
import { Navbar } from "@components/Navbar";
import { SuccessNotice } from "@components/SuccessNotice";
import { useModelList } from "@hooks/useModelList";
import { PAGE_CONTAINER } from "../../styles/layout";

export type SubmissionStepProps = "upload" | "model-config";
export type SelectModelUseProps = "createmodel" | "prebuildmodel" | "usermodel";
export type SelectModelConfiguration = Exclude<SelectModelUseProps, "createmodel">;

export function Home(){
    const [view, setView] = useState<"submission" | "dashboard">("submission");

    const [trainingFiles, setTrainingFiles] = useState<(File | null)[]>([null, null, null, null]);
    const [prefix, setPrefix] = useState("");
    const [selectedPrebuildTable, setSelectedPrebuildTable] = useState<string | null>(null);
    const [selectedUserModelTable, setSelectedUserModelTable] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<SelectModelUseProps>("createmodel");
    const [selectedModelTypes, setSelectedModelTypes] = useState<Set<string>>(new Set(["ALL"]));

    const [completedRunName, setCompletedRunName] = useState<string | null>(null);
    const [completedModelType, setCompletedModelType] = useState<SelectModelUseProps>("createmodel");

    const { models: userModels, tables: userModelTables, loadState: userModelsState, refetch: refetchUserModels } = useModelList("usermodel");
    const completedModelTypeRef = useRef<SelectModelUseProps>("createmodel");
    const hasUserModels = userModelsState === "success" && userModels.length > 0;

    // Submit habilitado quando:
    // - 4 arquivos + prefix preenchido
    // - se prebuildmodel ou usermodel: também precisa de tabela selecionada
    const isPredictMode  = selectedModel === "prebuildmodel" || selectedModel === "usermodel";
    const totalSlots     = isPredictMode ? 2 : 4;
    const allFilesFilled = trainingFiles.slice(0, totalSlots).every(Boolean);
    const baseValid = allFilesFilled && prefix.trim().length > 0;

    const isFormValid = baseValid && (
        selectedModel === "createmodel" ||
        (selectedModel === "prebuildmodel" && selectedPrebuildTable !== null) ||
        (selectedModel === "usermodel" && selectedUserModelTable !== null)
    );

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [progressLogs, setProgressLogs] = useState<string[]>([]);

    const [showSuccessNotice, setShowSuccessNotice] = useState(false);
    const [noticeSeconds, setNoticeSeconds] = useState(15);

    useEffect(() => {
        if (submitSuccess && completedModelTypeRef.current === "createmodel") {
            refetchUserModels();
        }
    }, [submitSuccess]);

    async function handleSubmit() {
        setSubmitError(null);
        setSubmitSuccess(false);
        setProgressLogs([]);
        setIsLoading(true);

        const formData = new FormData();
        if (isPredictMode) {
            formData.append("actives_datawarrior",  trainingFiles[0]!);
            formData.append("actives_consolidated", trainingFiles[1]!);
        } else {
            formData.append("actives_datawarrior",  trainingFiles[0]!);
            formData.append("decoys_datawarrior",   trainingFiles[1]!);
            formData.append("actives_consolidated", trainingFiles[2]!);
            formData.append("decoys_consolidated",  trainingFiles[3]!);
        }
        formData.append("output_prefix", prefix);
        formData.append("model_type", selectedModel);

        if (selectedModel === "prebuildmodel" && selectedPrebuildTable) {
            formData.append("prebuild_table_id", selectedPrebuildTable);
        }

        if (selectedModel === "usermodel" && selectedUserModelTable) {
            formData.append("user_run_id", selectedUserModelTable);
        }

        const modelsValue = selectedModelTypes.has("ALL") 
            ? "ALL" 
            : Array.from(selectedModelTypes).join(",");
        formData.append("selected_models", modelsValue);

        try {
            const response = await fetch("/models/run", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                setSubmitError(error.detail ?? "An unexpected error occurred.");
                return;
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value);
                const lines = text.split("\n").filter(l => l.startsWith("data: "));

                for (const line of lines) {
                    const message = line.replace("data: ", "").trim();
                    if (!message) continue;
                    if (message.startsWith("ERROR:")) {
                        setSubmitError(message.replace("ERROR: ", ""));
                        return;
                    }
                    if (message === "DONE") {
                        setSubmitSuccess(true);
                        setShowSuccessNotice(true);
                        setNoticeSeconds(15);
                        completedModelTypeRef.current = selectedModel;
                        setCompletedModelType(selectedModel);

                        // extrair o run name do último log
                        // Ex: "Pipeline complete! Results saved to: /path/EGFR-20260501_1430"
                        setProgressLogs(prev => {
                            const lastLog = prev[prev.length - 1] ?? "";
                            const match = lastLog.match(/([^/\s]+)$/);
                            if (match) setCompletedRunName(match[1]);
                            return prev;
                        });

                        break;
                    }
                    setProgressLogs(prev => [...prev, message]);
                }
            }

        } catch {
            setSubmitError("Could not connect to the server. Check if the backend is running.");
        } finally {
            setTrainingFiles([null, null, null, null]);
            setPrefix("");
            setSelectedPrebuildTable(null);
            setSelectedUserModelTable(null);  
            setSelectedModelTypes(new Set(["ALL"]));
            setSelectedModel("createmodel");
            setIsLoading(false);             
        }
    }

    return(
        <>
            <main className="px-4 md:px-6">
                <Navbar onSelectView={(v) => setView(v)} activeView={view} />

                {view === "submission" && (
                    // Home.tsx — container principal
                    <section className={`${PAGE_CONTAINER} border border-blue-300 bg-white my-2 p-8 rounded-xl flex flex-col gap-4 shadow-2xl`}>
                        <SelectingModel
                            selectedModel={selectedModel}
                            hasUserModels={hasUserModels}
                            onSelectModel={(model) => {
                                setSelectedModel(model);
                                setSelectedPrebuildTable(null);
                                setTrainingFiles([null, null, null, null]);
                            }}
                        />

                        <div className="w-full md:w-96 h-px bg-gray-300 mx-auto my-4"></div>

                        <TrainingFilesUploads
                            externalFiles={trainingFiles}
                            onFilesChange={setTrainingFiles}
                            onError={setSubmitError}
                            selectedModel={selectedModel}
                        />

                        {/* Feedback de erro / sucesso */}
                        {submitError && (
                            <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">
                                <X className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Invalid file detected</p>
                                    <p className="text-red-500 mt-0.5">{submitError}</p>
                                </div>
                            </div>
                        )}

                        <div className="w-full md:w-96 h-px bg-gray-300 mx-auto my-4"></div>

                        <PrefixFiles 
                            prefix={prefix}
                            setPrefix={setPrefix}
                        />

                        
                        {(selectedModel === "prebuildmodel" || selectedModel === "usermodel") && (
                            <ModelConfiguration
                                selectedModel={selectedModel}
                                selectedPrebuildTable={selectedPrebuildTable}
                                setSelectedPrebuildTable={setSelectedPrebuildTable}
                                selectedUserModelTable={selectedUserModelTable}      
                                setSelectedUserModelTable={setSelectedUserModelTable}
                                selectedModelTypes={selectedModelTypes}         
                                onSelectedModelTypes={setSelectedModelTypes} 
                                userModelTables={userModelTables}       
                                userModelsLoadState={userModelsState}
                            />
                        )}

                        <div className="w-full md:w-96 h-px bg-gray-300 mx-auto my-4"></div>

                        {/* Submit dentro da section principal */}
                        <section className="flex justify-center">
                            <button type="button" onClick={handleSubmit} disabled={!isFormValid} className={`w-full md:w-56 flex items-center justify-center gap-2 p-4 rounded-lg font-semibold ${isFormValid ? "bg-linear-to-r from-[#2563eb] to-[#7c3aed] text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                                <CheckCircle />
                                <p>Submit</p>
                            </button>
                        </section>

                        {(isLoading || submitSuccess) && (
                            <div className="border border-indigo-400 rounded-lg p-8 flex flex-col gap-4">

                                {/* Barra de progresso */}
                                {(() => {
                                    const TOTAL_STEPS = selectedModel === "createmodel" ? 6 : 4;
                                    const current = progressLogs.filter(l => l.startsWith("[")).length;
                                    const percent = submitSuccess ? 100 : Math.round((current / TOTAL_STEPS) * 100);

                                    return (
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>{submitSuccess ? "Pipeline complete!" : "Running pipeline..."}</span>
                                                <span>{percent}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${
                                                        submitSuccess
                                                        ? "bg-emerald-500"
                                                        : "bg-blue-500"
                                                    }`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Logs */}
                                <div className="bg-gray-950 rounded-md p-4 font-mono text-xs text-gray-300 flex flex-col gap-1 max-h-48 overflow-y-auto">
                                    {progressLogs.map((log, i) => (
                                        <span key={i} className={log.startsWith("Pipeline complete") ? "text-orange-400" : log.includes("/6]") ? "text-emerald-400" : "text-gray-300"}> {log} </span>
                                    ))}
                                    {isLoading && (
                                        <span className="text-gray-500 animate-pulse">▋</span>
                                    )}
                                </div>
                                {submitSuccess && completedRunName && showSuccessNotice &&(
                                    <SuccessNotice
                                        runName={completedRunName}
                                        modelType={completedModelType}
                                        onGoToResults={() => setView("dashboard")}
                                        onDismiss={() => setShowSuccessNotice(false)}
                                        seconds={noticeSeconds}                       
                                        onSecondsChange={setNoticeSeconds}
                                    />
                                )}
                            </div>
                        )}

                    </section>
                )}

                {view === "dashboard" && (
                    <section className={`${PAGE_CONTAINER} bg-white my-4 p-8 rounded-3xl`}>
                        <Results onUserModelDeleted={refetchUserModels} />
                    </section>
                )}
            </main>
        </>
    );
}