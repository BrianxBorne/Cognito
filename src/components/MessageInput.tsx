import React, { useState } from "react";
import { Send, Image, Gift, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  uploadingMedia,
}: MessageInputProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() && !uploadingMedia) return;
    onSendMessage(text.trim());
    setText("");
  };

  if (!currentGroup) return null;

  return (
    <div className="flex items-center p-2 border-t border-terminal-border bg-terminal z-50">
      {/* Attach icons + emoji placeholder */}
      <div className="flex space-x-2 px-2">
        <button
          onClick={() => document.getElementById('image-upload')?.click()}
          className="text-terminal-foreground/70 hover:text-terminal-foreground"
        >
          <Image size={24} />
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileUpload}
          />
        </button>
        <button
          onClick={() => document.getElementById('gif-upload')?.click()}
          className="text-terminal-foreground/70 hover:text-terminal-foreground"
        >
          <Gift size={24} />
          <input
            id="gif-upload"
            type="file"
            accept="image/gif"
            className="hidden"
            onChange={onFileUpload}
          />
        </button>
      </div>

      {/* Input box */}
      <div className="flex items-center flex-1 bg-terminal-muted rounded-full px-4 py-2 mx-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 resize-none bg-transparent outline-none text-sm text-terminal-foreground placeholder-terminal-foreground/50 h-6 max-h-20"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        {/* Emoji icon could go here */}
      </div>

      {/* Send / mic button */}
      <div className="px-2">
        {text.trim() || uploadingMedia ? (
          <button
            onClick={handleSend}
            className="bg-green-500 hover:bg-green-600 p-3 rounded-full shadow-md"
          >
            <Send size={20} className="text-white" />
          </button>
        ) : (
          <button
            onClick={() => document.getElementById('audio-upload')?.click()}
            className="text-terminal-foreground/70 hover:text-terminal-foreground p-3"
          >
            <Mic size={20} />
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={onFileUpload}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
