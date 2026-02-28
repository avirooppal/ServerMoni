import { SysInfo } from "@/lib/api";

interface ServerInfoBarProps {
  sysinfo?: SysInfo | null;
  uptime: string;
  loadAvg: string;
  agentVersion: string;
  activeConnections?: number;
}

const ServerInfoBar = ({ sysinfo, uptime, loadAvg, agentVersion, activeConnections }: ServerInfoBarProps) => {
  const isWindows = sysinfo?.os?.toLowerCase() === "windows";

  const items = [
    { label: "HOSTNAME", value: sysinfo?.hostname ?? "—", sub: sysinfo?.os ?? "" },
    { label: "KERNEL", value: sysinfo?.kernel?.split(" ")[0] ?? "—", sub: sysinfo?.arch ?? "x86_64" },
    { label: "UPTIME", value: uptime, sub: "" },
    { label: "CPU MODEL", value: sysinfo?.cpu_model ?? "—", sub: "" },
    { label: "IP ADDRESS", value: sysinfo?.ip_address ?? "—", isIp: true },
    {
      label: isWindows ? "ACTIVE SOCKETS" : "LOAD AVG",
      value: isWindows ? (activeConnections?.toString() ?? "—") : loadAvg
    },
  ];

  return (
    <div className="glass-card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <p className="metric-label">{item.label}</p>
          <p className="metric-value text-sm mt-1 truncate">
            {item.isIp ? (
              <span className="text-primary">{item.value}</span>
            ) : (
              item.value
            )}
          </p>
          {item.sub && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {item.label === "CPU MODEL" ? (
                <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground text-[10px]">
                  {item.sub}
                </span>
              ) : (
                item.sub
              )}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ServerInfoBar;
