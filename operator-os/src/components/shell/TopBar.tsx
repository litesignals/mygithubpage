"use client";

import { MessageSquare, Image, FolderOpen, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAgentContext } from "@/providers/AgentProvider";
import type { Tab } from "./Shell";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "studio", label: "Studio", icon: Image },
  { id: "workspace", label: "Workspace", icon: FolderOpen },
  { id: "control", label: "Control Room", icon: Activity },
];

interface TopBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const { activeAgent } = useAgentContext();

  return (
    <header className="flex items-center h-12 border-b border-border bg-card px-4 shrink-0">
      {/* Active agent indicator */}
      <div className="flex items-center gap-2 mr-6 min-w-0">
        {activeAgent ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: activeAgent.color }}
            />
            <span className="text-sm font-medium truncate text-foreground">
              {activeAgent.name}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No agent selected</span>
        )}
      </div>

      {/* Tabs */}
      <nav className="flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
              activeTab === id
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </nav>

      {/* Spacer + branding */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-muted-foreground/40 font-mono tracking-wider">
          OPERATOR OS
        </span>
      </div>
    </header>
  );
}
