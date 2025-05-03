
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Image, Mic, FileVideo } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import MessageItem from "@/components/MessageItem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadMedia, MediaType } from "@/services/mediaService";

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  media_url?: string;
  media_type?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
}

const ChatPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Load group information
  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
          
        if (error) throw error;
        setCurrentGroup(data);
      } catch (error) {
        console.error('Error fetching group info:', error);
        toast({
          title: "Error",
          description: "Failed to load group information",
          variant: "destructive",
        });
      }
    };
    
    fetchGroupInfo();
  }, [groupId]);

  // Load messages and subscribe to new ones
  useEffect(() => {
    if (!groupId || !user) return;
    
    const fetchMessages = async () => {
      try {
        // Get messages for this group with profile data
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            media_url,
            media_type,
            profiles:user_id (username)
          `)
          .eq('group_id', groupId)
          .order('created_at', { ascending: true });
          
        if (messagesError) throw messagesError;
        
        // Format messages for display
        const formattedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          userId: msg.user_id,
          username: msg.profiles?.username || 'Unknown',
          content: msg.content || '',
          timestamp: msg.created_at,
          media_url: msg.media_url,
          media_type: msg.media_type
        }));
        
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${groupId}`)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Get username of the sender
          const { data: userData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', newMsg.user_id)
            .single();
            
          const formattedMessage: Message = {
            id: newMsg.id,
            userId: newMsg.user_id,
            username: userData?.username || 'Unknown',
            content: newMsg.content || '',
            timestamp: newMsg.created_at,
            media_url: newMsg.media_url,
            media_type: newMsg.media_type
          };
          
          setMessages(prev => [...prev, formattedMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const handleSendMessage = async () => {
    if (!message.trim() && !isUploading) return;
    if (!user || !groupId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          content: message.trim(),
          user_id: user.id,
          group_id: groupId
        }])
        .select();
        
      if (error) throw error;
      
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };
  
  const handleFileUpload = async (mediaType: MediaType) => {
    if (!user || !groupId) return;
    
    try {
      if (!fileInputRef.current) return;
      
      // Trigger file selection
      fileInputRef.current.accept = mediaType === 'image' 
        ? 'image/jpeg,image/png,image/webp' 
        : mediaType === 'gif'
          ? 'image/gif'
          : 'audio/mpeg,audio/wav,audio/ogg';
          
      fileInputRef.current.click();
    } catch (error) {
      console.error('Error with file upload:', error);
    }
  };
  
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !groupId) return;
    
    try {
      setIsUploading(true);
      
      // Determine media type based on file type
      let mediaType: MediaType;
      if (file.type.startsWith('image/gif')) {
        mediaType = 'gif';
      } else if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('audio/')) {
        mediaType = 'audio';
      } else {
        toast({
          title: "Unsupported file type",
          description: "Please upload an image, GIF, or audio file",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }
      
      // Upload the file
      const mediaUrl = await uploadMedia(file, mediaType, user.id);
      
      if (!mediaUrl) {
        throw new Error('Failed to upload media');
      }
      
      // Create the message with media
      const { error } = await supabase
        .from('messages')
        .insert([{
          media_url: mediaUrl,
          media_type: mediaType,
          user_id: user.id,
          group_id: groupId
        }]);
        
      if (error) throw error;
      
      toast({
        title: "Upload complete",
        description: "Media has been shared in the chat",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!currentGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-terminal-foreground text-lg">
          <span className="cursor">Loading secure channel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Group header */}
      <div className="p-4 border-b border-terminal-border">
        <h1 className="text-lg font-bold text-terminal-foreground">#{currentGroup.name}</h1>
        <p className="text-sm text-terminal-foreground/60">{currentGroup.description}</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 terminal-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-terminal-foreground/60">No messages in this terminal session.</p>
            <p className="text-terminal-foreground/60">Initiate communication...</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                isCurrentUser={user?.id === msg.userId}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t border-terminal-border">
        <form 
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelected}
          />
          <div className="flex space-x-2 mr-2">
            <Button 
              type="button" 
              size="icon" 
              variant="outline"
              disabled={isUploading}
              className="h-8 w-8 border-terminal-border text-terminal-foreground/70"
              onClick={() => handleFileUpload('image')}
            >
              <Image size={16} />
            </Button>
            <Button 
              type="button" 
              size="icon" 
              variant="outline"
              disabled={isUploading}
              className="h-8 w-8 border-terminal-border text-terminal-foreground/70"
              onClick={() => handleFileUpload('gif')}
            >
              <FileVideo size={16} />
            </Button>
            <Button 
              type="button" 
              size="icon" 
              variant="outline"
              disabled={isUploading}
              className="h-8 w-8 border-terminal-border text-terminal-foreground/70"
              onClick={() => handleFileUpload('audio')}
            >
              <Mic size={16} />
            </Button>
          </div>
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter command..."
              disabled={isUploading}
              className="bg-terminal border border-terminal-border text-terminal-foreground pr-12"
            />
            <Button 
              type="submit"
              size="sm" 
              disabled={isUploading || (!message.trim() && !isUploading)}
              className="absolute right-1 top-1 h-8 bg-terminal-foreground text-terminal hover:bg-terminal-foreground/80"
            >
              {isUploading ? "Uploading..." : <Send size={16} />}
            </Button>
          </div>
        </form>
        <div className="text-xs text-terminal-foreground/40 mt-2">
          <span>Channel secured with end-to-end encryption</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
