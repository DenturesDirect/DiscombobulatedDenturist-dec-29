import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import TopNav from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Key, Users, Shield } from "lucide-react";

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  const isAdmin = user?.role === 'admin';

  const { data: loginAttempts = [] } = useQuery<LoginAttempt[]>({
    queryKey: ['/api/admin/login-attempts'],
    enabled: isAdmin
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/change-password', {
        currentPassword,
        newPassword
      });
    },
    onSuccess: () => {
      toast({ title: "Password Changed", description: "Your password has been updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/reset-password', {
        email: resetEmail,
        newPassword: resetPassword
      });
    },
    onSuccess: () => {
      toast({ title: "Password Reset", description: `Password for ${resetEmail} has been reset.` });
      setResetEmail("");
      setResetPassword("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleResetPassword = () => {
    if (resetPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    resetPasswordMutation.mutate();
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (page: 'patients' | 'canvas' | 'todos') => {
    if (page === 'patients') {
      setLocation('/');
    } else if (page === 'todos') {
      setLocation('/todos');
    }
  };

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User' : 'User';

  const unauthorizedAttempts = loginAttempts.filter(a => !a.success);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        userName={userName}
        userRole={isAdmin ? "Admin" : "Staff"}
        notificationCount={unauthorizedAttempts.length}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentPage="patients"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-semibold">Settings</h1>

          <Tabs defaultValue="password">
            <TabsList>
              <TabsTrigger value="password" className="gap-2">
                <Key className="w-4 h-4" />
                Change Password
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="users" className="gap-2">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </TabsTrigger>
                  <TabsTrigger value="security" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Login Activity
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="password" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Your Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      data-testid="input-current-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      data-testid="input-confirm-password"
                    />
                  </div>
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending}
                    data-testid="button-change-password"
                  >
                    {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="users" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reset User Password</CardTitle>
                      <CardDescription>Reset a staff member's password</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">User Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="user@yourclinic.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          data-testid="input-reset-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reset-password">New Password</Label>
                        <Input
                          id="reset-password"
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          data-testid="input-reset-password"
                        />
                      </div>
                      <Button 
                        onClick={handleResetPassword}
                        disabled={resetPasswordMutation.isPending}
                        data-testid="button-reset-password"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Login Activity</CardTitle>
                      <CardDescription>Recent login attempts (last 100)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loginAttempts.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No login attempts recorded
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {loginAttempts.map(attempt => (
                            <div 
                              key={attempt.id} 
                              className="flex items-center justify-between p-3 rounded-md border"
                              data-testid={`login-attempt-${attempt.id}`}
                            >
                              <div className="flex items-center gap-3">
                                {attempt.success ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-destructive" />
                                )}
                                <div>
                                  <div className="font-medium">{attempt.email}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(attempt.createdAt), 'MMM d, yyyy h:mm a')}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={attempt.success ? "outline" : "destructive"}>
                                {attempt.success ? "Success" : "Failed"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
