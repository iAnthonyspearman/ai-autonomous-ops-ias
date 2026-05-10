"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import interact from "interactjs";
import Sortable from "sortablejs";
import confetti from "canvas-confetti";
import useMeasure from "react-use-measure";
import { create } from "zustand";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Line as DreiLine, OrbitControls, Sparkles as DreiSparkles, Stars, Text } from "@react-three/drei";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  Box,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Command,
  Cpu,
  Database,
  Flame,
  Gauge,
  GitBranch,
  Grip,
  Layers3,
  LineChart as LineChartIcon,
  LockKeyhole,
  MessageSquareText,
  Move,
  Network,
  Play,
  Radar,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";
import { Bar, Doughnut, Line as LineChartCanvas } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

type Status = "Waiting" | "Routing" | "Executing" | "Escalating" | "Complete";

type Agent = {
  name: string;
  role: string;
  icon: LucideIcon;
  color: string;
};

type QueueItem = {
  title: string;
  owner: string;
  status: Status;
  priority: string;
  detail: string;
};

type WorkflowNode = {
  title: string;
  status: Status;
  system: string;
  signal: number;
};

type MissionResult = {
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

type FocusPayload = {
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

type OpsStore = {
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

const starterPrompt =
  "A customer escalation is moving across support, operations, and revenue teams without clear ownership. Priority accounts need faster updates, risk needs to be flagged earlier, and leadership needs visibility into execution progress.";

const departments = [
  "Customer Operations",
  "Service Operations",
  "Revenue Operations",
  "Finance Operations",
  "Supply Chain Operations",
  "IT Operations",
  "Executive Operations",
];

const agents: Agent[] = [
  { name: "Intake Agent", role: "Captures issue and converts it into operational signal", icon: BrainCircuit, color: "#fbbf24" },
  { name: "Routing Agent", role: "Assigns the workflow to the correct execution lane", icon: GitBranch, color: "#e879f9" },
  { name: "Operations Agent", role: "Creates execution queue and tracks work movement", icon: Workflow, color: "#34d399" },
  { name: "Risk Agent", role: "Flags bottlenecks, exposure, and escalation pressure", icon: ShieldCheck, color: "#fb7185" },
  { name: "Escalation Agent", role: "Triggers urgent handoff and human review", icon: AlertTriangle, color: "#f97316" },
  { name: "Executive Visibility Agent", role: "Prepares leadership-ready execution summary", icon: LineChartIcon, color: "#60a5fa" },
];

const stages = [
  "Intake received",
  "Routing workflow",
  "Creating execution queue",
  "Scanning risk layer",
  "Triggering escalation path",
  "Updating workflow states",
  "Preparing executive visibility",
  "Autonomous operations synchronized",
];

const departmentProfiles: Record<string, { objective: string; system: string; value: number; risk: string }> = {
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

const useOpsStore = create<OpsStore>((set, get) => ({
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

function scoreText(text: string) {
  let score = 0;
  const value = text.toLowerCase();
  ["risk", "delay", "customer", "revenue", "escalation", "approval", "urgent", "workflow", "handoff"].forEach((word) => {
    if (value.includes(word)) score += 7;
  });
  return Math.min(42, score + Math.min(24, Math.round(text.length / 18)));
}

function statusFor(index: number, progress: number): Status {
  const gate = (index + 1) * 15;
  if (progress === 0) return "Waiting";
  if (progress >= gate + 18) return "Complete";
  if (progress >= gate) return index === 3 ? "Escalating" : "Executing";
  if (progress >= gate - 12) return "Routing";
  return "Waiting";
}

function createMission(prompt: string, department: string, progress: number, tick: number): MissionResult {
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

function emptyMission(): MissionResult {
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

function randomScenario() {
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

function missionLineData(mission: MissionResult) {
  return {
    labels: ["Intake", "Route", "Queue", "Risk", "Execute", "Report"],
    datasets: [
      {
        label: "Execution State",
        data: [18, mission.autonomy, mission.execution, 100 - mission.risk, mission.health, Math.max(mission.health, mission.execution)],
        tension: 0.42,
        borderWidth: 3,
        pointRadius: 4,
        borderColor: "rgba(52,211,153,.95)",
        backgroundColor: "rgba(52,211,153,.15)",
      },
    ],
  };
}

function queueBarData(mission: MissionResult) {
  return {
    labels: ["Health", "Autonomy", "Execution", "Risk Control"],
    datasets: [
      {
        label: "Operational Signal",
        data: [mission.health, mission.autonomy, mission.execution, 100 - mission.risk],
        borderWidth: 1,
        borderRadius: 12,
        backgroundColor: [
          "rgba(52,211,153,.75)",
          "rgba(251,191,36,.75)",
          "rgba(217,70,239,.72)",
          "rgba(96,165,250,.72)",
        ],
      },
    ],
  };
}

function healthRingData(mission: MissionResult) {
  return {
    labels: ["Health", "Remaining"],
    datasets: [
      {
        data: [mission.health, 100 - mission.health],
        borderWidth: 0,
        backgroundColor: ["rgba(52,211,153,.9)", "rgba(244,63,94,.22)"],
      },
    ],
  };
}

const chartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 850 },
  interaction: {
    mode: "nearest",
    intersect: false,
    axis: "x",
  },
  plugins: {
    legend: {
      labels: {
        color: "rgba(255,255,255,.72)",
        boxWidth: 42,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: "rgba(5,7,18,.94)",
      borderColor: "rgba(52,211,153,.35)",
      borderWidth: 1,
      titleColor: "#d1fae5",
      bodyColor: "rgba(255,255,255,.82)",
      padding: 14,
      displayColors: true,
      callbacks: {
        title(items: any[]) {
          const label = items?.[0]?.label ?? "Signal";
          return `Live marker: ${label}`;
        },
        label(context: any) {
          const label = context.dataset?.label ?? "Operational value";
          const value = Math.round(context.parsed?.y ?? context.parsed ?? 0);
          return `${label}: ${value}%`;
        },
        afterLabel(context: any) {
          const label = String(context.label ?? "").toLowerCase();

          if (label.includes("risk")) return "Shows how much operational exposure remains in this state.";
          if (label.includes("route")) return "Shows whether the workflow is being assigned to the correct execution lane.";
          if (label.includes("queue")) return "Shows execution queue creation and task movement.";
          if (label.includes("execute")) return "Shows operational work actively moving through the system.";
          if (label.includes("report")) return "Shows executive visibility and leadership-ready reporting.";
          if (label.includes("health")) return "Shows total mission stability across agents, workflow, and risk.";
          if (label.includes("autonomy")) return "Shows how much execution the AI workforce can coordinate.";
          return "Live signal generated from the current operational scenario.";
        },
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255,255,255,.58)" },
      grid: { color: "rgba(255,255,255,.08)" },
    },
    y: {
      min: 0,
      max: 100,
      ticks: { color: "rgba(255,255,255,.58)" },
      grid: { color: "rgba(255,255,255,.08)" },
    },
  },
};

const doughnutOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "74%",
  plugins: {
    legend: { position: "bottom", labels: { color: "rgba(255,255,255,.72)" } },
  },
};

function AgentConnection({
  from,
  to,
  color,
  active,
  delay,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
  delay: number;
}) {
  const pulse = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const span = start.distanceTo(end);
    const firstBend = start.clone().lerp(end, 0.34);
    const secondBend = start.clone().lerp(end, 0.68);

    firstBend.z += 0.18 + span * 0.075;
    firstBend.y += 0.08 + span * 0.035;
    secondBend.z -= 0.04 + span * 0.03;
    secondBend.y += 0.14 + span * 0.025;

    return new THREE.CatmullRomCurve3([start, firstBend, secondBend, end]);
  }, [from, to]);

  useFrame((state) => {
    if (!pulse.current) return;
    const t = (state.clock.elapsedTime * 0.22 + delay) % 1;
    const point = curve.getPoint(t);
    pulse.current.position.copy(point);
    pulse.current.scale.setScalar(active ? 1 : 0.55);
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 72, active ? 0.02 : 0.012, 12, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 1.2 : 0.35}
          metalness={0.45}
          roughness={0.22}
          transparent
          opacity={active ? 0.78 : 0.34}
        />
      </mesh>

      <DreiLine
        points={curve.getPoints(36)}
        color="#ffffff"
        lineWidth={0.7}
        transparent
        opacity={active ? 0.24 : 0.08}
      />

      <mesh ref={pulse}>
        <sphereGeometry args={[active ? 0.056 : 0.044, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={color}
          emissiveIntensity={active ? 1.8 : 0.45}
          metalness={0.3}
          roughness={0.18}
        />
      </mesh>
    </group>
  );
}

function AgentOrb({
  position,
  color,
  active,
  label,
  index,
}: {
  position: [number, number, number];
  color: string;
  active: boolean;
  label: string;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const verticalRing = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  const rimColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.offsetHSL(0.05, 0.1, 0.22);
    return `#${c.getHexString()}`;
  }, [color]);

  const darkColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.offsetHSL(-0.06, -0.18, -0.28);
    return `#${c.getHexString()}`;
  }, [color]);

  useFrame((_, delta) => {
    if (group.current) {
      const target = active ? 1.1 : 0.92;
      group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, target, delta * 2.2));
      group.current.rotation.y += delta * (active ? 0.42 : 0.16);
      group.current.rotation.x += delta * (active ? 0.16 : 0.06);
    }

    if (ring.current) {
      ring.current.rotation.z += delta * (active ? 0.8 : 0.25);
      ring.current.rotation.x += delta * 0.18;
    }

    if (verticalRing.current) {
      verticalRing.current.rotation.y -= delta * (active ? 0.55 : 0.18);
      verticalRing.current.rotation.z += delta * 0.12;
    }

    if (halo.current) {
      const pulse = active ? 1.48 + Math.sin(Date.now() * 0.002 + index) * 0.05 : 1.34;
      halo.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.17, 42, 42]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.42 : 0.18}
          metalness={0.72}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.14}
          reflectivity={0.85}
        />
      </mesh>

      <mesh scale={1.08}>
        <sphereGeometry args={[0.171, 28, 28]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={active ? 0.18 : 0.08} />
      </mesh>

      <mesh ref={halo} scale={1.4}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.15 : 0.06} />
      </mesh>

      <mesh ref={ring} rotation={[1.1, 0.32, 0.45]}>
        <torusGeometry args={[0.34, 0.011, 16, 110]} />
        <meshStandardMaterial
          color={rimColor}
          emissive={rimColor}
          emissiveIntensity={active ? 1.35 : 0.55}
          metalness={0.62}
          roughness={0.2}
        />
      </mesh>

      <mesh ref={verticalRing} rotation={[0.1, 1.25, 0.22]}>
        <torusGeometry args={[0.4, 0.007, 12, 96]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={rimColor}
          emissiveIntensity={active ? 0.7 : 0.26}
          metalness={0.55}
          roughness={0.24}
          transparent
          opacity={active ? 0.44 : 0.18}
        />
      </mesh>

      <mesh position={[-0.055, 0.068, 0.13]} scale={0.35}>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={active ? 0.75 : 0.3}
          metalness={0.2}
          roughness={0.12}
          transparent
          opacity={0.78}
        />
      </mesh>

      <mesh position={[0, -0.22, -0.04]} scale={[1.2, 0.28, 0.45]} rotation={[0, 0, index * 0.2]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color={darkColor} transparent opacity={0.22} />
      </mesh>

      <Text
        position={[0, -0.52, 0.03]}
        fontSize={0.074}
        color="rgba(255,255,255,.72)"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function CoordinationCore({ running, progress }: { running: boolean; progress: number }) {
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const ringOne = useRef<THREE.Mesh>(null);
  const ringTwo = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (core.current) {
      core.current.rotation.x += delta * (running ? 0.58 : 0.22);
      core.current.rotation.y += delta * (running ? 0.76 : 0.28);
    }

    if (shell.current) {
      shell.current.rotation.y -= delta * 0.16;
      shell.current.rotation.z += delta * 0.08;
    }

    if (ringOne.current) ringOne.current.rotation.z += delta * (running ? 0.68 : 0.22);
    if (ringTwo.current) ringTwo.current.rotation.x += delta * (running ? 0.46 : 0.18);
  });

  const intensity = running || progress >= 100 ? 1 : 0.58;

  return (
    <group position={[0, 0.05, 0]}>
      <mesh ref={shell} scale={1.15}>
        <icosahedronGeometry args={[0.62, 2]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.11} />
      </mesh>

      <mesh ref={core} castShadow receiveShadow>
        <octahedronGeometry args={[0.32, 2]} />
        <meshPhysicalMaterial
          color="#34d399"
          emissive="#34d399"
          emissiveIntensity={0.38 * intensity}
          metalness={0.82}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
        />
      </mesh>

      <mesh ref={ringOne} rotation={[1.18, 0.1, 0.3]}>
        <torusGeometry args={[0.72, 0.009, 14, 120]} />
        <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.9 * intensity} transparent opacity={0.62} />
      </mesh>

      <mesh ref={ringTwo} rotation={[0.1, 1.28, 0.1]}>
        <torusGeometry args={[0.92, 0.007, 14, 120]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={0.62 * intensity} transparent opacity={0.42} />
      </mesh>

      <pointLight color="#34d399" intensity={1.3 * intensity} distance={4.8} />
    </group>
  );
}

function NetworkFloor({ running }: { running: boolean }) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * (running ? 0.055 : 0.018);
  });

  return (
    <group position={[0, -1.72, 0]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 3.95, 128]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.105} side={THREE.DoubleSide} />
      </mesh>
      <gridHelper args={[7.8, 20, "#134e4a", "#111827"]} />
    </group>
  );
}

function AgentNetwork({ running, progress }: { running: boolean; progress: number }) {
  const activeIndex = Math.min(5, Math.floor(progress / 18));

  const points: [number, number, number][] = [
    [-2.2, 1.05, -0.32],
    [-0.76, 1.5, 0.48],
    [0.92, 1.05, -0.56],
    [2.22, -0.02, 0.34],
    [0.58, -1.22, -0.24],
    [-1.82, -0.78, 0.42],
  ];

  return (
    <Canvas shadows camera={{ position: [0, 0.42, 5.35], fov: 46 }}>
      <color attach="background" args={["#050712"]} />
      <fog attach="fog" args={["#050712", 5.3, 9.6]} />

      <ambientLight intensity={0.38} />
      <directionalLight position={[-4.2, 4.4, 5.6]} intensity={1.75} color="#ffffff" castShadow />
      <spotLight
        position={[3.4, 3.8, 4.7]}
        angle={0.38}
        penumbra={0.7}
        intensity={3.55}
        color="#34d399"
        castShadow
      />
      <pointLight position={[-3.2, -1.9, 2.8]} intensity={1.7} color="#e879f9" />
      <pointLight position={[3.1, -1.7, 2.4]} intensity={1.35} color="#fbbf24" />

      <Environment preset="city" />
      <Stars radius={58} depth={28} count={840} factor={3.1} saturation={0} fade speed={0.38} />
      <DreiSparkles count={48} scale={[4.6, 2.9, 2.1]} size={1.9} speed={0.22} color="#34d399" />
      <NetworkFloor running={running} />

      <Float speed={1.05} rotationIntensity={0.16} floatIntensity={0.46}>
        <CoordinationCore running={running} progress={progress} />

        {points.map((point, index) => {
          const active = running ? index <= activeIndex : index < 2 || progress >= 100;
          return (
            <AgentOrb
              key={agents[index]?.name ?? index}
              position={point}
              color={agents[index]?.color ?? "#ffffff"}
              active={active}
              label={agents[index]?.name.replace(" Agent", "") ?? `Agent ${index + 1}`}
              index={index}
            />
          );
        })}

        {points.map((point, index) => {
          const nextPoint = points[(index + 1) % points.length];
          const active = running ? index <= activeIndex : progress >= 100 || index < 2;
          return (
            <AgentConnection
              key={`connection-${index}`}
              from={point}
              to={nextPoint}
              color={agents[index]?.color ?? "#34d399"}
              active={active}
              delay={index * 0.13}
            />
          );
        })}

        <DreiLine
          points={[points[0], points[2], points[4], points[0]]}
          color="#ffffff"
          lineWidth={0.9}
          transparent
          opacity={0.18}
        />

        <DreiLine
          points={[points[1], points[3], points[5], points[1]]}
          color="#e879f9"
          lineWidth={0.9}
          transparent
          opacity={0.2}
        />
      </Float>

      <ContactShadows
        position={[0, -1.72, 0]}
        opacity={0.38}
        scale={6.4}
        blur={3}
        far={5.2}
        color="#000000"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={running ? 0.58 : 0.22}
        maxPolarAngle={Math.PI / 1.72}
        minPolarAngle={Math.PI / 3.9}
      />
    </Canvas>
  );
}

function DetailCore({ color, running }: { color: string; running: boolean }) {
  const group = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.x += delta * (running ? 0.3 : 0.12);
      group.current.rotation.y += delta * (running ? 0.55 : 0.22);
    }

    if (orbit.current) {
      orbit.current.rotation.y -= delta * (running ? 0.9 : 0.35);
    }
  });

  return (
    <group>
      <group ref={group}>
        <mesh castShadow receiveShadow>
          <torusKnotGeometry args={[0.62, 0.11, 220, 26]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={running ? 0.42 : 0.24}
            metalness={0.86}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.16}
          />
        </mesh>

        <mesh scale={1.02}>
          <torusKnotGeometry args={[0.62, 0.112, 150, 16]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.13} />
        </mesh>

        <mesh scale={0.5}>
          <icosahedronGeometry args={[0.68, 2]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.35} wireframe transparent opacity={0.6} />
        </mesh>
      </group>

      <group ref={orbit}>
        {[1.25, -1.25, 0.85, -0.85].map((value, index) => (
          <mesh key={index} position={[value, Math.sin(index) * 0.7, 0]}>
            <sphereGeometry args={[0.055, 24, 24]} />
            <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.1} />
          </mesh>
        ))}

        <DreiLine
          points={[
            [-1.35, -0.25, 0],
            [-0.4, 0.75, 0],
            [0.55, -0.4, 0],
            [1.35, 0.28, 0],
          ]}
          color={color}
          lineWidth={2}
          transparent
          opacity={0.75}
        />
      </group>
    </group>
  );
}

function DetailScene({ color = "#34d399", running }: { color?: string; running: boolean }) {
  return (
    <Canvas shadows camera={{ position: [0, 0, 4.4], fov: 43 }}>
      <color attach="background" args={["#050712"]} />
      <fog attach="fog" args={["#050712", 4.6, 8.5]} />

      <ambientLight intensity={0.34} />
      <directionalLight position={[-3.5, 3.5, 4]} intensity={1.8} color="#ffffff" castShadow />
      <spotLight position={[2.8, 3.2, 3.4]} angle={0.42} penumbra={0.75} intensity={4.1} color={color} castShadow />
      <pointLight position={[-2.2, -1.6, 2.2]} intensity={1.8} color="#e879f9" />
      <pointLight position={[2.2, -1.8, 1.6]} intensity={1.25} color="#fbbf24" />

      <Environment preset="city" />
      <Stars radius={55} depth={24} count={850} factor={3.1} saturation={0} fade speed={0.62} />
      <DreiSparkles count={42} scale={[3.2, 2.2, 1.4]} size={2.1} speed={0.35} color={color} />

      <Float speed={2.1} rotationIntensity={0.55} floatIntensity={1.15}>
        <DetailCore color={color} running={running} />
      </Float>

      <ContactShadows position={[0, -1.42, 0]} opacity={0.42} scale={4.6} blur={2.7} far={4} color="#000000" />

      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={running ? 1.08 : 0.38} />
    </Canvas>
  );
}

function FocusModal({
  focus,
  onClose,
  running,
  progress,
  mission,
}: {
  focus: FocusPayload | null;
  onClose: () => void;
  running: boolean;
  progress: number;
  mission: MissionResult;
}) {
  return (
    <AnimatePresence>
      {focus && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.86, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.86, y: 28 }}
            transition={{ type: "spring", stiffness: 135, damping: 18 }}
            onClick={(event) => event.stopPropagation()}
            className="glass-panel focus-modal-grid w-full max-w-6xl rounded-[2rem] p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-100/65">{focus.type}</p>
                <h3 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">{focus.title}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">{focus.subtitle}</p>
              </div>

              <button
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-white/[.06] p-3 text-white/65 transition hover:bg-white/[.12] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
              <div className="focus-3d-viewport relative h-[390px] overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/35">
                <DetailScene color={focus.color} running={running} />

                <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
                  <p className="text-xs text-white/45">Execution Progress</p>
                  <p className="text-2xl font-semibold">{running ? progress : mission.execution}%</p>
                </div>

                <div className="absolute bottom-4 right-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-emerald-100 backdrop-blur-xl">
                  {running ? "Live Movement Active" : "Generated State"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">Live Operational Detail</p>
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
                      {focus.status ?? "Active"}
                    </span>
                  </div>
                  <p className="text-sm leading-7 text-white/60">{focus.detail}</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {focus.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm text-white/55">{metric.label}</p>
                        <p className="font-semibold text-emerald-100">{metric.value}</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          animate={{ width: `${Math.max(0, Math.min(100, metric.level))}%` }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-fuchsia-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-5">
                  <p className="mb-2 font-semibold text-fuchsia-100">Mission Context</p>
                  <p className="text-sm leading-7 text-white/60">{mission.summary}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function statusColor(status: Status) {
  if (status === "Complete") return "border-emerald-300/40 bg-emerald-300/10 text-emerald-100";
  if (status === "Executing") return "border-amber-300/45 bg-amber-300/10 text-amber-100";
  if (status === "Escalating") return "border-rose-300/50 bg-rose-300/10 text-rose-100";
  if (status === "Routing") return "border-fuchsia-300/45 bg-fuchsia-300/10 text-fuchsia-100";
  return "border-white/10 bg-white/[.04] text-white/55";
}

export default function Home() {
  const [tick, setTick] = useState(0);
  const [focus, setFocus] = useState<FocusPayload | null>(null);
  const [panelRef, bounds] = useMeasure();
  const queueRef = useRef<HTMLDivElement | null>(null);
  const operatorRef = useRef<HTMLDivElement | null>(null);

  const {
    prompt,
    department,
    activePrompt,
    activeDepartment,
    hasGenerated,
    running,
    progress,
    feed,
    message,
    operatorOpen,
    chatQuestion,
    chatAnswer,
    setDraft,
    setState,
    commitDraft,
  } = useOpsStore();

  const mission = useMemo(() => {
    if (running) return createMission(prompt, department, progress, tick);
    if (hasGenerated) return createMission(activePrompt, activeDepartment, 100, Math.floor(tick / 3));
    return emptyMission();
  }, [running, hasGenerated, prompt, department, activePrompt, activeDepartment, progress, tick]);

  const preview = useMemo(() => createMission(prompt, department, 100, 0), [prompt, department]);
  const lineData = useMemo(() => missionLineData(mission), [mission]);
  const barData = useMemo(() => queueBarData(mission), [mission]);
  const ringData = useMemo(() => healthRingData(mission), [mission]);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), running ? 950 : 3200);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    gsap.to(".ops-glow", {
      boxShadow: "0 0 55px rgba(52,211,153,.22)",
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
  }, []);

  useEffect(() => {
    interact(".workflow-node").draggable({
      listeners: {
        move(event) {
          const target = event.target as HTMLElement;
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));
        },
      },
    });

    interact(".operator-widget").draggable({
      allowFrom: ".operator-handle",
      modifiers: [interact.modifiers.restrictRect({ restriction: "parent", endOnly: false })],
      listeners: {
        move(event) {
          const target = event.target as HTMLElement;
          const x = (parseFloat(target.getAttribute("data-x") || "0") || 0) + event.dx;
          const y = (parseFloat(target.getAttribute("data-y") || "0") || 0) + event.dy;
          target.style.transform = `translate(${x}px, ${y}px)`;
          target.setAttribute("data-x", String(x));
          target.setAttribute("data-y", String(y));
        },
      },
    });

    return () => {
      interact(".workflow-node").unset();
      interact(".operator-widget").unset();
    };
  }, []);

  useEffect(() => {
    if (!queueRef.current) return;
    const sortable = Sortable.create(queueRef.current, {
      animation: 180,
      handle: ".queue-handle",
      ghostClass: "opacity-40",
    });

    return () => sortable.destroy();
  }, [mission.queue.length]);

  const runAutonomousOps = () => {
    setState({
      running: true,
      progress: 0,
      feed: [],
      message: "Autonomous operations workforce launching.",
      hasGenerated: false,
      chatAnswer: "Execution is running. Agents are routing, queueing, escalating, and updating operational state.",
    });

    stages.forEach((stage, index) => {
      window.setTimeout(() => {
        useOpsStore.setState((state) => ({
          progress: Math.round(((index + 1) / stages.length) * 100),
          message: stage,
          feed: [stage, ...state.feed].slice(0, 8),
        }));
      }, index * 430);
    });

    window.setTimeout(() => {
      commitDraft();
      setState({
        running: false,
        progress: 100,
        message: "Autonomous operations synchronized.",
        feed: createMission(prompt, department, 100, 0).feed,
        chatAnswer: createMission(prompt, department, 100, 0).executive,
      });

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.78 },
      });
    }, stages.length * 430 + 460);
  };

  const loadDemo = () => {
    setDraft({
      prompt: starterPrompt,
      department: "Customer Operations",
      message: "Demo loaded into intake. Run autonomous operations to generate execution.",
      chatAnswer: "Demo loaded. Press Run Autonomous Operations to create the execution state.",
    });
  };

  const loadRandom = () => {
    const scenario = randomScenario();
    setDraft({
      prompt: scenario.prompt,
      department: scenario.department,
      message: "Random operational scenario loaded into intake. Run autonomous operations to generate execution.",
      chatAnswer: `Loaded a ${scenario.department} scenario. Press Run Autonomous Operations to coordinate the agents.`,
    });
  };

  const askOperator = () => {
    const q = chatQuestion.toLowerCase();

    if (q.includes("random") || q.includes("demo")) {
      loadRandom();
      return;
    }

    if (q.includes("run") || q.includes("execute") || q.includes("launch")) {
      runAutonomousOps();
      return;
    }

    if (!hasGenerated && !running) {
      setState({
        chatAnswer: "No execution state exists yet. Run autonomous operations first, then I can answer from the generated workflow.",
      });
      return;
    }

    if (q.includes("risk")) {
      setState({ chatAnswer: `Primary risk: ${mission.risks[0]}. Current risk pressure is ${mission.risk}%.` });
      return;
    }

    if (q.includes("queue") || q.includes("task")) {
      setState({ chatAnswer: `The execution queue has ${mission.queue.length} tasks. Highest priority: ${mission.queue[0].title}.` });
      return;
    }

    setState({ chatAnswer: mission.executive });
  };

  return (
    <main className={`min-h-screen overflow-hidden bg-[#050712] text-white ${running ? "calculating" : ""}`}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(52,211,153,.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(217,70,239,.15),transparent_32%),radial-gradient(circle_at_50%_95%,rgba(251,191,36,.10),transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
      </div>

      <section className="relative z-10 mx-auto flex max-w-7xl flex-col gap-7 px-5 py-6 lg:px-8">
        <nav className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="ops-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/15 ring-1 ring-emerald-200/35">
              <Command className="h-5 w-5 text-emerald-100" />
            </div>
            <div>
              <p className="text-sm text-white/50">AI Autonomous Operations</p>
              <h1 className="text-lg font-semibold tracking-tight">Operations Command Center</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
              {running ? "Operational workforce active" : "Agents standing by"}
            </span>
            <span className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-300/10 px-4 py-2 text-sm text-fuchsia-100">
              {message}
            </span>
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-[2rem] p-6 md:p-8"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-100">
              <Sparkles className="h-4 w-4" />
              AI operational workforce simulation
            </div>

            <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              From business issue to autonomous operational execution.
            </h2>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/62">
              Enter an operational disruption, launch the agent workforce, and watch routing, queue creation,
              escalation, workflow state movement, and executive visibility happen together.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {[
                [`${mission.health}%`, "Execution health"],
                [`${mission.autonomy}%`, "Autonomy signal"],
                [`${mission.execution}%`, "Workflow movement"],
                [mission.revenueImpact, "Value protected"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-black/25 p-4">
                  <p className="text-2xl font-semibold text-emerald-50">{value}</p>
                  <p className="mt-1 text-sm text-white/45">{label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            ref={panelRef}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel overflow-hidden rounded-[2rem] p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">3D Agent Coordination Network</p>
                <h3 className="text-2xl font-semibold">Live Routing Mesh</h3>
              </div>
              <Network className="h-6 w-6 text-fuchsia-200" />
            </div>

            <button
              onClick={() =>
                setFocus({
                  type: "3D Agent Network",
                  title: "Live Routing Mesh",
                  subtitle: "A 3D view of agent coordination, workflow routing, and autonomous execution movement.",
                  status: running ? "Executing" : hasGenerated ? "Complete" : "Waiting",
                  color: "#34d399",
                  detail: "This network represents agents coordinating intake, routing, operations, risk, escalation, and executive visibility. During execution, active nodes illuminate as operational work moves through the system.",
                  metrics: [
                    { label: "Execution Health", value: `${mission.health}%`, level: mission.health },
                    { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                    { label: "Workflow Movement", value: `${mission.execution}%`, level: mission.execution },
                    { label: "Risk Control", value: `${100 - mission.risk}%`, level: 100 - mission.risk },
                  ],
                })
              }
              className="agent-network-upgrade h-[430px] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30 text-left transition hover:border-emerald-300/40 md:h-[500px]"
            >
              <AgentNetwork running={running} progress={progress} />
            </button>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-white/40">Network Width</p>
                <p className="text-lg font-semibold">{Math.round(bounds.width || 0)}px</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-white/40">Active Agents</p>
                <p className="text-lg font-semibold">{running ? agents.length : hasGenerated ? agents.length : 0}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs text-white/40">Progress</p>
                <p className="text-lg font-semibold">{progress}%</p>
              </div>
            </div>
          </motion.section>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <section className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Target className="h-6 w-6 text-amber-200" />
              <div>
                <p className="text-sm text-white/50">Operations Intake Layer</p>
                <h3 className="text-2xl font-semibold">Define the operational issue</h3>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <button onClick={loadRandom} className="rounded-3xl border border-emerald-300/30 bg-emerald-300/10 p-4 text-left transition hover:bg-emerald-300/20">
                <Sparkles className="mb-3 h-5 w-5 text-emerald-100" />
                <p className="font-semibold">Generate Random Scenario</p>
                <p className="mt-2 text-sm leading-6 text-white/55">Loads a new operational issue into the intake only.</p>
              </button>
              <button onClick={loadDemo} className="rounded-3xl border border-fuchsia-300/30 bg-fuchsia-300/10 p-4 text-left transition hover:bg-fuchsia-300/20">
                <Database className="mb-3 h-5 w-5 text-fuchsia-100" />
                <p className="font-semibold">Use Demo</p>
                <p className="mt-2 text-sm leading-6 text-white/55">Loads a clean customer escalation demo.</p>
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(event) => setDraft({ prompt: event.target.value, message: "Intake changed. Run autonomous operations to generate execution." })}
              className="min-h-[210px] w-full resize-none rounded-3xl border border-white/10 bg-black/35 p-5 text-sm leading-7 text-white outline-none focus:border-emerald-300/40 focus:ring-4 focus:ring-emerald-300/10"
            />

            <div className="mt-5">
              <label className="mb-2 block text-sm text-white/50">Operational department</label>
              <select
                value={department}
                onChange={(event) => setDraft({ department: event.target.value, message: `${event.target.value} selected. Run autonomous operations to generate execution.` })}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
              >
                {departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <button
              onClick={runAutonomousOps}
              disabled={running}
              className="group relative mt-5 flex w-full items-center justify-center overflow-hidden rounded-full border border-emerald-200/45 bg-gradient-to-r from-emerald-300 via-amber-300 to-fuchsia-300 px-6 py-4 font-semibold text-slate-950 shadow-[0_0_45px_rgba(52,211,153,.22)] transition hover:scale-[1.01] disabled:opacity-70"
            >
              <span className="absolute inset-0 translate-x-[-130%] bg-gradient-to-r from-transparent via-white/55 to-transparent transition duration-700 group-hover:translate-x-[130%]" />
              <span className="relative flex items-center gap-3">
                {running ? "Running autonomous operations..." : "Run Autonomous Operations"}
                {running ? <CircleDot className="h-5 w-5 animate-pulse" /> : <Play className="h-5 w-5" />}
              </span>
            </button>

            <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-sm font-semibold text-emerald-100">Draft preview</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {preview.domain}: {preview.objective}
              </p>
            </div>
          </section>

                    <section className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Agent Activity Stream</p>
                <h3 className="text-2xl font-semibold">Operational workforce</h3>
              </div>
              <Bot className="h-6 w-6 text-fuchsia-200" />
            </div>

            <div className="space-y-3">
              {agents.map((agent, index) => {
                const Icon = agent.icon;
                const active = running ? index <= Math.floor(progress / 17) : hasGenerated;

                return (
                  <motion.div
                    key={agent.name}
                    whileHover={{ y: -2 }}
                    onClick={() =>
                      setFocus({
                        type: "Agent Node",
                        title: agent.name,
                        subtitle: active ? "Active operational workforce member" : "Agent standing by for execution.",
                        status: active ? "Executing" : "Waiting",
                        color: agent.color,
                        detail: `${agent.role}. Current mission domain: ${mission.domain}. This node contributes to routing, execution state, risk monitoring, and executive visibility.`,
                        metrics: [
                          { label: "Mission Health", value: `${mission.health}%`, level: mission.health },
                          { label: "Agent Activation", value: active ? "Active" : "Standby", level: active ? 86 : 18 },
                          { label: "Workflow Movement", value: `${mission.execution}%`, level: mission.execution },
                          { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                        ],
                      })
                    }
                    className={`cursor-pointer rounded-3xl border p-4 transition hover:border-emerald-300/40 ${
                      active ? "border-emerald-300/35 bg-emerald-300/10" : "border-white/10 bg-black/25"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${agent.color}22` }}>
                        <Icon className="h-5 w-5" style={{ color: agent.color }} />
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold">{agent.name}</p>
                        <p className="text-sm leading-6 text-white/52">{agent.role}</p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs ${active ? "bg-emerald-300/15 text-emerald-100" : "bg-white/5 text-white/40"}`}>
                        {active ? "Active" : "Standby"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>


        </div>

                <section className="grid gap-6 lg:grid-cols-3">
          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() =>
              setFocus({
                type: "Mission Health Graph",
                title: "Mission Health",
                subtitle: "A live readiness gauge showing whether the autonomous workforce is stabilizing the operation.",
                status: running ? "Executing" : hasGenerated ? "Complete" : "Waiting",
                color: "#34d399",
                detail:
                  "Mission Health combines workflow movement, autonomy signal, risk pressure, execution state, and generated operational context. During generation, the ring moves as agents route work, create queues, flag risks, and prepare executive visibility.",
                metrics: [
                  { label: "Mission Health", value: `${mission.health}%`, level: mission.health },
                  { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                  { label: "Execution Movement", value: `${mission.execution}%`, level: mission.execution },
                  { label: "Risk Control", value: `${100 - mission.risk}%`, level: 100 - mission.risk },
                ],
              })
            }
            className="glass-panel hero-card-3d cursor-pointer rounded-[2rem] p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <Gauge className="h-6 w-6 text-emerald-200" />
              <h3 className="text-2xl font-semibold">Mission Health</h3>
            </div>

            <div className="relative mx-auto flex h-[330px] max-w-[340px] items-center justify-center">
              <motion.div
                animate={running ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 22, repeat: running ? Infinity : 0, ease: "linear" }}
                className="absolute inset-0 rounded-full p-[2px]"
                style={{
                  background: `conic-gradient(rgba(52,211,153,.95) ${mission.health * 3.6}deg, rgba(244,63,94,.24) 0deg)`,
                }}
              >
                <div className="h-full w-full rounded-full bg-[#07111a]" />
              </motion.div>

              <div className="absolute inset-8 rounded-full border border-white/10 bg-black/30 shadow-[inset_0_0_50px_rgba(52,211,153,.11)]" />

              <motion.div
                animate={running ? { scale: [1, 1.025, 1] } : { scale: 1 }}
                transition={{ duration: 2.4, repeat: running ? Infinity : 0 }}
                className="relative z-10 text-center"
              >
                <p className="text-6xl font-semibold text-emerald-50">{mission.health}%</p>
                <p className="mt-2 text-sm text-white/45">Execution health</p>

                <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-100">
                    A {mission.autonomy}%
                  </span>
                  <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-2 text-fuchsia-100">
                    E {mission.execution}%
                  </span>
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-amber-100">
                    R {mission.risk}%
                  </span>
                </div>
              </motion.div>

              <div className="pointer-events-none absolute inset-[-18px] rounded-full bg-emerald-300/10 blur-2xl" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() =>
              setFocus({
                type: "Live Forecasting Graph",
                title: "Live Metrics & Forecasting",
                subtitle: "A marker-based operational forecast showing how the workflow moves from intake to report.",
                status: running ? "Executing" : hasGenerated ? "Complete" : "Waiting",
                color: "#fbbf24",
                detail:
                  "This graph tracks the operational execution path: intake, routing, queue creation, risk state, active execution, and reporting. Hovering over the markers explains what each part of the workflow means.",
                metrics: [
                  { label: "Execution Health", value: `${mission.health}%`, level: mission.health },
                  { label: "Workflow Movement", value: `${mission.execution}%`, level: mission.execution },
                  { label: "Risk Control", value: `${100 - mission.risk}%`, level: 100 - mission.risk },
                  { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                ],
              })
            }
            className="glass-panel hero-card-3d cursor-pointer rounded-[2rem] p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <Activity className="h-6 w-6 text-amber-200" />
              <h3 className="text-2xl font-semibold">Live Metrics & Forecasting</h3>
            </div>

            <div className="h-[330px]">
              <LineChartCanvas
                key={`line-${running ? `${Math.floor(tick / 2)}-${progress}` : `${Math.floor(tick / 4)}-${hasGenerated}`}`}
                data={lineData}
                options={chartOptions}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-white/42">
              Hover graph markers to inspect intake, routing, queue, risk, execution, and reporting signals.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            onClick={() =>
              setFocus({
                type: "Operational Throughput Graph",
                title: "Operational Throughput",
                subtitle: "A live bar graph showing health, autonomy, execution, and risk control in the operation.",
                status: running ? "Executing" : hasGenerated ? "Complete" : "Waiting",
                color: "#e879f9",
                detail:
                  "This graph shows the operating capacity of the autonomous workforce. Each bar represents a core part of execution: mission health, autonomy, workflow execution, and risk control.",
                metrics: [
                  { label: "Health", value: `${mission.health}%`, level: mission.health },
                  { label: "Autonomy", value: `${mission.autonomy}%`, level: mission.autonomy },
                  { label: "Execution", value: `${mission.execution}%`, level: mission.execution },
                  { label: "Risk Control", value: `${100 - mission.risk}%`, level: 100 - mission.risk },
                ],
              })
            }
            className="glass-panel hero-card-3d cursor-pointer rounded-[2rem] p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <Zap className="h-6 w-6 text-fuchsia-200" />
              <h3 className="text-2xl font-semibold">Operational Throughput</h3>
            </div>

            <div className="h-[330px]">
              <Bar
                key={`bar-${running ? `${Math.floor(tick / 2)}-${progress}` : `${Math.floor(tick / 4)}-${hasGenerated}`}`}
                data={barData}
                options={chartOptions}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-white/42">
              Hover bars to view the real-time operational meaning of each signal.
            </p>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-emerald-200" />
              <h3 className="text-2xl font-semibold">Operational Queue Dashboard</h3>
            </div>

            <div ref={queueRef} className="space-y-3">
              {mission.queue.map((item) => (
                <div
                  key={item.title}
                  onClick={() =>
                    setFocus({
                      type: "Execution Queue Item",
                      title: item.title,
                      subtitle: `${item.owner} • Priority: ${item.priority}`,
                      status: item.status,
                      color: item.status === "Complete" ? "#34d399" : item.status === "Escalating" ? "#fb7185" : "#fbbf24",
                      detail: item.detail,
                      metrics: [
                        { label: "Execution Health", value: `${mission.health}%`, level: mission.health },
                        { label: "Queue Movement", value: item.status, level: item.status === "Complete" ? 100 : item.status === "Executing" ? 72 : item.status === "Routing" ? 44 : 18 },
                        { label: "Risk Pressure", value: `${mission.risk}%`, level: mission.risk },
                        { label: "Workflow Execution", value: `${mission.execution}%`, level: mission.execution },
                      ],
                    })
                  }
                  className="cursor-pointer rounded-3xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-300/35 hover:bg-emerald-300/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="queue-handle cursor-grab rounded-xl border border-white/10 bg-white/[.04] p-2">
                      <Grip className="h-4 w-4 text-white/40" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold">{item.title}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs ${statusColor(item.status)}`}>{item.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-emerald-100/80">{item.owner} - {item.priority}</p>
                      <p className="mt-2 text-sm leading-6 text-white/55">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Radar className="h-6 w-6 text-rose-200" />
              <h3 className="text-2xl font-semibold">Risk & Escalation Layer</h3>
            </div>

            <div className="space-y-3">
              {mission.risks.map((risk) => (
                <div
                  key={risk}
                  onClick={() =>
                    setFocus({
                      type: "Risk & Escalation Signal",
                      title: "Predictive Risk Indicator",
                      subtitle: "Risk pressure detected inside the autonomous operations layer.",
                      status: mission.risk > 60 ? "Escalating" : "Executing",
                      color: "#fb7185",
                      detail: risk,
                      metrics: [
                        { label: "Risk Pressure", value: `${mission.risk}%`, level: mission.risk },
                        { label: "Risk Control", value: `${100 - mission.risk}%`, level: 100 - mission.risk },
                        { label: "Execution Health", value: `${mission.health}%`, level: mission.health },
                        { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                      ],
                    })
                  }
                  className="cursor-pointer rounded-3xl border border-rose-300/20 bg-rose-300/10 p-4 transition hover:border-rose-300/50 hover:bg-rose-300/15"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Flame className="h-4 w-4 text-rose-100" />
                    <p className="text-sm font-semibold text-rose-100">Predictive risk indicator</p>
                  </div>
                  <p className="text-sm leading-6 text-white/62">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <GitBranch className="h-6 w-6 text-amber-200" />
              <h3 className="text-2xl font-semibold">Cross-System Coordination Map</h3>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,.16),transparent_28%),radial-gradient(circle_at_80%_72%,rgba(217,70,239,.14),transparent_30%)]" />
              <div className="relative grid gap-4 md:grid-cols-2">
                {mission.workflow.map((node) => (
                  <div
                    key={node.title}
                    onClick={() =>
                      setFocus({
                        type: "Workflow State Node",
                        title: node.title,
                        subtitle: node.system,
                        status: node.status,
                        color: node.status === "Complete" ? "#34d399" : node.status === "Escalating" ? "#fb7185" : "#e879f9",
                        detail: `This workflow node is currently connected to ${node.system}. It reflects live operational state movement as the autonomous workforce routes work across systems.`,
                        metrics: [
                          { label: "Node Signal", value: `${node.signal}%`, level: node.signal },
                          { label: "Execution Health", value: `${mission.health}%`, level: mission.health },
                          { label: "Workflow Movement", value: `${mission.execution}%`, level: mission.execution },
                          { label: "Autonomy Signal", value: `${mission.autonomy}%`, level: mission.autonomy },
                        ],
                      })
                    }
                    className="workflow-node cursor-pointer rounded-3xl border border-emerald-300/20 bg-[#08111a]/85 p-5 shadow-xl backdrop-blur-xl transition hover:border-emerald-300/45"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-semibold">{node.title}</p>
                      <span className={`rounded-full border px-3 py-1 text-xs ${statusColor(node.status)}`}>{node.status}</span>
                    </div>
                    <p className="text-sm text-white/50">{node.system}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div animate={{ width: `${node.signal}%` }} className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-fuchsia-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Layers3 className="h-6 w-6 text-fuchsia-200" />
              <h3 className="text-2xl font-semibold">System Activity Stream</h3>
            </div>

            <div className="grid gap-3">
              {(running ? feed : mission.feed).slice(0, 8).map((item, index) => (
                <motion.div
                  key={`${item}-${index}`}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm text-white/68">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Box className="h-6 w-6 text-emerald-200" />
              <h3 className="text-2xl font-semibold">Autonomous Action Center</h3>
            </div>
            <div className="grid gap-3">
              {mission.actions.map((action) => (
                <div key={action} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                  <span className="text-sm text-white/70">{action}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Rocket className="h-6 w-6 text-amber-200" />
              <h3 className="text-2xl font-semibold">Executive Visibility Panel</h3>
            </div>

            <p className="text-sm leading-7 text-white/62">{mission.summary}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ["Health", `${mission.health}%`],
                ["Autonomy", `${mission.autonomy}%`],
                ["Risk", `${mission.risk}%`],
                ["Execution", `${mission.execution}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <p className="text-xs text-white/40">{label}</p>
                  <p className="mt-1 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <FocusModal
        focus={focus}
        onClose={() => setFocus(null)}
        running={running}
        progress={progress}
        mission={mission}
      />

      <div className="pointer-events-none fixed inset-0 z-40">
        <motion.div
          ref={operatorRef}
          className="operator-widget pointer-events-auto absolute bottom-6 right-6 w-[92vw] max-w-[440px]"
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            {!operatorOpen ? (
              <motion.button
                key="bubble"
                onClick={() => setState({ operatorOpen: true })}
                className="flex items-center gap-4 rounded-full border border-emerald-300/35 bg-[#07111a]/95 p-3 pr-5 shadow-[0_0_55px_rgba(52,211,153,.20)] backdrop-blur-2xl"
              >
                <span className="operator-handle cursor-grab rounded-full border border-white/10 bg-white/[.06] p-3">
                  <Move className="h-4 w-4 text-white/55" />
                </span>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-300 text-slate-950 shadow-[0_0_38px_rgba(52,211,153,.75)]">
                  <Bot className="h-6 w-6" />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-semibold">Operations AI</span>
                  <span className="block text-xs text-white/50">Create, run, or ask</span>
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="window"
                initial={{ opacity: 0, scale: 0.92, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 18 }}
                className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111a]/95 shadow-[0_0_80px_rgba(52,211,153,.16)] backdrop-blur-2xl"
              >
                <div className="operator-handle flex cursor-grab items-center justify-between border-b border-white/10 bg-white/[.04] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Operations AI</p>
                      <p className="text-xs text-white/45">Autonomous execution assistant</p>
                    </div>
                  </div>
                  <button onClick={() => setState({ operatorOpen: false })} className="rounded-xl border border-white/10 bg-white/[.05] p-2 text-white/60">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <input
                    value={chatQuestion}
                    onChange={(event) => setState({ chatQuestion: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") askOperator();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-300/45"
                  />

                  <button onClick={askOperator} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300/35 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100">
                    Execute Operator Request
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="max-h-[220px] overflow-y-auto rounded-3xl border border-white/10 bg-black/25 p-5 text-sm leading-7 text-white/65">
                    {chatAnswer}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <button onClick={loadRandom} className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-white/65">Demo</button>
                    <button onClick={runAutonomousOps} className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-white/65">Run</button>
                    <button onClick={() => setState({ chatAnswer: `Risk pressure is ${mission.risk}%. Primary risk: ${mission.risks[0]}.` })} className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-white/65">Risk</button>
                    <button onClick={() => setState({ chatAnswer: mission.executive })} className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-white/65">Exec</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
