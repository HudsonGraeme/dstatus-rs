import { open as openDialog, save } from "@tauri-apps/api/dialog";
import { open } from "@tauri-apps/api/shell";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Check,
  Code,
  Download,
  Eye,
  FileText,
  Loader,
  Palette,
  Play,
  Plus,
  Settings,
  Terminal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import ConfigEditor from "./components/ConfigEditor";
import DaemonStatus from "./components/DaemonStatus";
import DiscordPreview from "./components/DiscordPreview";
import TemplateGallery from "./components/TemplateGallery";
import { cn } from "./lib/utils";
import { Config, Template, UpdateInfo, UserTemplate } from "./types";

type Tab = "config" | "preview" | "templates" | "getstarted";

const tabs: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "getstarted", label: "Get Started", icon: Play },
  { id: "config", label: "Configuration", icon: Settings },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "templates", label: "Templates", icon: Palette },
];

export default function App() {
  const [config, setConfig] = useState<Config | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("getstarted");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<string>("0.1.0");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [daemonStatus, setDaemonStatus] = useState<boolean>(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    Template | UserTemplate | null
  >(null);
  const [configHash, setConfigHash] = useState<string>("");
  const [templateHashes, setTemplateHashes] = useState<Map<string, string>>(
    new Map()
  );
  const [cliInstalled, setCliInstalled] = useState<boolean>(false);
  const [cliInstalling, setCliInstalling] = useState<boolean>(false);
  const [cliInstallMessage, setCliInstallMessage] = useState<string>("");

  useEffect(() => {
    loadConfig();
    loadVersion();
    checkForUpdates();
    checkDaemonStatus();
    loadUserTemplates();
    loadGalleryTemplatesHashes();
    checkCliInstalled();

    const updateInterval = setInterval(checkForUpdates, 60000);
    const statusInterval = setInterval(checkDaemonStatus, 5000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    if (config) {
      calculateConfigHash();
    }
  }, [config]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "s":
            e.preventDefault();
            if (config) {
              saveConfig(config);
            }
            break;
          case "p":
            e.preventDefault();
            setActiveTab("preview");
            break;
          case "e":
            e.preventDefault();
            handleExportConfig();
            break;
          case "i":
            e.preventDefault();
            setShowImportModal(true);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [config]);

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

  const calculateConfigHash = async () => {
    if (!config) return;
    try {
      const hash = await invoke<string>("get_config_hash", { config });
      setConfigHash(hash);
    } catch (error) {
      console.error("Failed to calculate config hash:", error);
    }
  };

  const calculateTemplateHash = async (template: Template | UserTemplate) => {
    try {
      const hash = await invoke<string>("get_config_hash", {
        config: template.config,
      });
      const key = "id" in template ? template.id : template.name;
      setTemplateHashes((prev) => new Map(prev).set(key, hash));
      return hash;
    } catch (error) {
      console.error("Failed to calculate template hash:", error);
      return "";
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

  const loadUserTemplates = async () => {
    try {
      const templates = await invoke<UserTemplate[]>("get_user_templates");
      setUserTemplates(templates);
      // Calculate hashes for all templates
      templates.forEach((template) => {
        calculateTemplateHash(template);
      });
    } catch (error) {
      console.error("Failed to load user templates:", error);
    }
  };

  const loadGalleryTemplatesHashes = async () => {
    try {
      const templates = await invoke<Template[]>("load_templates");
      // Calculate hashes for all gallery templates
      templates.forEach((template) => {
        calculateTemplateHash(template);
      });
    } catch (error) {
      console.error("Failed to load gallery templates for hashing:", error);
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

  const loadTemplate = async (template: Template) => {
    await saveConfig(template.config);
    setActiveTab("config");
    setSelectedTemplate(null);
  };

  const loadUserTemplate = async (template: UserTemplate) => {
    try {
      const newConfig = await invoke<Config>("load_user_template", {
        templateId: template.id,
      });
      setConfig(newConfig);
      setActiveTab("config");
      setSelectedTemplate(null);
      loadUserTemplates(); // Refresh to update last_used time
    } catch (error) {
      console.error("Failed to load user template:", error);
    }
  };

  const handleExportConfig = async () => {
    if (!config) return;

    try {
      const configToml = `[config]
name = "${config.name || ""}"
description = "${config.description || ""}"
client_id = "${config.client_id}"
details = "${config.details || ""}"
state = "${config.state || ""}"
large_image = "${config.large_image || ""}"
large_text = "${config.large_text || ""}"
small_image = "${config.small_image || ""}"
small_text = "${config.small_text || ""}"
party_size = ${config.party_size}
max_party_size = ${config.max_party_size}`;

      const filePath = await save({
        filters: [{ name: "TOML", extensions: ["toml"] }],
        defaultPath: "dstatus-config.toml",
      });

      if (filePath) {
        await import("@tauri-apps/api/fs").then(({ writeTextFile }) =>
          writeTextFile(filePath, configToml)
        );
      }
    } catch (error) {
      console.error("Failed to export config:", error);
    }
  };

  const handleImportConfig = async () => {
    try {
      const filePath = await openDialog({
        filters: [{ name: "TOML", extensions: ["toml"] }],
        multiple: false,
      });

      if (filePath && typeof filePath === "string") {
        const { readTextFile } = await import("@tauri-apps/api/fs");
        const configToml = await readTextFile(filePath);
        // Simple TOML parsing for basic config
        // In a real app, you'd use a proper TOML parser
        console.log("Import TOML:", configToml);
        setShowImportModal(false);
      }
    } catch (error) {
      console.error("Failed to import config:", error);
    }
  };

  const saveUserTemplate = async (name: string, description: string) => {
    if (!config) return;

    try {
      const template: UserTemplate = {
        id: crypto.randomUUID(),
        name,
        description,
        config,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
      };

      await invoke("save_user_template", { template });
      loadUserTemplates();
      setShowSaveTemplateModal(false);
    } catch (error) {
      console.error("Failed to save user template:", error);
    }
  };

  const deleteUserTemplate = async (templateId: string) => {
    try {
      await invoke("delete_user_template", { templateId });
      loadUserTemplates();
    } catch (error) {
      console.error("Failed to delete user template:", error);
    }
  };

  const selectTemplate = (template: Template | UserTemplate) => {
    setSelectedTemplate(template);
    calculateTemplateHash(template);
  };

  const useSelectedTemplate = () => {
    if (!selectedTemplate) return;

    if ("id" in selectedTemplate) {
      loadUserTemplate(selectedTemplate);
    } else {
      loadTemplate(selectedTemplate);
    }
  };

  const isTemplateInUse = (template: Template | UserTemplate) => {
    const key = "id" in template ? template.id : template.name;
    const templateHash = templateHashes.get(key);
    return templateHash === configHash && configHash !== "";
  };

  const checkCliInstalled = async () => {
    try {
      const installed = await invoke<boolean>("check_cli_installed");
      setCliInstalled(installed);
    } catch (error) {
      console.error("Failed to check CLI installation:", error);
      setCliInstalled(false);
    }
  };

  const installCli = async () => {
    setCliInstalling(true);
    try {
      const message = await invoke<string>("install_cli");
      setCliInstallMessage(message);
      setCliInstalled(true);
    } catch (error) {
      console.error("Failed to install CLI:", error);
      setCliInstallMessage(`Installation failed: ${error}`);
    } finally {
      setCliInstalling(false);
    }
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

        {/* Keyboard Shortcuts */}
        <div className="px-4 py-3 border-b border-zinc-800/30">
          <div className="text-xs text-zinc-500 space-y-1">
            <div className="flex justify-between">
              <span>Save</span>
              <kbd className="bg-zinc-800 px-1 rounded text-[10px]">⌘S</kbd>
            </div>
            <div className="flex justify-between">
              <span>Preview</span>
              <kbd className="bg-zinc-800 px-1 rounded text-[10px]">⌘P</kbd>
            </div>
            <div className="flex justify-between">
              <span>Export</span>
              <kbd className="bg-zinc-800 px-1 rounded text-[10px]">⌘E</kbd>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-zinc-800/30">
          <div className="flex space-x-2">
            <button
              onClick={handleExportConfig}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-xs transition-colors"
              title="Export Config (⌘E)"
            >
              <Upload className="h-3 w-3 mx-auto" />
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded text-xs transition-colors"
              title="Import Config (⌘I)"
            >
              <Download className="h-3 w-3 mx-auto" />
            </button>
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
        <header className="border-b border-zinc-800/50 bg-zinc-950/30 backdrop-blur-xl px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-left">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-zinc-400">
                {daemonStatus ? "Running" : "Stopped"}
              </span>
              <div
                className={`h-2 w-2 rounded-full ${
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
            <div className="h-full overflow-y-auto p-6">
              <DiscordPreview config={config} />
            </div>
          )}
          {activeTab === "templates" && (
            <div className="h-full flex">
              {/* Templates List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Gallery Templates */}
                  <div>
                    <h2 className="text-sm font-medium text-left mb-3">
                      Gallery
                    </h2>
                    <TemplateGallery
                      onLoadTemplate={(template) => {
                        if (isTemplateInUse(template)) return;
                        selectTemplate(template);
                      }}
                      onSelectTemplate={selectTemplate}
                      selectedTemplate={selectedTemplate}
                      isTemplateInUse={isTemplateInUse}
                    />
                  </div>

                  {/* My Templates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-medium text-left">
                        My Templates
                      </h2>
                      <button
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="text-xs bg-black border border-white/20 hover:bg-zinc-900 text-white px-2 py-1 rounded flex items-center space-x-1 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Save</span>
                      </button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {userTemplates.map((template) => {
                        const inUse = isTemplateInUse(template);
                        return (
                          <div
                            key={template.id}
                            className={cn(
                              "bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer",
                              selectedTemplate &&
                                "id" in selectedTemplate &&
                                selectedTemplate.id === template.id &&
                                "ring-1 ring-blue-500"
                            )}
                            onClick={() => selectTemplate(template)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-medium text-white truncate">
                                {template.name}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteUserTemplate(template.id);
                                }}
                                className="text-zinc-500 hover:text-red-400 transition-colors ml-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">
                                {new Date(
                                  template.last_used
                                ).toLocaleDateString()}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!inUse) loadUserTemplate(template);
                                }}
                                disabled={inUse}
                                className={cn(
                                  "text-xs px-2 py-1 rounded transition-colors",
                                  inUse
                                    ? "bg-zinc-700/30 text-zinc-400 cursor-not-allowed"
                                    : "bg-black border border-white/20 hover:bg-zinc-900 text-white"
                                )}
                              >
                                {inUse ? "In Use" : "Use"}
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {userTemplates.length === 0 && (
                        <div className="col-span-full text-center py-8">
                          <Palette className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                          <p className="text-xs text-zinc-500">
                            No saved templates
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Sidebar */}
              <div className="w-80 border-l border-zinc-800 bg-zinc-950/50 p-4">
                {selectedTemplate ? (
                  <div className="scale-75 origin-top">
                    <DiscordPreview config={selectedTemplate.config} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">
                      Select a template to preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "getstarted" && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-8">
                {/* CLI Status Card */}
                <div className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium text-lg flex items-center space-x-2">
                        <Terminal className="h-5 w-5" />
                        <span>Command Line Interface</span>
                      </h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        Access dstatus from your terminal
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium",
                        cliInstalled
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                      )}
                    >
                      {cliInstalled ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Installed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3" />
                          <span>Not Installed</span>
                        </>
                      )}
                    </div>
                  </div>

                  {!cliInstalled && (
                    <div className="mb-4">
                      <button
                        onClick={installCli}
                        disabled={cliInstalling}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        {cliInstalling ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span>Installing...</span>
                          </>
                        ) : (
                          <>
                            <Terminal className="h-4 w-4" />
                            <span>Install CLI</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {cliInstallMessage && (
                    <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg">
                      <p className="text-zinc-300 text-xs whitespace-pre-line">
                        {cliInstallMessage}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 text-xs">
                    <div className="text-zinc-400">Available commands:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <code className="bg-zinc-900/50 px-2 py-1 rounded text-zinc-300">
                        dstatus on
                      </code>
                      <code className="bg-zinc-900/50 px-2 py-1 rounded text-zinc-300">
                        dstatus off
                      </code>
                      <code className="bg-zinc-900/50 px-2 py-1 rounded text-zinc-300">
                        dstatus configure
                      </code>
                      <code className="bg-zinc-900/50 px-2 py-1 rounded text-zinc-300">
                        dstatus gui
                      </code>
                    </div>
                  </div>
                </div>

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
                    <h3 className="text-white font-medium text-sm">
                      How to Create a Discord Application
                    </h3>
                    <p className="text-zinc-400 text-xs">
                      Step-by-step guide to get your Client ID
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      open("https://discord.com/developers/applications")
                    }
                    className="bg-[#5865f2] hover:bg-[#4752c4] text-white p-3 rounded-lg transition-all duration-200 flex items-center space-x-2 text-sm"
                  >
                    <Code className="h-4 w-4" />
                    <span>Developer Portal</span>
                  </button>

                  <button
                    onClick={() =>
                      open(
                        "https://discord.com/developers/docs/rich-presence/how-to"
                      )
                    }
                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition-all duration-200 flex items-center space-x-2 border border-zinc-700 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Documentation</span>
                  </button>
                </div>

                <div className="bg-zinc-800/20 border border-zinc-700/30 rounded-lg p-4">
                  <h3 className="text-white font-medium text-sm mb-3">
                    Quick Steps
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-zinc-300">
                      <span className="bg-blue-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                        1
                      </span>
                      <span>
                        Create application in Discord Developer Portal
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-zinc-300">
                      <span className="bg-purple-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                        2
                      </span>
                      <span>Copy the Application ID (Client ID)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-zinc-300">
                      <span className="bg-green-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold">
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

      {/* Dynamic Island for Template Selection */}
      {selectedTemplate && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl px-8 py-4 shadow-2xl">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-zinc-200">
                  {selectedTemplate.name}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-all duration-200 hover:scale-105"
                >
                  Cancel
                </button>

                <button
                  onClick={useSelectedTemplate}
                  disabled={isTemplateInUse(selectedTemplate)}
                  className={cn(
                    "inline-flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
                    isTemplateInUse(selectedTemplate)
                      ? "bg-zinc-700/30 text-zinc-400 border border-zinc-600/50"
                      : "bg-black border border-white/20 hover:bg-zinc-900 text-white"
                  )}
                >
                  {isTemplateInUse(selectedTemplate) ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>In Use</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Use Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-4">
              Save Template
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name") as string;
                const description = formData.get("description") as string;
                if (name.trim()) {
                  saveUserTemplate(name.trim(), description.trim());
                }
              }}
            >
              <input
                name="name"
                type="text"
                placeholder="Template name"
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 mb-3"
                autoFocus
                required
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white placeholder-zinc-400 mb-4 h-20 resize-none"
              />
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSaveTemplateModal(false)}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-black border border-white/20 hover:bg-zinc-900 text-white py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold text-lg mb-4">
              Import Configuration
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Select a TOML configuration file to import
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfig}
                className="flex-1 bg-black border border-white/20 hover:bg-zinc-900 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Select File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
