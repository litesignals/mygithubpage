"use client";

import { useState } from "react";
import { AgentRail } from "./AgentRail";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ChatTab } from "@/components/tabs/ChatTab";
import { StudioTab } from "@/components/tabs/StudioTab";
import { WorkspaceTab } from "@/components/tabs/WorkspaceTab";
import { ControlRoomTab } from "@/components/tabs/ControlRoomTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { cn } from "@/lib/utils";

export type Tab = "chat" | "studio" | "workspace" | "control" | "settings";

export function Shell() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [railOpen, setRailOpen] = useState(false);

  const content = (
    <>
      {activeTab === "chat"      && <ChatTab />}
      {activeTab === "studio"    && <StudioTab />}
      {activeTab === "workspace" && <WorkspaceTab />}
      {activeTab === "control"   && <ControlRoomTab />}
      {activeTab === "settings"  && <SettingsTab />}
    </>
  );

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-background">

      {/* Mobile backdrop */}
      {railOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setRailOpen(false)}
        />
      )}

      {/* Agent Rail — fixed overlay on mobile, static sidebar on desktop */}
      <aside
        className={cn(
          "fixed z-50 h-full transition-transform duration-200 ease-in-out",
          "md:relative md:translate-x-0 md:shrink-0",
          railOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AgentRail onClose={() => setRailOpen(false)} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenRail={() => setRailOpen(true)}
        />

        {/* Content — bottom padding on mobile for the nav bar */}
        <main className="flex-1 overflow-hidden pb-14 md:pb-0">
          {content}
        </main>

        <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
}
