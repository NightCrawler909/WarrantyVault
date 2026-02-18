'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 px-8 py-4">
      <div className="flex justify-end items-center gap-4">
        <span className="text-sm text-neutral-600">{user?.email}</span>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
};
