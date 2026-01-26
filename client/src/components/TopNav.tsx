import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import mascotImage from "@assets/4dbde174-cea7-4870-9e8b-e390986a9b22-md_1766378992180.jpeg";

interface TopNavProps {
  userName: string;
  userRole: string;
  notificationCount?: number;
  isDark?: boolean;
  onThemeToggle?: () => void;
  onLogout?: () => void;
  onNavigate?: (page: 'patients' | 'canvas' | 'todos') => void;
  onSettings?: () => void;
  currentPage?: 'patients' | 'canvas' | 'todos';
}

export default function TopNav({ userName, userRole, notificationCount = 0, isDark, onThemeToggle, onLogout, onNavigate, onSettings, currentPage = 'patients' }: TopNavProps) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={mascotImage} alt="The Discombobulated Denturist" className="h-12 w-12 object-cover rounded-full border-2 border-primary/30 shadow-md ring-2 ring-primary/10 transition-transform hover:scale-105" data-testid="img-logo" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent pointer-events-none"></div>
          </div>
          <div className="hidden sm:block h-6 w-px bg-border"></div>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          <Button
            variant={currentPage === 'patients' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('patients')}
            className={currentPage === 'patients' ? 'shadow-sm' : ''}
            data-testid="nav-patients"
          >
            Active Patients
          </Button>
          <Button
            variant={currentPage === 'canvas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('canvas')}
            className={currentPage === 'canvas' ? 'shadow-sm' : ''}
            data-testid="nav-canvas"
          >
            Patient Canvas
          </Button>
          <Button
            variant={currentPage === 'todos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('todos')}
            className={currentPage === 'todos' ? 'shadow-sm' : ''}
            data-testid="nav-todos"
          >
            Staff To-Do
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="w-9 h-9 relative hover:bg-muted transition-colors"
          data-testid="button-notifications"
          onClick={() => console.log('Notifications clicked')}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground shadow-md animate-pulse">
              {notificationCount}
            </Badge>
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="w-9 h-9 hover:bg-muted transition-colors"
          onClick={onThemeToggle}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <div className="h-6 w-px bg-border mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-10 hover:bg-muted transition-colors" data-testid="button-user-menu">
              <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold">{userName}</div>
                <div className="text-xs text-muted-foreground">{userRole}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettings} data-testid="menu-settings" className="cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('My Tasks')} className="cursor-pointer">
              My Tasks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} data-testid="button-logout" className="cursor-pointer text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
