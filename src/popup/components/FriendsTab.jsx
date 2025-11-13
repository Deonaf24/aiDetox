import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { useFriends } from "../hooks/useFriends";

export function FriendsTab({ session }) {
  const friends = useFriends(session);
  const [username, setUsername] = useState("");

  const handleAdd = async (event) => {
    event.preventDefault();
    const result = await friends.addFriend(username);
    if (result.ok) {
      setUsername("");
    }
  };

  return (
    <div className="grid gap-3">
      <Card>
        <CardHeader>
          <CardTitle>Days without AI</CardTitle>
          <CardDescription>Compare streaks with friends who avoided AI tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <Leaderboard leaderboard={friends.leaderboard} onReload={friends.reload} loading={friends.status === "loading"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add friend</CardTitle>
          <CardDescription>Invite friends by their Stop LLMs username.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <Button type="submit" variant="secondary" className="sm:w-auto">
              Send request
            </Button>
          </form>
          {friends.feedback ? (
            <p
              className={
                friends.feedback.type === "success"
                  ? "mt-2 text-sm text-emerald-600"
                  : "mt-2 text-sm text-destructive"
              }
            >
              {friends.feedback.message}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Friend requests</CardTitle>
            <CardDescription>Approve or decline incoming requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <RequestList
              requests={friends.requests}
              onRespond={friends.respondToRequest}
              disabled={friends.status === "loading"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Your accountability circle.</CardDescription>
          </CardHeader>
          <CardContent>
            <FriendList friends={friends.friends} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Leaderboard({ leaderboard, onReload, loading }) {
  if (leaderboard.error === "login_required") {
    return <EmptyState message="Sign in to see your friends leaderboard." />;
  }
  if (leaderboard.error === "network") {
    return (
      <div className="space-y-4">
        <EmptyState message="Couldn&apos;t load leaderboard. Check your connection." />
        <Button variant="secondary" onClick={onReload} disabled={loading}>
          Retry
        </Button>
      </div>
    );
  }
  if (!leaderboard.entries?.length) {
    return <EmptyState message="No data yet." />;
  }
  return (
    <div className="space-y-3">
      {leaderboard.entries.map((entry, index) => (
        <div
          key={entry.id ?? index}
          className={`flex items-center justify-between rounded-2xl border border-border/80 bg-muted/50 px-4 py-3 ${
            leaderboard.me && leaderboard.me.id === entry.id ? "ring-2 ring-brand/60" : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <Badge variant="outline">#{index + 1}</Badge>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {entry.name || "Unnamed"}
              </span>
              <span className="text-xs text-muted-foreground">{entry.val} days off AI</span>
            </div>
          </div>
          {leaderboard.me && leaderboard.me.id === entry.id ? (
            <Badge variant="success">You</Badge>
          ) : null}
        </div>
      ))}
      {leaderboard.me &&
      leaderboard.entries.every((entry) => entry.id !== leaderboard.me.id) ? (
        <div className="rounded-2xl border border-dashed border-brand/50 bg-brand/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">#{leaderboard.me.rank}</p>
              <p className="text-xs text-muted-foreground">{leaderboard.me.name || "You"}</p>
            </div>
            <Badge variant="success">{leaderboard.me.val} days</Badge>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FriendList({ friends }) {
  if (!friends.length) {
    return <EmptyState message="No friends yet." />;
  }
  return (
    <ul className="space-y-2 text-sm">
      {friends.map((friend) => (
        <li key={friend.id} className="flex items-center justify-between rounded-xl border border-border/80 px-4 py-2">
          <span className="font-medium text-foreground">{friend.name}</span>
          <span className="text-xs text-muted-foreground">{friend.id.slice(0, 8)}…</span>
        </li>
      ))}
    </ul>
  );
}

function RequestList({ requests, onRespond, disabled }) {
  if (!requests.length) {
    return <EmptyState message="No friend requests." />;
  }
  return (
    <ul className="space-y-2 text-sm">
      {requests.map((req) => (
        <li key={req.requester} className="flex items-center justify-between rounded-xl border border-border/80 px-4 py-2">
          <span className="font-medium text-foreground">{req.name}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRespond(req.requester, true)}
              disabled={disabled}
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRespond(req.requester, false)}
              disabled={disabled}
            >
              Decline
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
