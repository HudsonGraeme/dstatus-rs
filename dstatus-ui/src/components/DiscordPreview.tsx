import { useEffect, useState } from "react";
import { Config } from "../types";

interface DiscordPreviewProps {
  config: Config;
}

export default function DiscordPreview({ config }: DiscordPreviewProps) {
  const { details, state, large_image, large_text, small_image, small_text } =
    config;

  const ActivityTimestamp = () => {
    const [time, setTime] = useState("00:00 elapsed");

    useEffect(() => {
      let seconds = 0;
      const interval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60)
          .toString()
          .padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        setTime(`${minutes}:${secs} elapsed`);
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return <p className="text-xs text-zinc-400">{time}</p>;
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Discord Preview</h3>
          <p className="text-sm text-zinc-400 mt-1">
            This is how your Rich Presence will appear in Discord
          </p>
        </div>

        {/* Discord Mockup */}
        <div className="rounded-lg bg-[#36393f] border border-[#4f545c] p-4 font-['Whitney'] text-[#dcddde]">
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
              U
            </div>

            <div className="flex-1 space-y-2">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white text-sm">
                  Username
                </span>
                <span className="bg-[#5865f2] text-white text-xs px-2 py-0.5 rounded font-medium">
                  Playing a game
                </span>
              </div>

              {/* Activity Card */}
              <div className="bg-[#2f3136] border border-[#4f545c] rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  {/* Activity Images */}
                  {large_image && (
                    <div className="relative">
                      <div className="w-16 h-16 bg-[#4f545c] rounded-lg flex items-center justify-center text-xs text-[#72767d] overflow-hidden">
                        {large_image.startsWith("http") ? (
                          <img
                            src={large_image}
                            alt={large_text || "Large image"}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-center px-1">
                            {large_image}
                          </span>
                        )}
                      </div>
                      {small_image && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2f3136] rounded-full border-2 border-[#2f3136] flex items-center justify-center">
                          <div className="w-5 h-5 bg-[#4f545c] rounded-full flex items-center justify-center text-xs text-[#72767d] overflow-hidden">
                            {small_image.startsWith("http") ? (
                              <img
                                src={small_image}
                                alt={small_text || "Small image"}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <span>{small_image.slice(0, 1)}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Activity Details */}
                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-white text-sm">
                      {details || "dstatus"}
                    </div>
                    {state && (
                      <div className="text-[#b9bbbe] text-sm">{state}</div>
                    )}
                    {config.party_size > 0 && config.max_party_size > 0 && (
                      <div className="text-[#b9bbbe] text-sm">
                        ({config.party_size} of {config.max_party_size})
                      </div>
                    )}
                    {config.timestamps && <ActivityTimestamp />}
                  </div>
                </div>

                {/* Buttons */}
                {config.buttons && config.buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {config.buttons.map((button, index) => (
                      <div
                        key={index}
                        className="bg-[#4f545c] hover:bg-[#5d6269] text-white text-sm py-1.5 px-3 rounded text-center cursor-pointer transition-colors"
                      >
                        {button.label || `Button ${index + 1}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Info */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-400">
            Preview updates automatically as you edit
          </span>
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-medium">Live Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}
