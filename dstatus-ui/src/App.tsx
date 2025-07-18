import { invoke } from "@tauri-apps/api/tauri";
import { Activity, Eye, Loader, Palette, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import ConfigEditor from "./components/ConfigEditor";
import DaemonStatus from "./components/DaemonStatus";
import DiscordPreview from "./components/DiscordPreview";
import TemplateGallery from "./components/TemplateGallery";
import { cn } from "./lib/utils";
import { Config, Template } from "./types";

type Tab = "config" | "preview" | "templates" | "status";

const tabs: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "config", label: "Configuration", icon: Settings },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "templates", label: "Templates", icon: Palette },
  { id: "status", label: "Daemon Status", icon: Activity },
];

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("config");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
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

  const saveConfig = async (newConfig: Config) => {
    try {
      await invoke("save_config", { config: newConfig });
      setConfig(newConfig);
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  };

  const loadTemplate = (template: Template) => {
    setConfig(template.config);
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
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950/70 backdrop-blur-xl">
        {/* Header */}
        <div className="flex flex-col items-center px-6 py-8 border-b border-zinc-800/50">
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
              v0.1.0
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
      <main className="flex-1 flex flex-col bg-zinc-900 overflow-hidden">
        {/* Header */}
        <header className="border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-xl px-8 py-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <div className="h-3 w-3 rounded-full bg-green-400 shadow-sm animate-pulse" />
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
        </div>
      </main>
    </div>
  );
}
