
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  fetchMessages, 
  fetchUserProfiles, 
  formatMessages, 
  getUserProfile,
  Message
} from "@/services/messageService";
import { fetchGroupInfo, Group } from "@/services/groupService";

interface User {
  id: string;
}

export const useChatMessages = (groupId: string | undefined, user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch messages and group info
  useEffect(() => {
    if (!user) return;

    const fetchChatData = async () => {
      setLoading(true);
      if (!groupId) {
        setMessages([]);
        setCurrentGroup(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch group info
        const groupData = await fetchGroupInfo(groupId);
        setCurrentGroup(groupData);

        // Fetch messages
        const messagesData = await fetchMessages(groupId);

        // Get unique user IDs from messages
        const userIds = [...new Set(messagesData?.map(msg => msg.user_id) || [])];
        
        // Fetch profiles for those user IDs
        const profilesData = await fetchUserProfiles(userIds);

        // Create a map of user IDs to their profile data for easy lookup
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Transform the messages data with the profiles information
        const formattedMessages = formatMessages(messagesData, profilesMap);

        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error fetching chat data:", error);
        toast.error("Failed to load chat data.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMsg = payload.new as any;
        
        if (newMsg.group_id === groupId) {
          try {
            // Fetch the user data for this message
            const userData = await getUserProfile(newMsg.user_id);
            
            const formattedMessage: Message = {
              id: newMsg.id,
              userId: newMsg.user_id,
              username: userData?.username || "Unknown User",
              content: newMsg.content || "",
              timestamp: newMsg.created_at,
              media_url: newMsg.media_url,
              media_type: newMsg.media_type,
              avatar_url: userData?.avatar_url,
              group_id: newMsg.group_id
            };

            setMessages(prevMessages => [...prevMessages, formattedMessage]);
          } catch (error) {
            console.error("Error processing new message:", error);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [groupId, user]);

  return {
    messages,
    currentGroup,
    loading,
  };
};
