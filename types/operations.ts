import type { LucideIcon } from "lucide-react";

export type Status = "Waiting" | "Routing" | "Executing" | "Escalating" | "Complete";

export type Agent = {
  name: string;
  role: string;
  icon: LucideIcon;
  color: string;
};

export type QueueItem = {
  title: string;
  owner: string;
  status: Status;
  priority: string;
  detail: string;
};

export type WorkflowNode = {
  title: string;
  status: Status;
  system: string;
  signal: number;
};

export type MissionResult = {
  domain: string;
  objective: string;
  summary: string;
  health: number;
  autonomy: number;
  risk: number;
  execution: number;
  revenueImpact: string;
  queue: QueueItem[];
  workflow: WorkflowNode[];
  risks: string[];
  actions: string[];
  feed: string[];
  executive: string;
};

export type FocusPayload = {
  type: string;
  title: string;
  subtitle: string;
  status?: Status | string;
  detail: string;
  color?: string;
  metrics: {
    label: string;
    value: string;
    level: number;
  }[];
};

export type OpsStore = {
  prompt: string;
  department: string;
  activePrompt: string;
  activeDepartment: string;
  hasGenerated: boolean;
  running: boolean;
  progress: number;
  feed: string[];
  message: string;
  operatorOpen: boolean;
  chatQuestion: string;
  chatAnswer: string;
  setDraft: (updates: Partial<OpsStore>) => void;
  setState: (updates: Partial<OpsStore>) => void;
  commitDraft: () => void;
};
