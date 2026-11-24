import { BarChart4Icon, Upload } from "lucide-react";
import { PAGE_CONTAINER } from "../styles/layout";

interface NavbarProps {
  onSelectView: (view: "submission"| "dashboard") => void;
  activeView: "submission" | "dashboard";
}

export function Navbar({ onSelectView, activeView} : NavbarProps){
    return(
        <nav className={`${PAGE_CONTAINER} h-16 flex items-center justify-center gap-8 font-inter font-semibold text-[18px]`}>
              <div onClick={() => onSelectView("submission")} className={`flex items-center justify-center gap-2 w-full p-2 rounded-xl border cursor-pointer shadow-sm
                ${activeView === "submission" 
                  ? "bg-white border-blue-600 text-blue-600" 
                  : "border-gray-400 bg-white text-gray-400 hover:bg-gray-200"}`}>
                <Upload className="w-5 h-5"/>
                <p> Data Submission</p>
              </div>

              <div className="relative group w-full">
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg">
                  Results will be available after data submission.

                  {/* Arrow */}
                  <div className=" absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-blue-500" />
                </div>

                <div
                  onClick={() => onSelectView("dashboard")}
                  className={`flex items-center justify-center gap-2 w-full p-2 rounded-xl border cursor-pointer shadow-sm
                    ${activeView === "dashboard" 
                      ? "bg-white border-indigo-700 text-indigo-700" 
                      : "border-gray-400 bg-white text-gray-400 hover:bg-gray-200"
                    }`}
                >
                  <BarChart4Icon className="w-5 h-5" />
                  <p> Results </p>
                </div>
              </div>
          </nav>
    );
}