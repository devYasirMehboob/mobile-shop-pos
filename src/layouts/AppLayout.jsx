import { useState } from "react";
import { Outlet } from "react-router-dom";
import DreamsSidebar from "../components/layout/DreamsSidebar";
import DreamsTopbar from "../components/layout/DreamsTopbar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* DREAMS POS SIDEBAR */}
      <DreamsSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* MAIN CONTENT WRAPPER */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? "lg:ml-[84px]" : "lg:ml-[260px]"
        }`}
      >
        {/* DREAMS POS TOPBAR */}
        <DreamsTopbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onOpenMobileSidebar={() => setSidebarOpen(true)}
        />

        {/* PAGE CONTENT CONTAINER */}
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
