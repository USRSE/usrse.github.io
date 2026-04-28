import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HomePage } from "@/pages/HomePage";
import { MissionPage } from "@/pages/about/MissionPage";
import { WhatIsRSEPage } from "@/pages/about/WhatIsRSEPage";
import { DEIPage } from "@/pages/about/DEIPage";
import { GovernancePage } from "@/pages/about/GovernancePage";
import { ScrollToTop } from "@/components/ScrollToTop";

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen">
        <Nav />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about/mission" element={<MissionPage />} />
            <Route path="/about/what-is-an-rse" element={<WhatIsRSEPage />} />
            <Route path="/about/dei" element={<DEIPage />} />
            <Route path="/about/governance" element={<GovernancePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
