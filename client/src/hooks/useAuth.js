import { useEffect, useState } from "react";
import { fetchProjects, setProjectCacheUser } from "../services/projectCache.js";
import { supabase } from "../services/supabaseClient.js";

function warmProjectCache(session) {
  if (!session?.user?.id) return;
  fetchProjects().catch(() => {
    // The protected pages still handle project load errors in context.
  });
}

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (!data.session) {
          setProjectCacheUser(null);
          setSession(null);
          return;
        }

        const { error } = await supabase.auth.getUser();
        if (!mounted) return;
        if (error) {
          await supabase.auth.signOut().catch(() => {});
          setProjectCacheUser(null);
          setSession(null);
          return;
        }

        setProjectCacheUser(data.session.user?.id);
        warmProjectCache(data.session);
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
      warmProjectCache(nextSession);
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
