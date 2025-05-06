
import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface ChatHeaderProps {
  currentGroup: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

const ChatHeader = ({ currentGroup }: ChatHeaderProps) => {
  const terminalPath = currentGroup ? `/${currentGroup.name.toLowerCase()}` : "";
  const terminalDisplay = `cognito@terminal:${terminalPath}$`;
  
  // Truncate the description to 30 characters if needed
  const truncatedDescription = currentGroup?.description 
    ? currentGroup.description.length > 30 
      ? `${currentGroup.description.substring(0, 30)}...` 
      : currentGroup.description
    : "No description";
  
  return (
    <div className="p-4 border-b border-terminal-border flex justify-between items-center sticky top-0 bg-terminal z-50 shadow-sm">
      <div className="flex items-center">
        <SidebarTrigger />
        <div className="ml-4 text-sm text-terminal-foreground">
          <span>{terminalDisplay}</span>
        </div>
      </div>
      
      {currentGroup && (
        <p className="text-sm text-terminal-foreground/50 truncate max-w-[50%]">
          {truncatedDescription}
        </p>
      )}
    </div>
  );
};

export default ChatHeader;
