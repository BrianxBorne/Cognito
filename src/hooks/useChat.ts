import { useState } from "react";
import { useChatMessages } from "./useChatMessages";
import { useSendMessage } from "./useSendMessage";
import { useMediaUpload } from "./useMediaUpload";
import { Message } from "@/services/messageService";

interface User {
  id: string;
}

export const useChat = (groupId: string | undefined, user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Use our new hooks to handle different responsibilities
  const { messages: fetchedMessages, currentGroup, loading } = useChatMessages(groupId, user);
  const { sendMessage } = useSendMessage(groupId, user, setMessages);
  const { uploadingMedia, handleFileUpload } = useMediaUpload(groupId, user, setMessages);
  
  // Keep our messages state in sync with the fetched messages
  if (JSON.stringify(messages) !== JSON.stringify(fetchedMessages) && fetchedMessages.length > 0) {
    setMessages(fetchedMessages);
  }

  return {
    messages,
    currentGroup,
    loading,
    uploadingMedia,
    sendMessage,
    handleFileUpload
  };
};
