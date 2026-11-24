import { FileText } from "lucide-react";

interface PrefixFilesProps{
    prefix: string;
    setPrefix: (value: string) => void;
}

export function PrefixFiles({prefix, setPrefix}: PrefixFilesProps){
    return(
        <div className="w-full flex flex-col items-center px-8">
            <div className="flex items-center gap-2">
                <FileText className="text-blue-500 w-5 h-5" />
                <p className="font-inter font-semibold text-xl text-gray-600">Output Prefix</p>
            </div>

            <p className="mt-2 text-gray-500 font-inter">
                Specify a prefix for your output files (e.g., "experiment_01", "model_v2")
            </p>

            <div className="mt-2">
                <input
                    type="text"
                    placeholder="Ex: my_experiment"
                    value={prefix}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrefix(e.target.value)}
                    className="mt-1 w-full border border-zinc-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-gray-500 text-sm mt-2 font-inter">
                    <b>This prefix will be used in output filenames:</b>{" "}
                        {prefix || "prefix"}_prediction.csv, {prefix || "prefix"}_model.pkl, etc.
                </p>
            </div>
        </div>
    );
}