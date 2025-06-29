import { ReactNode, useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Menu, X, Home, Send, Download, CreditCard, Settings, LogOut, WifiOff, Wifi, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { checkOnlineStatus, startOnlineStatusMonitor } from "@/utils/connectivity";
import { useIndexedDB } from "@/hooks/useIndexedDB";
import { useOfflineBalance } from "@/contexts/OfflineBalanceContext";
import { useAuth } from "@/contexts/AuthContext";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Initialize from localStorage if available
    const savedCollapsed = typeof window !== 'undefined' ? localStorage.getItem('sidebarCollapsed') : null;
    return savedCollapsed ? JSON.parse(savedCollapsed) : false;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize with the last known online status from localStorage if available
    const savedStatus = typeof window !== 'undefined' ? localStorage.getItem('onlineStatus') : null;
    return savedStatus ? savedStatus === 'true' : true;
  });
  const { refreshOfflineBalance } = useOfflineBalance();
  
  // Initialize IndexedDB for transaction syncing
  const indexedDB = useIndexedDB({
    dbName: 'greenleaf-finance',
    storeName: 'transactions'
  });

  // Toggle sidebar collapsed state and persist it
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  // Check online status only once when the component mounts
  useEffect(() => {
    let isMounted = true;
    let stopMonitoring: () => void;

    const initializeOnlineStatus = async () => {
      // Initial check
      const online = await checkOnlineStatus();
      if (isMounted) {
        setIsOnline(online);
        localStorage.setItem('onlineStatus', String(online));
      }

      // Start monitoring with 15-second interval
      stopMonitoring = startOnlineStatusMonitor(
        (status) => {
          if (isMounted) {
            setIsOnline(status);
            localStorage.setItem('onlineStatus', String(status));
          }
        }, 
        indexedDB, 
        refreshOfflineBalance,
        15000
      );
    };

    initializeOnlineStatus();

    // Clean up on unmount
    return () => {
      isMounted = false;
      if (stopMonitoring) stopMonitoring();
    };
  }, [indexedDB, refreshOfflineBalance]);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Send Money", path: "/send", icon: Send },
    { name: "Request Money", path: "/request", icon: Download },
    { name: "Offline Transactions", path: "/offline", icon: CreditCard },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 transform bg-white shadow-lg transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-greenleaf-600">NexaPay</h1>
          )}
          <button 
            onClick={toggleSidebarCollapsed}
            className="ml-auto rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="mt-6 px-3">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 mt-2 text-base rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-greenleaf-50 text-greenleaf-700 font-medium"
                  : "text-dark-light hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} className={cn("shrink-0", sidebarCollapsed ? "mx-auto" : "mr-3")} />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full border-t p-4">
          <button
            className={cn(
              "flex w-full items-center rounded-md px-4 py-3 text-dark-light hover:bg-gray-100",
              sidebarCollapsed && "justify-center"
            )}
            onClick={() => {
              const newStatus = !isOnline;
              setIsOnline(newStatus);
              localStorage.setItem('onlineStatus', String(newStatus));
            }}
          >
            {isOnline ? (
              <Wifi size={20} className={cn("text-greenleaf-500", sidebarCollapsed ? "mx-auto" : "mr-3")} />
            ) : (
              <WifiOff size={20} className={cn("text-gray-500", sidebarCollapsed ? "mx-auto" : "mr-3")} />
            )}
            {!sidebarCollapsed && (isOnline ? "Online" : "Offline")}
          </button>
          <button 
            className={cn(
              "flex w-full items-center rounded-md px-4 py-3 text-red-600 hover:bg-gray-100",
              sidebarCollapsed && "justify-center"
            )}
            onClick={handleLogout}
          >
            <LogOut size={20} className={sidebarCollapsed ? "mx-auto" : "mr-3"} />
            {!sidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn("flex flex-1 flex-col overflow-hidden")}>
        {/* Top navbar */}
        <header className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  className="text-gray-600 focus:outline-none lg:hidden"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                
                <Button
                  variant="ghost"
                  className="hidden lg:flex ml-4 p-2"
                  onClick={toggleSidebarCollapsed}
                >
                  {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </Button>
              </div>

              <div className="flex items-center">
                <div className={cn(
                  "flex items-center px-3 py-1 rounded-full text-xs font-medium",
                  isOnline 
                    ? "bg-greenleaf-100 text-greenleaf-700" 
                    : "bg-gray-200 text-gray-700"
                )}>
                  {isOnline ? (
                    <>
                      <Wifi size={14} className="mr-1" />
                      Online Mode
                    </>
                  ) : (
                    <>
                      <WifiOff size={14} className="mr-1" />
                      Offline Mode
                    </>
                  )}
                </div>
                
                {user && (
                  <div className="ml-4 text-sm font-medium text-gray-700">
                    {user.username}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content container */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;