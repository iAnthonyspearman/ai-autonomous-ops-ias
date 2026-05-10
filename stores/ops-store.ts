import { create } from "zustand";
import { starterPrompt } from "@/data/operations";
import type { OpsStore } from "@/types/operations";

export const useOpsStore = create<OpsStore>((set) => ({
  prompt: starterPrompt,
  department: "Customer Operations",
  activePrompt: starterPrompt,
  activeDepartment: "Customer Operations",
  hasGenerated: false,
  running: false,
  progress: 0,
  feed: ["System standing by. Enter an operational issue and launch autonomous execution."],
  message: "Autonomous operations workforce standing by.",
  operatorOpen: false,
  chatQuestion: "What should the operations workforce do next?",
  chatAnswer: "Launch autonomous execution first, then I can answer from the generated operating state.",
  setDraft: (updates) => set({ ...updates, hasGenerated: false }),
  setState: (updates) => set(updates),
  commitDraft: () =>
    set((state) => ({
      activePrompt: state.prompt,
      activeDepartment: state.department,
      hasGenerated: true,
    })),
}));
