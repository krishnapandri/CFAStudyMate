import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  PanelsTopLeft, 
  BookOpen, 
  Clock, 
  BarChart2,
  Library,
  Tag,
  HelpCircle,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  if (!user) return null;
  
  const isAdmin = user.role === "admin";
  
  const routes = isAdmin 
    ? [
        { href: "/", label: "PanelsTopLeft", icon: PanelsTopLeft },
        { href: "/admin/chapters", label: "Manage Chapters", icon: Library },
        { href: "/admin/topics", label: "Manage Topics", icon: Tag },
        { href: "/admin/questions", label: "Manage Questions", icon: HelpCircle },
        { href: "/admin/users", label: "Users", icon: Users },
      ]
    : [
        { href: "/", label: "PanelsTopLeft", icon: PanelsTopLeft },
        { href: "/chapters", label: "Chapters", icon: BookOpen },
        { href: "/quiz", label: "Practice Quiz", icon: HelpCircle },
        { href: "/performance", label: "Performance", icon: BarChart2 },
      ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Mobile header with toggle button
  if (isMobile) {
    return (
      <>
        <div className="md:hidden bg-primary-dark text-white h-16 flex items-center px-4 w-full">
          <button 
            type="button" 
            onClick={toggleSidebar}
            className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-light"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold ml-2">CFA Level I</h1>
        </div>
        
        {/* Mobile sidebar (slide-in) */}
        <div className={cn(
          "fixed inset-0 z-50 transition-all duration-300 ease-in-out md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={toggleSidebar}
          />
          
          {/* Sidebar */}
          <div className={cn(
            "absolute top-0 left-0 h-full w-64 bg-primary text-white transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between h-16 px-4 bg-primary-dark">
                <h1 className="text-xl font-bold">CFA Level I</h1>
                <button 
                  type="button" 
                  onClick={toggleSidebar}
                  className="rounded-md text-white hover:bg-primary-light p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
                {routes.map((route) => (
                  <Link key={route.href} href={route.href}>
                    <a
                      className={cn(
                        "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                        location === route.href
                          ? "bg-primary-dark text-white"
                          : "text-white hover:bg-primary-light"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <route.icon className="mr-3 h-6 w-6" />
                      {route.label}
                    </a>
                  </Link>
                ))}
              </nav>
              
              <div className="flex-shrink-0 flex border-t border-primary-light p-4">
                <div className="flex items-center w-full">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs font-medium text-primary-light capitalize">{user.role}</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleLogout}
                    className="ml-auto flex-shrink-0 text-primary-light hover:text-white"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Desktop sidebar
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-primary text-white">
        <div className="flex flex-col flex-1">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-primary-dark">
            <h1 className="text-xl font-bold">CFA Level I</h1>
          </div>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {routes.map((route) => (
                <Link key={route.href} href={route.href}>
                  <a
                    className={cn(
                      "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                      location === route.href
                        ? "bg-primary-dark text-white"
                        : "text-white hover:bg-primary-light"
                    )}
                  >
                    <route.icon className="mr-3 h-6 w-6" />
                    {route.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-primary-light p-4">
            <div className="flex items-center w-full">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs font-medium text-primary-light capitalize">{user.role}</p>
              </div>
              <button 
                type="button" 
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 text-primary-light hover:text-white"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
