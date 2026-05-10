import {
  AlertTriangle,
  BrainCircuit,
  GitBranch,
  LineChart as LineChartIcon,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { Agent } from "@/types/operations";

export const starterPrompt =
  "A customer escalation is moving across support, operations, and revenue teams without clear ownership. Priority accounts need faster updates, risk needs to be flagged earlier, and leadership needs visibility into execution progress.";

export const departments = [
  "Customer Operations",
  "Service Operations",
  "Revenue Operations",
  "Finance Operations",
  "Supply Chain Operations",
  "IT Operations",
  "Executive Operations",
];

export const agents: Agent[] = [
  { name: "Intake Agent", role: "Captures issue and converts it into operational signal", icon: BrainCircuit, color: "#fbbf24" },
  { name: "Routing Agent", role: "Assigns the workflow to the correct execution lane", icon: GitBranch, color: "#e879f9" },
  { name: "Operations Agent", role: "Creates execution queue and tracks work movement", icon: Workflow, color: "#34d399" },
  { name: "Risk Agent", role: "Flags bottlenecks, exposure, and escalation pressure", icon: ShieldCheck, color: "#fb7185" },
  { name: "Escalation Agent", role: "Triggers urgent handoff and human review", icon: AlertTriangle, color: "#f97316" },
  { name: "Executive Visibility Agent", role: "Prepares leadership-ready execution summary", icon: LineChartIcon, color: "#60a5fa" },
];

export const stages = [
  "Intake received",
  "Routing workflow",
  "Creating execution queue",
  "Scanning risk layer",
  "Triggering escalation path",
  "Updating workflow states",
  "Preparing executive visibility",
  "Autonomous operations synchronized",
];

export const departmentProfiles: Record<string, { objective: string; system: string; value: number; risk: string }> = {
  "Customer Operations": {
    objective: "protect customer trust, reduce escalation delay, and improve account visibility",
    system: "customer success platform",
    value: 520,
    risk: "customer churn exposure",
  },
  "Service Operations": {
    objective: "protect SLA performance, improve triage, and reduce unresolved service pressure",
    system: "ticketing platform",
    value: 430,
    risk: "SLA breach risk",
  },
  "Revenue Operations": {
    objective: "increase deal velocity, protect forecast accuracy, and improve handoffs",
    system: "CRM and deal desk",
    value: 610,
    risk: "revenue leakage",
  },
  "Finance Operations": {
    objective: "accelerate approvals, protect audit trail, and improve revenue timing",
    system: "ERP and approval workflow",
    value: 480,
    risk: "approval and audit exposure",
  },
  "Supply Chain Operations": {
    objective: "detect delays, coordinate vendors, and protect fulfillment visibility",
    system: "supply chain control layer",
    value: 560,
    risk: "delivery disruption",
  },
  "IT Operations": {
    objective: "prioritize requests, protect access controls, and restore employee productivity",
    system: "service desk and identity platform",
    value: 390,
    risk: "access and productivity risk",
  },
  "Executive Operations": {
    objective: "surface decisions, coordinate owners, and improve leadership operating cadence",
    system: "executive operating review",
    value: 650,
    risk: "decision latency",
  },
};
