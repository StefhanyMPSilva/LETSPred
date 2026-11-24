import { Home } from "./pages/home/Home";
import { Help } from "./pages/help/Help";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@components/Header";
import { HelpButton } from "./pages/help/HelpButton";

export function App(){

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/help" element={<Help />} />
      </Routes>

      <HelpButton />
    </BrowserRouter>
  );
}
