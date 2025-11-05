import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import logoUrl from "@assets/DenturesDirect Logo Design_1762294635743.png";

interface TopNavProps {
  userName: string;
  userRole: string;
  notificationCount?: number;
  isDark?: boolean;
  onThemeToggle?: () => void;
  onLogout?: () => void;
  onNavigate?: (page: 'patients' | 'canvas' | 'todos') => void;
  currentPage?: 'patients' | 'canvas' | 'todos';
}

export default function TopNav({ userName, userRole, notificationCount = 0, isDark, onThemeToggle, onLogout, onNavigate, currentPage = 'patients' }: TopNavProps) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <img src={logoUrl} alt="Dentures Direct" className="h-12" data-testid="img-logo" />
        <div className="flex gap-1">
          <Button
            variant={currentPage === 'patients' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('patients')}
            data-testid="nav-patients"
          >
            Active Patients
          </Button>
          <Button
            variant={currentPage === 'canvas' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('canvas')}
            data-testid="nav-canvas"
          >
            Patient Canvas
          </Button>
          <Button
            variant={currentPage === 'todos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate?.('todos')}
            data-testid="nav-todos"
          >
            Staff To-Do
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          className="w-9 h-9 relative"
          data-testid="button-notifications"
          onClick={() => console.log('Notifications clicked')}
        >
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
              {notificationCount}
            </Badge>
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="w-9 h-9"
          onClick={onThemeToggle}
          data-testid="button-theme-toggle"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 h-10" data-testid="button-user-menu">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-sm">{initials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium">{userName}</div>
                <div className="text-xs text-muted-foreground">{userRole}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log('Settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('My Tasks')}>
              My Tasks
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} data-testid="button-logout">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
