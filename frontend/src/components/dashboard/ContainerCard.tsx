import { Container, Circle } from "lucide-react";
import { DockerContainer } from "@/lib/api";

interface ContainerCardProps {
  dockerData?: DockerContainer[] | null;
}

const statusColor: Record<string, string> = {
  running: "text-accent",
  exited: "text-destructive",
  stopped: "text-destructive",
  restarting: "text-chart-orange",
  paused: "text-chart-orange",
  created: "text-muted-foreground",
};

const ContainerCard = ({ dockerData }: ContainerCardProps) => {
  const containers = dockerData ?? [];
  const running = containers.filter((c) => c.state === "running").length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Container className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Docker Containers</h3>
        </div>
        {containers.length > 0 ? (
          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
            {running} running
          </span>
        ) : (
          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
            unavailable
          </span>
        )}
      </div>

      {containers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Docker daemon not running or no containers found.
        </p>
      ) : (
        <div className="space-y-2">
          {containers.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Circle
                  className={`w-2 h-2 shrink-0 fill-current ${statusColor[c.state] ?? "text-muted-foreground"
                    }`}
                />
                <span className="text-foreground font-medium truncate max-w-[100px]">
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[90px]">
                  {c.image}
                </span>
              </div>
              <div className="flex flex-col items-end text-xs text-muted-foreground shrink-0">
                <span
                  className={
                    c.state === "running"
                      ? "text-accent"
                      : c.state === "exited" || c.state === "stopped"
                        ? "text-destructive"
                        : "text-chart-orange"
                  }
                >
                  {c.state}
                </span>
                {c.ports && (
                  <span className="font-mono truncate max-w-[80px]">{c.ports}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContainerCard;
