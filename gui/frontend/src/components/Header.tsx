import { Link } from "react-router-dom";
import Logo from "../assets/logo.svg";



export function Header(){
    return(
      <header className="mt-8 mb-4 flex flex-col gap-8">
        <div className="px-4">
          <Link to="/" className="flex items-end justify-center">
            {/* <img src={Logo} alt="logo" className="w-180" /> */}
            <img src={Logo} alt="logo" className="w-120" />
            {/* <p className="text-6xl font-semibold font-inter bg-linear-to-r from-[#225b8d] to-[#7c3aed] bg-clip-text text-transparent">
               LETSPred
            </p> */}
          </Link>
              
          {/* <nav className="mx-auto w-fit flex items-center gap-8 px-7 py-1 bg-white rounded-full border border-gray-200 shadow-sm mt-4">
            <a href="/guide" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 py-1 transition-all">
              <BookOpenText className="h-5 w-5 text-orange-400" />
              <span className="text-xl font-semibold font-inter text-gray-600 hover:text-gray-500">Guide</span>
            </a>
            <a href="/contact" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 py-1 transition-all">
              <UserRoundPen className="h-5 w-5 text-emerald-600" />
              <span className="text-xl font-semibold font-inter text-gray-600 hover:text-gray-500"> Contact </span>
            </a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 py-1 transition-all">
              <Github className="h-5 w-5 text-indigo-600" />
              <span className="text-xl font-semibold font-inter text-gray-600 hover:text-gray-500">Github</span>
            </a>
          </nav> */}
        </div>
        </header>
    );
}