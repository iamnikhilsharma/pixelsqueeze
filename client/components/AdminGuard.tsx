import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function withAdminAuth<P extends object>(Wrapped: React.ComponentType<P>): React.FC<P> {
  const Guarded: React.FC<P> = (props: P) => {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined') return; // SSR safeguard
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.replace('/admin/login');
        return;
      }
      try {
        const user = JSON.parse(userStr);
        if (!user.isAdmin) {
          router.replace('/');
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace('/admin/login');
      }
    }, []);

    if (!authorized) return null;
    return <Wrapped {...(props as P)} />;
  };
  return Guarded;
}
