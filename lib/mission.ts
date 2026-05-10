import { departmentProfiles } from "@/data/operations";
import type { MissionResult, QueueItem, Status, WorkflowNode } from "@/types/operations";

export function scoreText(text: string) {
  let score = 0;
  const value = text.toLowerCase();
  ["risk", "delay", "customer", "revenue", "escalation", "approval", "urgent", "workflow", "handoff"].forEach((word) => {
    if (value.includes(word)) score += 7;
  });
  return Math.min(42, score + Math.min(24, Math.round(text.length / 18)));
}

export function statusFor(index: number, progress: number): Status {
  const gate = (index + 1) * 15;
  if (progress === 0) return "Waiting";
  if (progress >= gate + 18) return "Complete";
  if (progress >= gate) return index === 3 ? "Escalating" : "Executing";
  if (progress >= gate - 12) return "Routing";
  return "Waiting";
}

export function createMission(prompt: string, department: string, progress: number, tick: number): MissionResult {
  const profile = departmentProfiles[department] ?? departmentProfiles["Customer Operations"];
  const textScore = scoreText(prompt);
  const motion = Math.sin((tick + progress) * 0.22) * 5;
  const urgency = prompt.toLowerCase().includes("urgent") || prompt.toLowerCase().includes("escalation") ? 10 : 0;

  const health = Math.max(48, Math.min(97, Math.round(54 + textScore + progress * 0.22 + motion)));
  const autonomy = Math.max(42, Math.min(96, Math.round(58 + progress * 0.24 + textScore * 0.25 + motion)));
  const risk = Math.max(18, Math.min(92, Math.round(72 - progress * 0.26 + urgency + motion)));
  const execution = Math.max(36, Math.min(98, Math.round(44 + progress * 0.42 + textScore * 0.18 + motion)));

  const queue: QueueItem[] = [
    {
      title: "Route operational issue",
      owner: "Routing Agent",
      status: statusFor(0, progress),
      priority: "High",
      detail: `Assign to ${department} lane and connect to ${profile.system}.`,
    },
    {
      title: "Create execution queue",
      owner: "Operations Agent",
      status: statusFor(1, progress),
      priority: "High",
      detail: "Convert the input into owner-based operational tasks.",
    },
    {
      title: "Flag risk and escalation",
      owner: "Risk Agent",
      status: statusFor(2, progress),
      priority: risk > 60 ? "Critical" : "Medium",
      detail: `Monitor ${profile.risk} and trigger human review if thresholds rise.`,
    },
    {
      title: "Send stakeholder update",
      owner: "Communications Agent",
      status: statusFor(3, progress),
      priority: "Medium",
      detail: "Prepare status update for teams impacted by workflow movement.",
    },
    {
      title: "Generate executive visibility",
      owner: "Executive Visibility Agent",
      status: statusFor(4, progress),
      priority: "High",
      detail: "Summarize blockers, owner state, risk, and action path.",
    },
  ];

  const workflow: WorkflowNode[] = [
    { title: "Intake", status: statusFor(0, progress), system: "Command Input", signal: Math.min(100, progress + 18) },
    { title: "Routing", status: statusFor(1, progress), system: profile.system, signal: Math.min(100, progress + 6) },
    { title: "Execution Queue", status: statusFor(2, progress), system: "Operations Layer", signal: execution },
    { title: "Risk Gate", status: statusFor(3, progress), system: "Governance Layer", signal: 100 - risk },
    { title: "Executive View", status: statusFor(4, progress), system: "Leadership Layer", signal: health },
  ];

  return {
    domain: department,
    objective: profile.objective,
    summary: `The autonomous operations workforce is coordinating ${department.toLowerCase()} around ${profile.objective}. The system is routing work, creating execution tasks, monitoring ${profile.risk}, and preparing executive visibility as workflow states move.`,
    health,
    autonomy,
    risk,
    execution,
    revenueImpact: `$${Math.round(profile.value + execution * 3.1)}K protected operational value`,
    queue,
    workflow,
    risks: [
      `${profile.risk} if ownership is not accepted quickly`,
      "handoff delay between systems and teams",
      "executive visibility gap if status is not summarized",
    ],
    actions: [
      "Workflow routed",
      "Task queue created",
      "Escalation triggered",
      "Risk flagged",
      "Operations state updated",
      "Executive summary generated",
      "Workflow synchronized",
      "Action pipeline coordinated",
    ],
    feed: [
      "Routing Agent assigned workflow",
      "Operations Agent created execution queue",
      "Risk Agent flagged bottleneck",
      "Escalation Agent initiated human review path",
      "Workflow Tracking Agent updated operational state",
      "Executive Visibility Agent prepared summary",
    ],
    executive: `Current execution health is ${health}%. Autonomy is ${autonomy}%. Risk pressure is ${risk}%. Recommended next move: keep human review active until the queue reaches complete status.`,
  };
}

export function emptyMission(): MissionResult {
  return {
    domain: "Awaiting launch",
    objective: "Enter an operational issue and run autonomous execution.",
    summary: "Generated operational output will appear after Run Autonomous Operations is pressed.",
    health: 0,
    autonomy: 0,
    risk: 0,
    execution: 0,
    revenueImpact: "Awaiting execution",
    queue: [
      { title: "Awaiting workflow route", owner: "Routing Agent", status: "Waiting", priority: "Pending", detail: "Run autonomous execution to generate the queue." },
      { title: "Awaiting execution task", owner: "Operations Agent", status: "Waiting", priority: "Pending", detail: "Run autonomous execution to generate tasks." },
      { title: "Awaiting risk scan", owner: "Risk Agent", status: "Waiting", priority: "Pending", detail: "Run autonomous execution to scan risks." },
    ],
    workflow: [
      { title: "Awaiting Intake", status: "Waiting", system: "Command Input", signal: 0 },
      { title: "Awaiting Routing", status: "Waiting", system: "Routing Layer", signal: 0 },
      { title: "Awaiting Execution", status: "Waiting", system: "Operations Layer", signal: 0 },
    ],
    risks: ["Awaiting risk scan"],
    actions: ["Awaiting workflow route", "Awaiting execution queue", "Awaiting operational state update"],
    feed: ["System standing by", "Agents waiting for execution command"],
    executive: "No executive summary generated yet.",
  };
}

export function randomScenario() {
  const seeds = [
    ["Service Operations", "A priority support queue is growing faster than the team can triage. SLA risk is increasing, customer updates are inconsistent, and escalation ownership is unclear."],
    ["Revenue Operations", "Deal desk approvals are blocking late-stage opportunities. Sales, finance, and implementation do not have a shared status view, and forecast risk is rising."],
    ["Supply Chain Operations", "A supplier delay is creating fulfillment risk across operations, customer success, and finance. Leaders need early warnings, owner routing, and execution visibility."],
    ["IT Operations", "Urgent access requests are scattered across chat, email, and tickets. Employees are blocked, security approvals are inconsistent, and the service desk needs prioritization."],
    ["Executive Operations", "Leadership is receiving late updates from multiple departments. Decisions are stuck because owners, blockers, and value at stake are not visible in one place."],
  ];

  const item = seeds[Math.floor(Math.random() * seeds.length)];
  return { department: item[0], prompt: item[1] };
}
