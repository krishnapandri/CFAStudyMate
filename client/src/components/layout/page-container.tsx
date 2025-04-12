import Sidebar from "./sidebar";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function PageContainer({ children, title, subtitle }: PageContainerProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar */}
      <Sidebar isMobile={true} />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <div className="mt-2 text-sm text-gray-500">
                  {subtitle}
                </div>
              )}
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
