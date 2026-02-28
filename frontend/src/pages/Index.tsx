import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAll, AllData } from "@/lib/api";
import ServerInfoBar from "@/components/dashboard/ServerInfoBar";
import StatusBadges from "@/components/dashboard/StatusBadges";
import CpuCard from "@/components/dashboard/CpuCard";
import MemoryCard from "@/components/dashboard/MemoryCard";
import FilesystemCard from "@/components/dashboard/FilesystemCard";
import TopProcessCard from "@/components/dashboard/TopProcessCard";
import StorageCard from "@/components/dashboard/StorageCard";
import NetworkCard from "@/components/dashboard/NetworkCard";
import MonitoringCard from "@/components/dashboard/MonitoringCard";
import LocationCard from "@/components/dashboard/LocationCard";
import ContainerCard from "@/components/dashboard/ContainerCard";
import CronJobCard from "@/components/dashboard/CronJobCard";
import AdvancedMetricsCard from "@/components/dashboard/AdvancedMetricsCard";
import { Fail2banCard, ProcessMonitorCard, PortCheckCard, GpuCard } from "@/components/dashboard/ExtraMonitorCards";
import { Download } from "lucide-react";

const parsePercent = (s: string | undefined): number => {
  if (!s) return 0;
  return parseFloat(s.replace("%", ""));
};
const parseGB = (s: string | undefined): number => {
  if (!s) return 0;
  const m = s.match(/([\d.]+)/);
  if (!m) return 0;
  let val = parseFloat(m[1]);
  if (s.includes("KB")) val /= (1024 * 1024);
  else if (s.includes("MB")) val /= 1024;
  else if (s.includes("TB")) val *= 1024;
  else if (s.includes(" B") && !s.includes("GB")) val /= (1024 * 1024 * 1024);
  return val; // Returns in GB
};
const CHART_COLORS = [
  "hsl(var(--chart-blue))",
  "hsl(var(--chart-purple))",
  "hsl(var(--chart-green))",
  "hsl(var(--chart-orange))",
  "hsl(var(--chart-cyan))",
];

// ── CSV export helper ─────────────────────────────────────────────────────────
function buildCSV(data: AllData): string {
  const rows: string[] = [];
  const ts = new Date().toISOString();

  rows.push(`# Server Dashboard Export — ${ts}`);
  rows.push("");

  // CPU
  rows.push("## CPU");
  rows.push("Metric,Value");
  rows.push(`Total Usage,${data.cpu.usage}`);
  rows.push(`User,${data.cpu.user}`);
  rows.push(`System,${data.cpu.sys}`);
  rows.push(`Idle,${data.cpu.idle}`);
  if (data.cpu.per_core) {
    rows.push("");
    rows.push("Core,Usage %");
    data.cpu.per_core.forEach((c) => rows.push(`Core ${c.core},${c.percent.toFixed(2)}`));
  }
  rows.push("");

  // Memory
  rows.push("## Memory");
  rows.push("Metric,Value");
  rows.push(`Total,${data.memory.total}`);
  rows.push(`Used,${data.memory.used}`);
  rows.push(`Free,${data.memory.free}`);
  rows.push(`Usage %,${data.memory.usage}`);
  rows.push(`Swap Total,${data.memory.swap_total}`);
  rows.push(`Swap Used,${data.memory.swap_used}`);
  rows.push("");

  // Load Average & Uptime
  rows.push("## Load Average & Uptime");
  rows.push("Metric,Value");
  rows.push(`Load 1m,${data.load_avg["1m"]}`);
  rows.push(`Load 5m,${data.load_avg["5m"]}`);
  rows.push(`Load 15m,${data.load_avg["15m"]}`);
  rows.push(`Uptime,${data.uptime.formatted}`);
  rows.push("");

  // Top CPU Processes
  rows.push("## Top CPU Processes");
  rows.push("PID,Name,Memory,CPU Time");
  (data.top_cpu ?? []).forEach((p) =>
    rows.push(`${p.pid},"${p.name}",${p.memory},${p.cpu_time ?? "—"}`)
  );
  rows.push("");

  // Top RAM Processes
  rows.push("## Top RAM Processes");
  rows.push("PID,Name,Memory");
  (data.top_ram ?? []).forEach((p) =>
    rows.push(`${p.pid},"${p.name}",${p.memory}`)
  );
  rows.push("");

  // Network
  rows.push("## Network");
  rows.push("Interface,Received,Sent");
  (data.network ?? []).forEach((n) =>
    rows.push(`"${n.interface}",${n.received},${n.sent}`)
  );
  rows.push("");

  // Disk Usage
  rows.push("## Disk Usage");
  rows.push("Path,FS Type,Total,Used,Free,Used %");
  (data.disk_usage ?? []).forEach((d) =>
    rows.push(`"${d.path}","${d.fstype}",${d.total},${d.used},${d.free},${d.used_percent}%`)
  );
  rows.push("");

  // Docker
  if (data.docker && data.docker.length > 0) {
    rows.push("## Docker Containers");
    rows.push("Name,Image,State,Status,Ports");
    data.docker.forEach((c) =>
      rows.push(`"${c.name}","${c.image}","${c.state}","${c.status}","${c.ports}"`)
    );
    rows.push("");
  }

  // Port Check
  if (data.portcheck && data.portcheck.length > 0) {
    rows.push("## Port Check");
    rows.push("Port,Service,Open");
    data.portcheck.forEach((p) =>
      rows.push(`${p.port},"${p.service}",${p.open ? "Yes" : "No"}`)
    );
    rows.push("");
  }

  return rows.join("\n");
}

function downloadCSV(data: AllData) {
  const csv = buildCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  a.href = url;
  a.download = `server-logs-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Page ──────────────────────────────────────────────────────────────────────

const Index = () => {
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);

  const { data, isLoading, isError } = useQuery<AllData>({
    queryKey: ["all"],
    queryFn: fetchAll,
    refetchInterval: refreshInterval,
  });

  useEffect(() => {
    if (data) {
      console.log("Real-time Server Metrics Update:", data);
    }
  }, [data]);

  const cpuPercent = parsePercent(data?.cpu.usage);
  const cpuUser = parsePercent(data?.cpu.user);
  const cpuSys = parsePercent(data?.cpu.sys);
  const memPercent = parsePercent(data?.memory.usage);
  const swapPct = (() => {
    if (!data?.memory) return 0;
    const used = parseGB(data.memory.swap_used);
    const total = parseGB(data.memory.swap_total);
    return total ? parseFloat(((used / total) * 100).toFixed(1)) : 0;
  })();

  const topCpuDisplayList = (data?.top_cpu ?? []).map((p, i) => ({
    name: p.name,
    memory: p.memory,
    pid: p.pid,
    color: CHART_COLORS[i % CHART_COLORS.length],
    cpu_time: p.cpu_time,
  }));
  const topRamDisplayList = (data?.top_ram ?? []).map((p, i) => ({
    name: p.name,
    memory: p.memory,
    pid: p.pid,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const loadAvgStr = data?.load_avg
    ? `${data.load_avg["1m"]} ${data.load_avg["5m"]} ${data.load_avg["15m"]}`
    : "—";

  const osArch = data?.sysinfo
    ? `${data.sysinfo.os}/${data.sysinfo.arch}`
    : "—";

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-4">
        <h1 className="text-xl font-bold text-foreground">Server Dashboard</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md border border-border">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-sm text-foreground outline-none cursor-pointer"
            >
              <option value={1000} className="bg-background">1s</option>
              <option value={5000} className="bg-background">5s</option>
              <option value={10000} className="bg-background">10s</option>
              <option value={60000} className="bg-background">1m</option>
              <option value={600000} className="bg-background">10m</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? "bg-yellow-400" : isError ? "bg-destructive" : "bg-accent"
                }`}
            />
            <span className="text-xs text-muted-foreground w-16 text-right">
              {isLoading ? "Loading…" : isError ? "Offline" : "Live"}
            </span>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <StatusBadges
        hostname={data?.sysinfo?.hostname}
        uptime={data?.uptime.formatted}
        uptimePct={osArch}
      />

      {/* Server Info Bar */}
      <ServerInfoBar
        sysinfo={data?.sysinfo}
        uptime={data?.uptime.formatted ?? "—"}
        loadAvg={loadAvgStr}
        agentVersion="v1.0.0"
        activeConnections={data?.sockets?.used}
      />

      {/* Unified 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 [&>.grid-item>div]:h-full">
        {/* Row 1 */}
        <div className="grid-item">
          <CpuCard percentage={cpuPercent} user={cpuUser} system={cpuSys} allData={data} />
        </div>
        <div className="grid-item">
          <MemoryCard
            percentage={memPercent}
            used={parseGB(data?.memory.used)}
            cached={0}
            swap={swapPct}
            allData={data}
          />
        </div>
        <div className="grid-item">
          <GpuCard gpuData={data?.gpu} />
        </div>

        {/* Row 2 */}
        <div className="grid-item">
          <AdvancedMetricsCard allData={data} />
        </div>
        <div className="grid-item">
          <TopProcessCard
            title="Top CPU"
            processes={topCpuDisplayList}
            rawProcesses={data?.top_cpu}
            showCpuTime
            totalProcesses={data?.process_count}
          />
        </div>
        <div className="grid-item">
          <TopProcessCard
            title="Top RAM"
            processes={topRamDisplayList}
            rawProcesses={data?.top_ram}
            totalProcesses={data?.process_count}
          />
        </div>

        {/* Row 3 */}
        <div className="grid-item">
          <FilesystemCard disks={data?.disks} />
        </div>
        <div className="grid-item">
          <StorageCard diskUsage={data?.disk_usage} />
        </div>
        <div className="grid-item">
          <NetworkCard networkData={data?.network} />
        </div>

        {/* Row 4 */}
        <div className="lg:col-span-2 grid-item">
          <ContainerCard dockerData={data?.docker} />
        </div>
        <div className="flex flex-col gap-4">
          <PortCheckCard ports={data?.portcheck} />
          <ProcessMonitorCard processes={data?.top_ram ?? []} />
        </div>

        {/* Row 5 */}
        <div className="lg:col-span-2 grid-item">
          <CronJobCard jobs={data?.cronjobs} />
        </div>
        <div className="grid-item">
          <MonitoringCard allData={data} />
        </div>
      </div>

      {/* Download Logs */}
      <div className="flex justify-center pt-4 pb-2">
        <button
          onClick={() => data && downloadCSV(data)}
          disabled={!data}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm font-medium text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-primary" />
          Download Logs as CSV
        </button>
      </div>
    </div>
  );
};

export default Index;
