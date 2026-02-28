// All requests use the Vite proxy which forwards /api/* to the Go backend.
// In development: Vite proxy → http://localhost:5001
// In production: serve frontend and backend on the same origin, or set VITE_API_BASE_URL

const BASE = ""; // Vite dev proxy handles /api/* forwarding

async function apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
    return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoreUsage {
    core: number;
    percent: number;
}

export interface CPUData {
    usage: string;
    user: string;
    sys: string;
    idle: string;
    per_core?: CoreUsage[];
    temperature_c?: number;
}

export interface MemoryData {
    total: string;
    used: string;
    free: string;
    usage: string;
    swap_total: string;
    swap_used: string;
}

export interface LoadAvgData {
    "1m": string;
    "5m": string;
    "15m": string;
}

export interface UptimeData {
    seconds: number;
    formatted: string;
}

export interface ProcessEntry {
    pid: number;
    name: string;
    memory: string;
    cpu_time?: string;
}

export interface DiskEntry {
    name: string;
    reads: number;
    writes: number;
    read_time?: number;
    write_time?: number;
}

export interface NetworkEntry {
    interface: string;
    received: string;
    sent: string;
    rx_bytes?: number;
    tx_bytes?: number;
    rx_errors?: number;
    rx_dropped?: number;
    tx_errors?: number;
    tx_dropped?: number;
}

// Sysinfo returned by /api/sysinfo and from /api/all
export interface SysInfo {
    hostname: string;
    os: string;
    arch: string;
    kernel: string;
    cpu_model: string;
    ip_address: string;
}

// Disk usage per mount/drive returned by /api/diskusage and from /api/all
export interface DiskUsageEntry {
    path: string;
    fstype: string;
    total: string;
    used: string;
    free: string;
    used_percent: number;
    total_bytes: number;
    used_bytes: number;
    free_bytes: number;
}

// GPU fields come back as numeric values (ints/floats) from the Go struct
export interface GPUStats {
    index: number;
    name: string;
    uuid: string;
    util_gpu_percent: number;
    util_memory_percent: number;
    memory_total_mb: number;
    memory_free_mb: number;
    memory_used_mb: number;
    temperature_c: number;
    power_draw_w: number;
    power_limit_w: number;
}

export interface PressureData {
    cpu_some_avg10: string;
    memory_some_avg10: string;
    io_some_avg10: string;
}

export interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    created: string;
    ports: string;
}

export interface CronJob {
    name: string;
    schedule: string;
    last_run: string;
    status: string;
}

export interface PortStatus {
    port: number;
    service: string;
    open: boolean;
}

export interface AllData {
    cpu: CPUData;
    memory: MemoryData;
    load_avg: LoadAvgData;
    uptime: UptimeData;
    steal_iowait: { steal_percent: string; iowait_percent: string };
    sockets: { used: number; tcp_inuse: number; tcp_tw: number; udp_inuse: number };
    file_descriptors: { allocated: number; max: number; used_percent: string };
    pressure: PressureData;
    top_cpu: ProcessEntry[];
    top_ram: ProcessEntry[];
    disks: DiskEntry[];
    network: NetworkEntry[];
    gpu: GPUStats[] | null;
    sysinfo: SysInfo | null;
    disk_usage: DiskUsageEntry[] | null;
    docker?: DockerContainer[] | null;
    cronjobs?: CronJob[] | null;
    portcheck?: PortStatus[] | null;
    process_count?: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const fetchAll = () => apiFetch<AllData>("/api/all");
export const fetchCPU = () => apiFetch<CPUData>("/api/cpu");
export const fetchMemory = () => apiFetch<MemoryData>("/api/memory");
export const fetchNetwork = () => apiFetch<NetworkEntry[]>("/api/network");
export const fetchProcess = () => apiFetch<ProcessEntry[]>("/api/process");
export const fetchGPU = () => apiFetch<GPUStats[]>("/api/gpu");
export const fetchDisk = () => apiFetch<DiskEntry[]>("/api/disk");
export const fetchTopCPU = () => apiFetch<ProcessEntry[]>("/api/topcpu");
export const fetchTopRAM = () => apiFetch<ProcessEntry[]>("/api/topram");
export const fetchSysInfo = () => apiFetch<SysInfo>("/api/sysinfo");
export const fetchDiskUsage = () => apiFetch<DiskUsageEntry[]>("/api/diskusage");
export const fetchDocker = () => apiFetch<DockerContainer[]>("/api/docker");
export const fetchCronJobs = () => apiFetch<CronJob[]>("/api/cronjobs");
export const fetchPortCheck = () => apiFetch<PortStatus[]>("/api/portcheck");
export const fetchUptime = () =>
    apiFetch<{ uptime_seconds: number; uptime_formatted: string }>("/api/uptime");
export const fetchLoadAvg = () =>
    apiFetch<{ load_1m: string; load_5m: string; load_15m: string }>("/api/loadavg");
export const fetchSockStat = () => apiFetch<unknown>("/api/sockstat");
export const fetchPressure = () => apiFetch<unknown>("/api/pressure");
