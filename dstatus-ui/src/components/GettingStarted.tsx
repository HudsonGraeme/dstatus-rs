import { Check, ExternalLink, Terminal, X } from "lucide-react";
import { cn } from "../lib/utils";

interface GettingStartedProps {
  cliInstalled: boolean;
  onInstallCli: () => void;
  cliInstalling: boolean;
  cliInstallMessage: string;
}

export default function GettingStarted({
  cliInstalled,
  onInstallCli,
  cliInstalling,
  cliInstallMessage,
}: GettingStartedProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        <div className="prose prose-invert prose-zinc max-w-none">
          <h1 className="text-3xl font-bold text-white mb-8">
            Getting Started with dstatus
          </h1>

          <div className="space-y-8">
            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Prerequisites
              </h2>
              <div className="text-zinc-300 space-y-2">
                <p>Before you begin, make sure you have:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Discord installed and running on your system</li>
                  <li>A Discord Application (for Rich Presence integration)</li>
                  <li>Rust installed (for building from source)</li>
                </ul>
              </div>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Quick Installation
              </h2>
              <p className="text-zinc-300 mb-4">
                The easiest way to install dstatus:
              </p>
              <div className="bg-zinc-900 rounded-lg p-4">
                <code className="text-green-400 font-mono text-sm">
                  curl -sSL https://install.dstatus.rs | bash
                </code>
              </div>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Setting up Discord Application
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">
                    1. Create a Discord Application
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Go to the{" "}
                        <a
                          href="https://discord.com/developers/applications"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                        >
                          Discord Developer Portal
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Click "New Application" and give it a name (e.g.,
                        "dstatus")
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span className="font-medium">
                        Note down your Application ID - you'll need this
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">
                    2. Configure Rich Presence
                  </h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        In your application settings, go to "Rich Presence" →
                        "Art Assets"
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Upload any custom images you want to use as icons
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        Note the asset names for use in your configuration
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-3">
                    3. Set your Application ID
                  </h3>
                  <p className="text-zinc-300 mb-2 text-sm">
                    Configure dstatus with your Application ID:
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-4">
                    <code className="text-green-400 font-mono text-sm">
                      dstatus config set app_id YOUR_APPLICATION_ID
                    </code>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Basic Usage
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Start the dstatus daemon:
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <code className="text-green-400 font-mono text-sm">
                      dstatus start
                    </code>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400 text-sm mb-2">
                    Set your custom status:
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <code className="text-green-400 font-mono text-sm">
                      dstatus set "Working on a project"
                    </code>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400 text-sm mb-2">
                    View current status:
                  </p>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <code className="text-green-400 font-mono text-sm">
                      dstatus status
                    </code>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-400 text-sm mb-2">Stop the daemon:</p>
                  <div className="bg-zinc-900 rounded-lg p-3">
                    <code className="text-green-400 font-mono text-sm">
                      dstatus stop
                    </code>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Configuration
              </h2>
              <p className="text-zinc-300 mb-3 text-sm">
                dstatus uses a configuration file located at{" "}
                <code className="bg-zinc-800 px-2 py-1 rounded text-xs">
                  ~/.config/dstatus/config.toml
                </code>
              </p>
              <p className="text-zinc-400 text-sm mb-3">
                Example configuration:
              </p>
              <div className="bg-zinc-900 rounded-lg p-4">
                <pre className="text-green-400 font-mono text-xs overflow-x-auto">{`app_id = "YOUR_APPLICATION_ID"
default_state = "Working"
default_details = "Coding away"
large_image = "your_image_asset"
large_text = "dstatus"`}</pre>
              </div>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Building from Source
              </h2>
              <p className="text-zinc-300 mb-3 text-sm">
                If you want to build from source:
              </p>
              <div className="bg-zinc-900 rounded-lg p-4 space-y-2">
                <div>
                  <code className="text-green-400 font-mono text-sm">
                    git clone https://github.com/HudsonGraeme/dstatus-rs.git
                  </code>
                </div>
                <div>
                  <code className="text-green-400 font-mono text-sm">
                    cd dstatus-rs
                  </code>
                </div>
                <div>
                  <code className="text-green-400 font-mono text-sm">
                    cargo build --release
                  </code>
                </div>
              </div>
              <p className="text-zinc-400 text-xs mt-3">
                The binary will be available at{" "}
                <code className="bg-zinc-800 px-2 py-1 rounded">
                  target/release/dstatus
                </code>
              </p>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Command Line Interface
              </h2>

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-zinc-300 text-sm">
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
                      <span>Not Available</span>
                    </>
                  )}
                </div>
              </div>

              {!cliInstalled && (
                <div className="mb-4">
                  <button
                    onClick={onInstallCli}
                    disabled={cliInstalling}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    {cliInstalling ? (
                      <>
                        <Terminal className="h-4 w-4 animate-pulse" />
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
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Troubleshooting
              </h2>
              <ul className="space-y-2 text-sm text-zinc-300">
                <li className="flex items-start">
                  <span className="text-zinc-400 font-medium mr-2">
                    Discord not detecting status:
                  </span>
                  <span>Make sure Discord is running and you're logged in</span>
                </li>
                <li className="flex items-start">
                  <span className="text-zinc-400 font-medium mr-2">
                    "Application ID not set" error:
                  </span>
                  <span>
                    Configure your app ID using{" "}
                    <code className="bg-zinc-800 px-1 rounded text-xs">
                      dstatus config set app_id YOUR_ID
                    </code>
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-zinc-400 font-medium mr-2">
                    Permission errors:
                  </span>
                  <span>
                    The install script may need sudo privileges depending on
                    your system
                  </span>
                </li>
              </ul>
            </section>

            <section className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Additional Resources
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700/50 rounded-lg p-4 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      Discord Developer Portal
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Manage your Discord applications
                    </p>
                  </div>
                </a>

                <a
                  href="https://discord.com/developers/docs/rich-presence/how-to"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700/50 rounded-lg p-4 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      Rich Presence Documentation
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Official Discord Rich Presence guide
                    </p>
                  </div>
                </a>

                <a
                  href="https://github.com/HudsonGraeme/dstatus-rs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-700/50 rounded-lg p-4 transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      GitHub Repository
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Report issues or contribute
                    </p>
                  </div>
                </a>

                <div className="flex items-center space-x-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-4">
                  <Terminal className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-white text-sm font-medium">
                      Getting Help
                    </p>
                    <p className="text-zinc-400 text-xs">
                      Run{" "}
                      <code className="bg-zinc-800 px-1 rounded">
                        man dstatus
                      </code>{" "}
                      or{" "}
                      <code className="bg-zinc-800 px-1 rounded">
                        dstatus --help
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
