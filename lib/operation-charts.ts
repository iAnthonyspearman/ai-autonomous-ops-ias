import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import type { MissionResult } from "@/types/operations";

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

export function missionLineData(mission: MissionResult) {
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

export function queueBarData(mission: MissionResult) {
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

export function healthRingData(mission: MissionResult) {
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

export const chartOptions: any = {
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

export const doughnutOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "74%",
  plugins: {
    legend: { position: "bottom", labels: { color: "rgba(255,255,255,.72)" } },
  },
};
