import { Database, FileBox, FilePlus2, FileUser } from "lucide-react";
import { type ReactNode } from "react";
import type { SelectModelUseProps } from "../Home";

interface ModelCardProps{
    select: SelectModelUseProps;
    isSelected: boolean;
    icon: ReactNode;
    title: string;
    description: string;
    onSelectModelUse: (select:SelectModelUseProps) => void;
    disabled?: boolean;
}

export interface SelectingModelProps {
  selectedModel: SelectModelUseProps;
  onSelectModel: (model: SelectModelUseProps) => void;
  hasUserModels: boolean;
}

/**
 * Componente de card para exibição de opção de modelo
 * Renderiza um card interativo com ícone, título e descrição
 */
function ModelCard({ icon, title, description, select, isSelected, onSelectModelUse, disabled }: ModelCardProps) {
    return (
        <div
            onClick={() => !disabled && onSelectModelUse(select)}
            className={`p-4 border rounded-xl flex flex-col gap-2 transition-all duration-200 ease-out justify-center
                ${disabled
                    ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-50"
                    : isSelected
                        ? "border-green-600 shadow-xl bg-green-100 cursor-pointer hover:scale-102 hover:shadow-lg"
                        : "border-blue-500 cursor-pointer hover:scale-102 hover:shadow-lg"
                }`}
        >
            <div className="flex items-center gap-2">
                <div className={`w-12 h-12 grid place-items-center rounded-xl ${
                    disabled ? "text-gray-400 bg-gray-200"
                    : isSelected ? "text-green-600 bg-gray-50"
                    : "text-blue-500 bg-blue-200"
                }`}>
                    {icon}
                </div>
                <p className={`font-poppins font-semibold text-xl ${
                    disabled ? "text-gray-400"
                    : isSelected ? "text-green-600"
                    : "text-blue-500"
                }`}>
                    {title}
                </p>
            </div>
            <p className="text-sm text-gray-500">{description}</p>
            {disabled && (
                <p className="text-xs text-gray-500 mt-1">
                    No models available. Train a model first.
                </p>
            )}
        </div>
    );
}

/**
 * Componente principal para seleção do tipo de modelo
 * Apresenta três opções: Criar novo modelo, Modelos pré-construídos e Modelo do usuário
 */
export function SelectingModel({selectedModel, onSelectModel, hasUserModels } : SelectingModelProps){
    return(
        <section className="w-full gap-4 px-6 my-4 rounded-lg">
            <div className="mb-6 flex flex-col items-center">
                <div className="flex items-center gap-2">
                    <Database className="text-blue-500 w-5 h-5"/>
                    <p className="font-inter font-semibold text-xl text-gray-600"> Model Configuration</p>
                </div>

                <p className="text-gray-500 font-inter mt-2">Please select one of the options below to create a new model or use an existing model.</p>
            </div>

            <section className="w-full flex justify-center gap-8">
                <ModelCard
                    select="createmodel"
                    icon={<FilePlus2 className="w-6 h-6"/>}
                    title="Create New Model"
                    description="Train a custom model from scratch using uploaded data"
                    isSelected={selectedModel === "createmodel"}
                    onSelectModelUse={onSelectModel}
                />

                <ModelCard 
                        select="prebuildmodel"
                        icon={<FileBox className="w-6 h-6"/>}
                        title="Pre-trained Models"
                        description="Select from our library of high-perfomance models"
                        isSelected={selectedModel === "prebuildmodel"}
                        onSelectModelUse={onSelectModel}
                />

                <ModelCard 
                        select="usermodel"
                        icon={<FileUser className="w-6 h-6"/>}
                        title="User Model"
                        description="Access your previously generated scientific models"
                        isSelected={selectedModel === "usermodel"}
                        onSelectModelUse={onSelectModel}
                        disabled={!hasUserModels}
                /> 
            </section>    
        </section>
    );
}