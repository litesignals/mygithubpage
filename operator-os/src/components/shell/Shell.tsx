"use client";

import { useState } from "react";
import { AgentRail } from "./AgentRail";
import { TopBar } from "./TopBar";
import { ChatTab } from "@/components/tabs/ChatTab";
import { StudioTab } from "@/components/tabs/StudioTab";
import { WorkspaceTab } from "@/components/tabs/WorkspaceTab";
import { ControlRoomTab } from "@/components/tabs/ControlRoomTab";

export type Tab = "chat" | "studio" | "workspace" | "control";

export function Shell() {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Rail */}
      <AgentRail />

      {/* Main Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 overflow-hidden">
          {activeTab === "chat" && <ChatTab />}
          {activeTab === "studio" && <StudioTab />}
          {activeTab === "workspace" && <WorkspaceTab />}
          {activeTab === "control" && <ControlRoomTab />}
        </main>
      </div>
    </div>
  );
}
