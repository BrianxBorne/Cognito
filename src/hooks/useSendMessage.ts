
import { useState } from "react";
import { toast } from "sonner";
import {
  sendTextMessage,
  getUserProfile,
  createOptimisticMessage,
  Message
} from "@/services/messageService";

interface User {
  id: string;
}

export const useSendMessage = (
  groupId: string | undefined,
  user: User | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  // Function to send a new message
  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;
    if (!groupId || !user) {
      toast.error("Select a group to send messages.");
      return;
    }

    try {
      // Get user profile data
      const profileData = await getUserProfile(user.id);

      // Optimistically update the local state
      const tempMessage = createOptimisticMessage(
        user.id, 
        messageContent, 
        groupId, 
        profileData.username,
        profileData.avatar_url
      );

      setMessages(prevMessages => [...prevMessages, tempMessage]);

      // Send the message to the database
      await sendTextMessage(groupId, user.id, messageContent);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast.error("Failed to send message.");
      // Revert the optimistic update on error
      setMessages(prevMessages => 
        prevMessages.filter(msg => 
          // We need to check if the message has the same content and timestamp
          !(msg.userId === user.id && msg.content === messageContent)
        )
      );
    }
  };

  return {
    sendMessage
  };
};
