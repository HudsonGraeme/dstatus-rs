import { invoke } from "@tauri-apps/api/tauri";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Play, Square } from "lucide-react";
import { useEffect, useState } from "react";

export default function DaemonStatus() {
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const status = await invoke<boolean>("check_daemon_status");
      setIsRunning(status);
    } catch (error) {
      console.error("Failed to check daemon status:", error);
    } finally {
      setLoading(false);
    }
  };

  const startDaemon = async () => {
    setActionLoading(true);
    try {
      await invoke("start_daemon");
      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error("Failed to start daemon:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const stopDaemon = async () => {
    setActionLoading(true);
    try {
      await invoke("stop_daemon");
      setTimeout(checkStatus, 1000);
    } catch (error) {
      console.error("Failed to stop daemon:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-500">Checking status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3">
          {isRunning ? (
            <CheckCircle className="text-green-500" size={20} />
          ) : (
            <AlertCircle className="text-red-500" size={20} />
          )}
          <div>
            <div className="text-sm font-medium text-gray-900">
              Daemon Status
            </div>
            <div
              className={`text-xs ${
                isRunning ? "text-green-600" : "text-red-600"
              }`}
            >
              {isRunning ? "Running" : "Stopped"}
            </div>
          </div>
        </div>

        <button
          onClick={isRunning ? stopDaemon : startDaemon}
          disabled={actionLoading}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            isRunning
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-green-50 text-green-700 hover:bg-green-100"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {actionLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isRunning ? (
            <Square size={16} />
          ) : (
            <Play size={16} />
          )}
          <span className="text-sm font-medium">
            {actionLoading
              ? "Working..."
              : isRunning
              ? "Stop Daemon"
              : "Start Daemon"}
          </span>
        </button>
      </motion.div>
    </div>
  );
}
