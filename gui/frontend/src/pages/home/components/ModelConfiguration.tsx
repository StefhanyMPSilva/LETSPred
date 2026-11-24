import { FileBox, FileUser, PackageX } from "lucide-react";
import { PreBuildModelTable } from "./PreBuildModelTable";
import type { SelectModelUseProps } from "../Home";
import { UserModelTable } from "./UserModelTable";
import type { LoadStateProps } from "@mytypes/global";

interface ModelConfigurationProps {
    selectedModel: Exclude<SelectModelUseProps, "createmodel">;
    selectedPrebuildTable: string | null;
    setSelectedPrebuildTable: (id: string | null) => void;
    selectedUserModelTable: string | null;            
    setSelectedUserModelTable: (id: string | null) => void;
    selectedModelTypes: Set<string>;
    onSelectedModelTypes: (m: Set<string>) => void;  
    userModelTables: { id: string; title: string; csvPath: string }[];  
    userModelsLoadState: LoadStateProps;
}

/**
 * Componente de configuração do modelo
 * Gerencia a interface específica para cada tipo de modelo selecionado
 * e controla a navegação entre etapas (voltar/enviar)
 */
export function ModelConfiguration({selectedModel, selectedPrebuildTable, setSelectedPrebuildTable, selectedUserModelTable, setSelectedUserModelTable, selectedModelTypes, onSelectedModelTypes, userModelTables, userModelsLoadState}: ModelConfigurationProps){
    return(
        <>
            <div className="w-96 h-px bg-gray-300 mx-auto my-4"></div>

            <div className="p-8 border border-blue-300 rounded-lg">
                    {/* Seção para Modelos Pré-construídos */}
                    {selectedModel === "prebuildmodel" && (
                        <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <FileBox className="w-6 h-6 text-blue-500" />
                            <p className="text-xl font-poppins font-semibold text-blue-500">Pre-trained Models</p>
                        </div>
                        <PreBuildModelTable
                            selectedTableId={selectedPrebuildTable}
                            onSelectTable={setSelectedPrebuildTable}
                            selectedModelTypes={selectedModelTypes}
                            onSelectModelTypes={onSelectedModelTypes}  
                        />
                    </section>
                    )}

                    {/* Seção para Modelos do Usuário (em desenvolvimento) */}
                    {selectedModel === "usermodel" && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                        <FileUser className="w-6 h-6 text-blue-500" />
                        <p className="text-xl font-poppins font-semibold text-blue-500">User Model</p>
                        </div>

                        {/* Sem modelos ainda */}
                        {userModelsLoadState === "success" && userModelTables.length === 0 && (
                        <section className="grid place-items-center font-inter">
                            <div className="w-24 h-24 p-2 bg-blue-200 grid place-items-center rounded-full mb-4">
                            <PackageX className="text-blue-500 w-12 h-12" />
                            </div>
                            <p className="text-blue-500 text-xl font-semibold mb-2">No User Models Found</p>
                            <p className="text-gray-500 text-sm mb-8">
                            You haven't saved any models yet. Start by training a new model
                            </p>
                        </section>
                        )}

                        {/* Com modelos disponíveis */}
                        {userModelsLoadState === "success" && userModelTables.length > 0 && (
                        <UserModelTable
                            selectedTableId={selectedUserModelTable}
                            onSelectTable={setSelectedUserModelTable}
                            tables={userModelTables}
                            selectedModelTypes={selectedModelTypes}
                            onSelectModelTypes={onSelectedModelTypes}
                        />
                        )}

                        {userModelsLoadState === "loading" && (
                        <p className="text-gray-400 text-sm text-center">Loading models...</p>
                        )}

                        {userModelsLoadState === "error" && (
                        <p className="text-red-400 text-sm text-center">Failed to load user models.</p>
                        )}
                    </section>
                    )}
            </div>
        </>
    );
}