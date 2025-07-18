import { invoke } from "@tauri-apps/api/tauri";
import { Circle, Power, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

type DaemonStatusType = "Running" | "Stopped" | "Not Installed";

export default function DaemonStatus() {
  const [status, setStatus] = useState<DaemonStatusType | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const checkStatus = async () => {
    try {
      const isRunning = await invoke<boolean>("check_daemon_status");
      setStatus(isRunning ? "Running" : "Stopped");
    } catch (error) {
      console.error("Failed to check daemon status:", error);
      setStatus("Not Installed");
    }
  };

  const toggleDaemon = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      if (status === "Running") {
        await invoke("stop_daemon");
      } else {
        await invoke("start_daemon");
      }
      // Wait a bit before checking status to allow daemon to start/stop
      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error("Failed to toggle daemon:", error);
    } finally {
      setIsToggling(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (status === null) {
    return (
      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
          <span className="text-sm text-zinc-400">Checking status...</span>
        </div>
      </div>
    );
  }

  const statusConfig = {
    Running: {
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      label: "Daemon is running",
      icon: <Wifi className="h-4 w-4" />,
      dotColor: "bg-green-400",
    },
    Stopped: {
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      label: "Daemon is stopped",
      icon: <WifiOff className="h-4 w-4" />,
      dotColor: "bg-red-400",
    },
    "Not Installed": {
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      label: "Daemon not running",
      icon: <Circle className="h-4 w-4" />,
      dotColor: "bg-yellow-400",
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div
      className={cn(
        "rounded-xl border backdrop-blur-sm transition-all duration-200",
        currentStatus.bgColor,
        currentStatus.borderColor
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              "h-2 w-2 rounded-full shadow-sm",
              currentStatus.dotColor,
              status === "Running" && "animate-pulse"
            )}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-200">
              {currentStatus.label}
            </span>
            <span className="text-xs text-zinc-400">
              {status === "Running" ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <button
          onClick={toggleDaemon}
          disabled={isToggling}
          className={cn(
            "rounded-lg p-2 transition-all duration-200 hover:scale-105",
            "bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-600/50",
            "text-zinc-400 hover:text-white shadow-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title={status === "Running" ? "Stop Daemon" : "Start Daemon"}
        >
          {isToggling ? (
            <div className="h-4 w-4 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
