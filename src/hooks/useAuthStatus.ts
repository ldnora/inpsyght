import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status");
        if (response.ok) {
          const { isAuthenticated } = await response.json();
          if (isMounted) {
            setIsLoggedIn(isAuthenticated);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (isMounted) {
          setIsLoggedIn(false);
        }
      } finally {
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isLoggedIn, isLoaded };
}
