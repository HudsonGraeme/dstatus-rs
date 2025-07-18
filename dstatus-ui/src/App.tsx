import { invoke } from "@tauri-apps/api/tauri";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Eye, Palette, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import ConfigEditor from "./components/ConfigEditor";
import DaemonStatus from "./components/DaemonStatus";
import DiscordPreview from "./components/DiscordPreview";
import TemplateGallery from "./components/TemplateGallery";
import { Config, Template } from "./types";

type Tab = "config" | "preview" | "templates" | "status";

function App() {
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
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Loading DStatus...</p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "config" as Tab, label: "Configuration", icon: Settings },
    { id: "preview" as Tab, label: "Preview", icon: Eye },
    { id: "templates" as Tab, label: "Templates", icon: Palette },
    { id: "status" as Tab, label: "Status", icon: Activity },
  ];

  return (
    <div className="h-screen bg-gray-50 flex">
      <div className="w-80 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">DStatus</h1>
              <p className="text-sm text-gray-500">Discord Rich Presence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <DaemonStatus />
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
        </header>

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "config" && config && (
                <ConfigEditor config={config} onSave={saveConfig} />
              )}
              {activeTab === "preview" && config && (
                <DiscordPreview config={config} />
              )}
              {activeTab === "templates" && (
                <TemplateGallery onLoadTemplate={loadTemplate} />
              )}
              {activeTab === "status" && (
                <div className="p-8">
                  <h3 className="text-lg font-semibold mb-4">Daemon Status</h3>
                  <DaemonStatus />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default App;
