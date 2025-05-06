import React, { useRef, useLayoutEffect, useEffect, useState } from "react";
import { toast } from "sonner";
import MessageItem from "@/components/MessageItem";
import { Button } from "@/components/ui/button";
import {
  fetchAllGroups,
  requestToJoinGroup,
  leaveGroup,
  Group,
} from "@/services/groupService";
import { useAuth } from "@/hooks/useAuth";
import { Message } from "@/services/messageService";

interface MessageListProps {
  messages: Message[];
  currentGroup: { id: string; name: string; description?: string } | null;
  loading: boolean;
  userId: string | undefined;
}

const MessageList = ({
  messages,
  currentGroup,
  loading,
  userId,
}: MessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [joinRequestLoading, setJoinRequestLoading] = useState<
    Record<string, boolean>
  >({});
  const [leaveGroupLoading, setLeaveGroupLoading] = useState<
    Record<string, boolean>
  >({});
  const { user } = useAuth();

  // Local display state to prevent “leaked” messages on group switch
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

  // 1️⃣ Clear when switching groups
  useEffect(() => {
    setDisplayMessages([]);
  }, [currentGroup?.id]);

  // 2️⃣ Mirror new incoming messages
  useEffect(() => {
    setDisplayMessages(messages);
  }, [messages]);

  // 3️⃣ Scroll to bottom on displayMessages change
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: "end" });
    }
  }, [displayMessages]);

  // Fetch groups when no group selected
  useEffect(() => {
    if (!currentGroup && user) {
      (async () => {
        try {
          const groups = await fetchAllGroups(user.id);
          setAllGroups(groups);
        } catch (err) {
          console.error("Error loading groups:", err);
        }
      })();
    }
  }, [currentGroup, user]);

  const handleJoinRequest = async (groupId: string, groupName: string) => {
    if (!user) return;
    setJoinRequestLoading((prev) => ({ ...prev, [groupId]: true }));
    try {
      await requestToJoinGroup(groupId, user.id);
      toast.success(`Request to join ${groupName} sent successfully`);
      setAllGroups((gs) =>
        gs.map((g) =>
          g.id === groupId ? { ...g, pendingRequest: true } : g
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to send join request");
    } finally {
      setJoinRequestLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;
    setLeaveGroupLoading((prev) => ({ ...prev, [groupId]: true }));
    try {
      await leaveGroup(groupId, user.id);
      toast.success(`You have left ${groupName}`);
      setAllGroups((gs) =>
        gs.map((g) =>
          g.id === groupId ? { ...g, isMember: false } : g
        )
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to leave group");
    } finally {
      setLeaveGroupLoading((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto terminal-scrollbar px-4 py-2 relative"
      ref={containerRef}
    >
      {/* Show available groups */}
      {!currentGroup && allGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-mono text-terminal-foreground mb-4">
            Available Groups
          </h2>
          <div className="grid gap-4">
            {/* ... group listing ... */}
          </div>
        </div>
      )}

      {/* No groups */}
      {!currentGroup && allGroups.length === 0 && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>No groups available. Create a new group from the sidebar.</p>
        </div>
      )}

      {/* No messages in current group */}
      {currentGroup && displayMessages.length === 0 && !loading && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}

      {/* Loading messages */}
      {loading && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>Loading messages...</p>
        </div>
      )}

      {/* Render messages */}
      {currentGroup &&
        displayMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isCurrentUser={message.userId === userId}
            currentGroup={currentGroup}
          />
        ))}

      {/* Sentinel for scrollIntoView fallback */}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
