import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Bell, LogOut, X } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="glass border-b border-white/10 sticky top-0 z-50">
      <div className="px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-sm sm:text-lg">📁</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white">
              <span className="hidden sm:inline">AnimalDrive</span>
              <span className="sm:hidden">Drive</span>
            </h1>
          </div>

          {/* Search Bar - Hidden on mobile, shown as expandable */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4 lg:mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 bg-white/10 border-white/20 rounded-xl sm:rounded-2xl text-white placeholder:text-white/60 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                placeholder="Search files..."
              />
            </div>
          </div>

          {/* Mobile Search & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2"
            >
              {showMobileSearch ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
            </Button>
            
            {/* Notifications - Hidden on mobile */}
            <Button variant="ghost" size="sm" className="hidden sm:flex relative text-white/80 hover:text-white hover:bg-white/10 rounded-xl">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></span>
            </Button>
            
            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={user?.firstName || "User"} 
                    />
                    <AvatarFallback className="gradient-primary text-white">
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white/20"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "User"
                      }
                    </p>
                    <p className="text-xs text-neutral-500">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => window.location.href = '/api/logout'}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        {showMobileSearch && (
          <div className="md:hidden px-4 pb-3 border-t border-white/10">
            <div className="relative mt-3">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-white/60" />
              </div>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border-white/20 rounded-xl text-white placeholder:text-white/60 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                placeholder="Search your files..."
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
