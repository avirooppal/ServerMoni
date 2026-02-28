import { useState } from "react";
import { Activity, HardDrive, FileText, Cpu, Server } from "lucide-react";
import { AllData } from "@/lib/api";
import { MetricsModal, MetricRow, MetricSection, MetricBar } from "./MetricsModal";

interface AdvancedMetricsCardProps {
    allData?: AllData;
}

const AdvancedMetricsCard = ({ allData }: AdvancedMetricsCardProps) => {
    const [open, setOpen] = useState(false);

    // Parse required metrics
    const steal = parseFloat(allData?.steal_iowait?.steal_percent ?? "0");
    const socketsUsed = allData?.sockets?.used ?? 0;
    const fdPct = parseFloat(allData?.file_descriptors?.used_percent ?? "0");
    const pressureCpu10 = parseFloat(allData?.pressure?.cpu_some_avg10 ?? "0");

    return (
        <>
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-chart-purple" />
                        <h3 className="font-semibold text-foreground">Core Metrics</h3>
                    </div>
                    <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline">
                        View →
                    </button>
                </div>

                <div className="space-y-3 text-sm">
                    {!allData ? (
                        <p className="text-xs text-muted-foreground">Loading advanced metrics…</p>
                    ) : (
                        <>
                            <div className="flex justify-between items-center pb-2 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5" /> Sockets (TCP/UDP)
                                </span>
                                <span className="text-foreground font-medium">{socketsUsed}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> File Descriptors
                                </span>
                                <span className={fdPct > 80 ? "text-destructive font-medium" : "text-foreground font-medium"}>
                                    {fdPct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-border">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <Cpu className="w-3.5 h-3.5" /> CPU Pressure (10s)
                                </span>
                                <span className={pressureCpu10 > 25 ? "text-chart-orange font-medium" : "text-foreground font-medium"}>
                                    {pressureCpu10.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-2">
                                    <HardDrive className="w-3.5 h-3.5" /> CPU Steal Time
                                </span>
                                <span className={steal > 5 ? "text-destructive font-medium" : "text-chart-green font-medium"}>
                                    {steal.toFixed(1)}%
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <MetricsModal open={open} onClose={() => setOpen(false)} title="Advanced HPC Metrics">
                <MetricSection title="SYSTEM LOAD & STEAL">
                    <MetricRow
                        label="Load Average 1m"
                        value={allData?.load_avg?.["1m"] ?? "—"}
                    />
                    <MetricRow
                        label="CPU Steal Time"
                        value={allData?.steal_iowait?.steal_percent ?? "—"}
                        sub="Virtualization overhead stealing CPU cycles"
                        highlight={steal > 5 ? "warn" : "ok"}
                    />
                    <MetricRow
                        label="I/O Wait"
                        value={allData?.steal_iowait?.iowait_percent ?? "—"}
                        sub="CPU time spent waiting for disks"
                        highlight={parseFloat(allData?.steal_iowait?.iowait_percent ?? "0") > 10 ? "warn" : "ok"}
                    />
                </MetricSection>

                <MetricSection title="KERNEL RESOURCES">
                    <MetricRow
                        label="Active Sockets"
                        value={allData?.sockets?.used ?? 0}
                        sub={`TCP: ${allData?.sockets?.tcp_inuse ?? 0} | UDP: ${allData?.sockets?.udp_inuse ?? 0} | TIME_WAIT: ${allData?.sockets?.tcp_tw ?? 0}`}
                    />
                    <MetricRow
                        label="File Descriptors"
                        value={allData?.file_descriptors?.allocated ?? 0}
                        sub={`Max allowed: ${allData?.file_descriptors?.max ?? 0}`}
                    />
                    <MetricBar
                        label="FD Saturation"
                        value={fdPct}
                        color={fdPct > 80 ? "bg-destructive" : fdPct > 60 ? "bg-chart-orange" : "bg-chart-blue"}
                    />
                </MetricSection>

                <MetricSection title="PRESSURE STALL INFORMATION (PSI)">
                    <MetricRow
                        label="CPU Pressure (Avg 10s)"
                        value={allData?.pressure?.cpu_some_avg10 ?? "—"}
                        sub="Tasks delayed due to lack of CPU"
                    />
                    <MetricRow
                        label="Memory Pressure (Avg 10s)"
                        value={allData?.pressure?.memory_some_avg10 ?? "—"}
                        sub="Tasks delayed due to lack of Memory"
                    />
                    <MetricRow
                        label="I/O Pressure (Avg 10s)"
                        value={allData?.pressure?.io_some_avg10 ?? "—"}
                        sub="Tasks delayed due to lack of Disk I/O"
                    />
                </MetricSection>
            </MetricsModal>
        </>
    );
};

export default AdvancedMetricsCard;
