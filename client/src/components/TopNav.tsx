import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

export interface TopNavNotification {
  id: string;
  title: string;
  description?: string;
}

const SEEN_NOTIFICATIONS_SESSION_KEY = "topnav_seen_notification_ids";

function loadSeenNotificationIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SEEN_NOTIFICATIONS_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveSeenNotificationIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SEEN_NOTIFICATIONS_SESSION_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage errors; UI still works in-memory
  }
}

interface TopNavProps {
  userName: string;
  userRole: string;
  notificationCount?: number;
  notifications?: TopNavNotification[];
  onNotificationClick?: (notification: TopNavNotification) => void;
  isDark?: boolean;
  onThemeToggle?: () => void;
  onLogout?: () => void;
  onNavigate?: (page: 'patients' | 'canvas' | 'todos') => void;
  onSettings?: () => void;
  currentPage?: 'patients' | 'canvas' | 'todos';
}

export default function TopNav({
  userName,
  userRole,
  notificationCount = 0,
  notifications = [],
  onNotificationClick,
  isDark,
  onThemeToggle,
  onLogout,
  onNavigate,
  onSettings,
  currentPage = 'patients'
}: TopNavProps) {
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
  const [seenNotificationIds, setSeenNotificationIds] = useState<string[]>(() => loadSeenNotificationIds());

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => !seenNotificationIds.includes(notification.id)),
    [notifications, seenNotificationIds]
  );

  const displayedNotificationCount = notifications.length > 0 ? visibleNotifications.length : notificationCount;

  const markNotificationsSeen = (ids: string[]) => {
    if (ids.length === 0) return;
    setSeenNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...ids]));
      saveSeenNotificationIds(merged);
      return merged;
    });
  };

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-28 rounded-md border border-primary/25 bg-background/80 px-2 shadow-sm ring-1 ring-primary/10">
            <img
              src="/brand-logo.png"
              alt="DentureFlow Pro 2.0"
              className="h-full w-full object-contain transition-transform hover:scale-105"
              data-testid="img-logo"
            />
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="w-9 h-9 relative hover:bg-muted transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="w-4 h-4" />
              {displayedNotificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground shadow-md animate-pulse">
                  {displayedNotificationCount > 99 ? "99+" : displayedNotificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {visibleNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    markNotificationsSeen(visibleNotifications.map((n) => n.id));
                  }}
                >
                  Mark all seen
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            {visibleNotifications.length === 0 ? (
              <DropdownMenuItem disabled>
                You're all caught up.
              </DropdownMenuItem>
            ) : (
              visibleNotifications.slice(0, 8).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="cursor-pointer whitespace-normal py-3"
                  onClick={() => {
                    markNotificationsSeen([notification.id]);
                    onNotificationClick?.(notification);
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium leading-tight">{notification.title}</span>
                    {notification.description && (
                      <span className="text-xs text-muted-foreground leading-tight">{notification.description}</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
