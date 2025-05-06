
import React, { useState } from "react";
import { Send, Image, Gift, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageInputProps {
  currentGroup: { id: string; name: string; description?: string } | null;
  onSendMessage: (content: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingMedia: boolean;
}

const MessageInput = ({ 
  currentGroup, 
  onSendMessage, 
  onFileUpload,
  uploadingMedia 
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (!newMessage.trim() && !uploadingMedia) return;
    
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentGroup) return null;

  return (
    <div className="p-4 border-t border-terminal-border sticky bottom-0 bg-terminal z-50">
      <Textarea
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full resize-none bg-terminal-muted text-terminal-foreground"
        rows={2}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-between mt-2">
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-terminal-foreground/70 hover:text-terminal-foreground hover:bg-terminal-muted"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Image size={18} />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileUpload}
            />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-terminal-foreground/70 hover:text-terminal-foreground hover:bg-terminal-muted"
            onClick={() => document.getElementById('gif-upload')?.click()}
          >
            <Gift size={18} />
            <input
              id="gif-upload"
              type="file"
              accept="image/gif"
              className="hidden"
              onChange={onFileUpload}
            />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-terminal-foreground/70 hover:text-terminal-foreground hover:bg-terminal-muted"
            onClick={() => document.getElementById('audio-upload')?.click()}
          >
            <Mic size={18} />
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={onFileUpload}
            />
          </Button>
        </div>
        <Button 
          variant="default" 
          className="bg-terminal-foreground text-terminal hover:bg-terminal-foreground/90" 
          onClick={handleSendMessage}
          disabled={!newMessage.trim() && !uploadingMedia}
        >
          {uploadingMedia ? "Uploading..." : "Send"}
          <Send size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
