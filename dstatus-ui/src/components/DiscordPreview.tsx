import { motion } from "framer-motion";
import { Config } from "../types";

interface DiscordPreviewProps {
  config: Config;
}

export default function DiscordPreview({ config }: DiscordPreviewProps) {
  return (
    <div className="h-full p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Discord Rich Presence Preview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              This is how your Rich Presence will appear in Discord
            </p>
          </div>

          <div className="p-6">
            <div className="discord-preview rounded-xl p-6 border border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">U</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-white font-semibold">Username</span>
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      Playing a game
                    </span>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start space-x-3">
                      {config.large_image && (
                        <div className="flex-shrink-0 relative">
                          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                            {config.large_image.startsWith("http") ? (
                              <img
                                src={config.large_image}
                                alt={config.large_text || "Large image"}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-xs text-center">
                                {config.large_image}
                              </span>
                            )}
                          </div>
                          {config.small_image && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center">
                              {config.small_image.startsWith("http") ? (
                                <img
                                  src={config.small_image}
                                  alt={config.small_text || "Small image"}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="text-gray-400 text-xs">
                                  {config.small_image.slice(0, 2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm mb-1">
                          {config.details || "No details provided"}
                        </div>
                        {config.state && (
                          <div className="text-gray-300 text-sm mb-2">
                            {config.state}
                          </div>
                        )}
                        {config.party_size > 0 && config.max_party_size > 0 && (
                          <div className="text-gray-300 text-sm mb-2">
                            ({config.party_size} of {config.max_party_size})
                          </div>
                        )}
                        <div className="text-gray-400 text-xs">
                          00:01 elapsed
                        </div>
                      </div>
                    </div>

                    {config.buttons && config.buttons.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {config.buttons.map((button, index) => (
                          <button
                            key={index}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded transition-colors"
                            disabled
                          >
                            {button.label || `Button ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Preview updates automatically as you edit
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Live Preview</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 bg-white rounded-2xl shadow-lg p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Client ID:</span>
              <p className="text-gray-900 mt-1 font-mono">
                {config.client_id || "Not set"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Details:</span>
              <p className="text-gray-900 mt-1">
                {config.details || "Not set"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">State:</span>
              <p className="text-gray-900 mt-1">{config.state || "Not set"}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Party:</span>
              <p className="text-gray-900 mt-1">
                {config.party_size > 0 && config.max_party_size > 0
                  ? `${config.party_size}/${config.max_party_size}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Buttons:</span>
              <p className="text-gray-900 mt-1">
                {config.buttons?.length || 0} configured
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Images:</span>
              <p className="text-gray-900 mt-1">
                {
                  [config.large_image, config.small_image].filter(Boolean)
                    .length
                }{" "}
                configured
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
