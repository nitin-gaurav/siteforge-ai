import { useEffect, useState } from "react";
import { setProjectCacheUser } from "../services/projectCache.js";
import { supabase } from "../services/supabaseClient.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setProjectCacheUser(data.session?.user?.id);
        setSession(data.session);
      })
      .catch(() => {
        if (!mounted) return;
        setProjectCacheUser(null);
        setSession(null);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setProjectCacheUser(nextSession?.user?.id);
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, user: session?.user ?? null };
}
