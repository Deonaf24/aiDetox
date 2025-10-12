import { useCallback, useEffect, useMemo, useState } from "react";
import {
  supabase,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  sendFriendRequest,
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from "../../supabaseClient";
import { FN_LEADERBOARDS } from "../constants";

async function fetchLeaderboard(session) {
  if (!session?.access_token) {
    return { entries: [], me: null, error: "login_required" };
  }
  const url = new URL(FN_LEADERBOARDS(SUPABASE_URL));
  url.searchParams.set("metric", "novisit");
  url.searchParams.set("scope", "friends");
  try {
    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    const json = await res.json().catch(() => null);
    if (res.status === 401) {
      return { entries: [], me: null, error: json?.error || "login_required" };
    }
    if (!res.ok) {
      throw new Error(json?.error || "request_failed");
    }
    return json;
  } catch (err) {
    return { entries: [], me: null, error: "network" };
  }
}

export function useFriends(session) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ entries: [], me: null, error: null });
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    if (!session?.user) {
      setFriends([]);
      setRequests([]);
      setLeaderboard({ entries: [], me: null, error: "login_required" });
      setStatus("ready");
      return;
    }

    setStatus("loading");
    const me = session.user.id;
    try {
      const friendRows = await getFriends(me);
      const friendIds = friendRows.map((row) => (row.owner === me ? row.friend : row.owner));
      let namedFriends = [];
      if (friendIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", friendIds);
        namedFriends = friendIds.map((id) => ({
          id,
          name: profiles?.find((p) => p.id === id)?.username || id,
        }));
      }
      setFriends(namedFriends);

      const reqRows = await getFriendRequests(me);
      let namedRequests = [];
      if (reqRows.length) {
        const ids = reqRows.map((r) => r.requester);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", ids);
        namedRequests = reqRows.map((req) => ({
          requester: req.requester,
          name: profiles?.find((p) => p.id === req.requester)?.username || req.requester,
        }));
      }
      setRequests(namedRequests);

      const lb = await fetchLeaderboard(session);
      setLeaderboard(lb);
    } finally {
      setStatus("ready");
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const addFriend = useCallback(
    async (username) => {
      if (!session?.user) {
        setFeedback({ type: "error", message: "Log in first." });
        return { ok: false };
      }
      if (!username) {
        setFeedback({ type: "error", message: "Enter a username." });
        return { ok: false };
      }
      const result = await sendFriendRequest(session.user.id, username.trim());
      if (result.error === "not_found") {
        setFeedback({ type: "error", message: "User not found." });
        return { ok: false };
      }
      if (result.error === "self") {
        setFeedback({ type: "error", message: "That's you!" });
        return { ok: false };
      }
      if (result.error) {
        setFeedback({ type: "error", message: "Could not send request." });
        return { ok: false };
      }
      setFeedback({ type: "success", message: "Request sent!" });
      await load();
      return { ok: true };
    },
    [session, load],
  );

  const respondToRequest = useCallback(
    async (requester, accept) => {
      if (!session?.user) return;
      if (accept) {
        await acceptFriendRequest(requester, session.user.id);
      } else {
        await declineFriendRequest(requester, session.user.id);
      }
      await load();
    },
    [session, load],
  );

  return useMemo(
    () => ({
      friends,
      requests,
      leaderboard,
      status,
      feedback,
      setFeedback,
      addFriend,
      respondToRequest,
      reload: load,
    }),
    [friends, requests, leaderboard, status, feedback, addFriend, respondToRequest, load],
  );
}
