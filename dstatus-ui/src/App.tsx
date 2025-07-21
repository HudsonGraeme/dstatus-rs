import { open } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Activity,
  Code,
  Download,
  Eye,
  Loader,
  Palette,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ConfigEditor from "./components/ConfigEditor";
import DaemonStatus from "./components/DaemonStatus";
import DiscordPreview from "./components/DiscordPreview";
import TemplateGallery from "./components/TemplateGallery";
import { cn } from "./lib/utils";
import { Config, Template, UpdateInfo } from "./types";

type Tab = "config" | "preview" | "templates" | "status" | "developers";

const tabs: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "config", label: "Configuration", icon: Settings },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "templates", label: "Templates", icon: Palette },
  { id: "status", label: "Daemon Status", icon: Activity },
  { id: "developers", label: "Developers", icon: Code },
];

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<string>("0.1.0");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<boolean>(false);

  useEffect(() => {
    loadConfig();
    loadVersion();
    checkForUpdates();
    checkDaemonStatus();

    // Check for updates every minute
    const updateInterval = setInterval(checkForUpdates, 60000);

    // Check daemon status every 5 seconds
    const statusInterval = setInterval(checkDaemonStatus, 5000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await invoke<Config>("get_config");
      setConfig(loadedConfig);
    } catch (error) {
      console.error("Failed to load config:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVersion = async () => {
    try {
      const appVersion = await invoke<string>("get_app_version");
      setVersion(appVersion);
    } catch (error) {
      console.error("Failed to load version:", error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const updateData = await invoke<UpdateInfo>("check_for_updates");
      setUpdateInfo(updateData);
      setShowUpdateBanner(updateData.has_update);
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
  };

  const checkDaemonStatus = async () => {
    try {
      const isRunning = await invoke<boolean>("check_daemon_status");
      setDaemonStatus(isRunning);
    } catch (error) {
      console.error("Failed to check daemon status:", error);
      setDaemonStatus(false);
    }
  };

  const handleUpdateClick = () => {
    if (updateInfo?.download_url) {
      open(updateInfo.download_url);
    }
  };

  const saveConfig = async (newConfig: Config) => {
    try {
      await invoke("save_config", { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const loadTemplate = (template: Template) => {
    saveConfig(template.config);
    setActiveTab("config");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-blue-500" />
          <p className="text-lg font-medium text-zinc-400">
            Loading DStatus...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-900 text-white overflow-hidden">
      {/* Update Banner */}
      {showUpdateBanner && updateInfo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-white" />
              <div>
                <span className="text-white font-medium">
                  Update available: v{updateInfo.latest_version}
                </span>
                <span className="text-blue-100 ml-2 text-sm">
                  (current: v{updateInfo.current_version})
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUpdateClick}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Update to v{updateInfo.latest_version}</span>
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="text-white/70 hover:text-white p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-xl">
        {/* Header */}
        <div
          className={cn(
            "flex flex-col items-center px-6 py-8 border-b border-zinc-800/50",
            showUpdateBanner && "pt-20"
          )}
        >
          <pre className="text-purple-400 text-[5px] leading-tight font-mono">
            {`
██████╗ ███████╗████████╗ █████╗ ████████╗██╗   ██╗███████╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██║   ██║██╔════╝
██║  ██║███████╗   ██║   ███████║   ██║   ██║   ██║███████╗
██║  ██║╚════██║   ██║   ██╔══██║   ██║   ██║   ██║╚════██║
██████╔╝███████║   ██║   ██║  ██║   ██║   ╚██████╔╝███████║
╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝
            `}
          </pre>
          <div className="mt-2 text-center">
            <code className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">
              v{version}
            </code>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center space-x-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-blue-500/15 text-blue-300 shadow-sm border border-blue-500/20"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                  )}
                >
                  <tab.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      activeTab === tab.id ? "text-blue-400" : "text-zinc-500"
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Status */}
        <div className="p-4 border-t border-zinc-800/50">
          <DaemonStatus />
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 flex flex-col bg-zinc-900 overflow-hidden",
          showUpdateBanner && "pt-16"
        )}
      >
        {/* Header */}
        <header className="border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-xl px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-zinc-400">
                {daemonStatus ? "Daemon Running" : "Daemon Stopped"}
              </span>
              <div
                className={`h-3 w-3 rounded-full shadow-sm ${
                  daemonStatus ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 overflow-hidden">
          {activeTab === "config" && config && (
            <ConfigEditor config={config} onSave={saveConfig} />
          )}
          {activeTab === "preview" && config && (
            <div className="h-full overflow-y-auto p-8">
              <DiscordPreview config={config} />
            </div>
          )}
          {activeTab === "templates" && (
            <div className="h-full overflow-y-auto p-8">
              <TemplateGallery onLoadTemplate={loadTemplate} />
            </div>
          )}
          {activeTab === "status" && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-2xl">
                <DaemonStatus />
              </div>
            </div>
          )}
          {activeTab === "developers" && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Discord Developer Setup
                  </h2>
                  <p className="text-zinc-400">
                    Create your Discord application to get started
                  </p>
                </div>

                {/* Video Tutorial */}
                <div className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-zinc-900">
                    <video
                      className="w-full h-full rounded-t-xl"
                      controls
                      preload="metadata"
                    >
                      <source src="/tutorial.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium">
                      How to Create a Discord Application
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Step-by-step guide to get your Client ID
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      open("https://discord.com/developers/applications")
                    }
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white p-4 rounded-xl transition-all duration-200 flex items-center space-x-3"
                  >
                    <Code className="h-5 w-5" />
                    <span className="font-medium">Open Developer Portal</span>
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() =>
                      open(
                        "https://discord.com/developers/docs/rich-presence/how-to"
                      )
                    }
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-xl transition-all duration-200 flex items-center space-x-3 border border-zinc-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="font-medium">Documentation</span>
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                </div>

                {/* Simple Steps */}
                <div className="bg-zinc-800/20 border border-zinc-700/30 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Quick Steps</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <span className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <span>
                        Create application in Discord Developer Portal
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <span className="bg-purple-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Copy the Application ID (Client ID)</span>
                    </div>
                    <div className="flex items-center space-x-3 text-zinc-300">
                      <span className="bg-green-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Paste it in the Configuration tab</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
