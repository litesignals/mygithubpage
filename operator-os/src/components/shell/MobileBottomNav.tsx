"use client";

import { MessageSquare, Image, FolderOpen, Activity, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./Shell";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "chat",      label: "Chat",     icon: MessageSquare },
  { id: "studio",    label: "Studio",   icon: Image },
  { id: "workspace", label: "Files",    icon: FolderOpen },
  { id: "control",   label: "Control",  icon: Activity },
  { id: "settings",  label: "Settings", icon: Settings },
];

interface MobileBottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-border bg-card/95 backdrop-blur-sm safe-area-inset-bottom">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 min-h-[56px] transition-colors",
            activeTab === id
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5 shrink-0",
              activeTab === id ? "stroke-[2.5]" : "stroke-2"
            )}
          />
          <span className="text-[10px] font-medium leading-none">{label}</span>
        </button>
      ))}
    </nav>
  );
}
