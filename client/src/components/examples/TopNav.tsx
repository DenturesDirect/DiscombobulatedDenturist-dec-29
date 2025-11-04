import { useState } from 'react';
import TopNav from '../TopNav';

export default function TopNavExample() {
  const [isDark, setIsDark] = useState(false);
  
  return (
    <TopNav 
      userName="Dr. Damien Smith"
      userRole="Dentist"
      notificationCount={3}
      isDark={isDark}
      onThemeToggle={() => setIsDark(!isDark)}
      onLogout={() => console.log('Logout')}
    />
  );
}
