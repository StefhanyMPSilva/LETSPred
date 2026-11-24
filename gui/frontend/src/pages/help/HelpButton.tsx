import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

export function HelpButton() {
  const location = useLocation();
  const isHelp = location.pathname === "/help";

  return (
    <Link
      to={isHelp ? "/" : "/help"}
      target={isHelp ? undefined : "_blank"}
      rel={isHelp ? undefined : "noopener noreferrer"}
      className="group fixed bottom-8 right-8 max-s780:bottom-4 max-s780:right-4 z-50 flex items-center gap-2 cursor-pointer"
    >
      {/* Label */}
      <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 bg-blue-600 text-white text-xl max-s1024:text-base font-semibold px-4 py-2 rounded-lg shadow-lg">
        {isHelp ? "Home" : "Help"}
      </span>

      {/* Bola flutuante */}
      <div className="w-20 h-20 max-s1024:w-14 max-s1024:h-14 max-s780:w-12 max-s780:h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
        {isHelp
          ? <Home className="w-8 h-8 max-s1024:w-6 max-s1024:h-6" />
          : <span className="text-5xl max-s1024:text-3xl max-s780:text-2xl font-bold leading-none">?</span>
        }
      </div>
    </Link>
  );
}