"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
}

const AnimatedTabs = React.forwardRef<HTMLDivElement, AnimatedTabsProps>(
  ({ tabs, defaultTab, className }, ref) => {
    const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div ref={ref} className={cn("w-full flex flex-col gap-y-1", className)}>
      <div className="flex gap-2 flex-wrap bg-secondary/50 backdrop-blur-sm p-1.5 rounded-2xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-semibold rounded-xl text-foreground outline-none transition-colors flex-1"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-background shadow-sm backdrop-blur-sm !rounded-xl border"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className={cn(
               "relative z-10 transition-colors", 
               activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
            )}>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 flex-1">
        <AnimatePresence mode="wait">
          {tabs.map(
            (tab) =>
              activeTab === tab.id && (
                <motion.div
                  key={tab.id}
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                    filter: "blur(4px)",
                  }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  transition={{
                    duration: 0.3,
                    ease: "circInOut",
                  }}
                  className="h-full"
                >
                  {tab.content}
                </motion.div>
              )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
AnimatedTabs.displayName = "AnimatedTabs";

export { AnimatedTabs };
