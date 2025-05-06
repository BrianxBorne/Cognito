
import React, { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import MessageItem from "@/components/MessageItem";
import { Button } from "@/components/ui/button";
import { fetchAllGroups, requestToJoinGroup, leaveGroup, Group } from "@/services/groupService";
import { useAuth } from "@/hooks/useAuth";
import { Message } from "@/services/messageService";

interface MessageListProps {
  messages: Message[];
  currentGroup: { id: string; name: string; description?: string } | null;
  loading: boolean;
  userId: string | undefined;
}

const MessageList = ({ messages, currentGroup, loading, userId }: MessageListProps) => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [joinRequestLoading, setJoinRequestLoading] = useState<Record<string, boolean>>({});
  const [leaveGroupLoading, setLeaveGroupLoading] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  // Fetch all available groups when no group is selected
  useEffect(() => {
    if (!currentGroup && user) {
      const loadAllGroups = async () => {
        try {
          const groups = await fetchAllGroups(user.id);
          setAllGroups(groups);
        } catch (error) {
          console.error("Error loading groups:", error);
        }
      };
      loadAllGroups();
    }
  }, [currentGroup, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoinRequest = async (groupId: string, groupName: string) => {
    if (!user) return;
    
    setJoinRequestLoading(prev => ({ ...prev, [groupId]: true }));
    
    try {
      await requestToJoinGroup(groupId, user.id);
      toast.success(`Request to join ${groupName} sent successfully`);
      
      // Update the local state to reflect the pending request
      setAllGroups(groups => groups.map(g => 
        g.id === groupId ? { ...g, pendingRequest: true } : g
      ));
    } catch (error) {
      console.error("Error sending join request:", error);
      toast.error("Failed to send join request");
    } finally {
      setJoinRequestLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };
  
  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!user) return;
    
    setLeaveGroupLoading(prev => ({ ...prev, [groupId]: true }));
    
    try {
      await leaveGroup(groupId, user.id);
      toast.success(`You have left ${groupName}`);
      
      // Update the local state to reflect that the user is no longer a member
      setAllGroups(groups => groups.map(g => 
        g.id === groupId ? { ...g, isMember: false } : g
      ));
    } catch (error: any) {
      console.error("Error leaving group:", error);
      toast.error(error.message || "Failed to leave group");
    } finally {
      setLeaveGroupLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto terminal-scrollbar px-4 py-2 relative" ref={messagesContainerRef}>
      {!currentGroup && allGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-mono text-terminal-foreground mb-4">Available Groups</h2>
          <div className="grid gap-4">
            {allGroups.map((group) => (
              <div key={group.id} className="border border-terminal-border bg-terminal-muted rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-mono text-terminal-foreground"># {group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-terminal-foreground/70 mt-1">{group.description}</p>
                    )}
                    <p className="text-xs text-terminal-foreground/50 mt-2">
                      Created by: {group.created_by_username || "Unknown"}
                    </p>
                  </div>
                  
                  {group.isMember ? (
                    <div className="flex space-x-2 items-center">
                      <span className="text-green-500 text-sm">Joined</span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={leaveGroupLoading[group.id]}
                        onClick={() => handleLeaveGroup(group.id, group.name)}
                        className="bg-terminal border-terminal-border text-terminal-foreground hover:bg-red-500/10 hover:text-red-400"
                      >
                        {leaveGroupLoading[group.id] ? "Leaving..." : "Leave Group"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline" 
                      size="sm"
                      disabled={joinRequestLoading[group.id]}
                      onClick={() => handleJoinRequest(group.id, group.name)}
                      className="bg-terminal border-terminal-border text-terminal-foreground hover:bg-terminal-muted"
                    >
                      {joinRequestLoading[group.id] ? "Sending..." : "Request to Join"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!currentGroup && allGroups.length === 0 && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>No groups available. Create a new group from the sidebar.</p>
        </div>
      )}
      
      {currentGroup && messages.length === 0 && !loading && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>No messages yet. Start the conversation!</p>
        </div>
      )}
      
      {loading && (
        <div className="text-center text-terminal-foreground/50 mt-10">
          <p>Loading messages...</p>
        </div>
      )}
      
      {currentGroup && messages.map(message => (
        <MessageItem 
          key={message.id} 
          message={message} 
          isCurrentUser={message.userId === userId}
          currentGroup={currentGroup}
        />
      ))}
    </div>
  );
};

export default MessageList;
