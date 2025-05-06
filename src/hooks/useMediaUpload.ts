
import { useState } from "react";
import { toast } from "sonner";
import {
  sendMediaMessage,
  getUserProfile,
  createOptimisticMessage,
  Message
} from "@/services/messageService";
import { uploadMedia } from "@/services/mediaService";

interface User {
  id: string;
}

export const useMediaUpload = (
  groupId: string | undefined,
  user: User | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Function to handle file upload (images, GIFs, audio)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !groupId) return;

    let tempMessage: Message | undefined;

    try {
      setUploadingMedia(true);
      const mediaType = event.target.id === 'image-upload' 
        ? 'image' 
        : event.target.id === 'gif-upload' 
          ? 'gif' 
          : 'audio';
      
      const publicUrl = await uploadMedia(file, mediaType as any, user.id);
      
      if (!publicUrl) {
        throw new Error("Failed to upload media");
      }

      // Get user profile data
      const profileData = await getUserProfile(user.id);

      // Create optimistic message with media
      tempMessage = createOptimisticMessage(
        user.id, 
        "", 
        groupId, 
        profileData.username,
        profileData.avatar_url,
        publicUrl,
        mediaType
      );

      setMessages(prevMessages => [...prevMessages, tempMessage!]);

      // Send the media message to the database
      await sendMediaMessage(groupId, user.id, publicUrl, mediaType);
    } catch (error: any) {
      console.error("Error uploading media:", error);
      toast.error(error.message || "Failed to upload media.");
      // Remove optimistic message on error
      if (tempMessage) {
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
      }
    } finally {
      setUploadingMedia(false);
      // Reset the input value so the same file can be uploaded again
      event.target.value = '';
    }
  };

  return {
    uploadingMedia,
    handleFileUpload
  };
};
