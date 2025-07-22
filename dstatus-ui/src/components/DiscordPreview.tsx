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

    return <span className="text-xs text-[#b5bac1]">{time}</span>;
  };

  return (
    <div className="max-w-3xl">
      {/* Discord Profile Container */}
      <div className="relative">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2b2d31]/80 to-[#1e1f22]/80 rounded-2xl blur-3xl"></div>

        {/* Main Discord Profile mockup */}
        <div className="relative rounded-2xl bg-[#2b2d31] border border-[#3f4147]/50 overflow-hidden shadow-2xl max-w-md mx-auto">
          {/* Live indicator */}
          <div className="absolute top-3 right-3 z-10 flex items-center space-x-2 bg-[#23a55a]/20 backdrop-blur-sm border border-[#23a55a]/30 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 bg-[#23a55a] rounded-full animate-pulse"></div>
            <span className="text-[#23a55a] font-medium text-xs">
              Live Preview
            </span>
          </div>

          {/* Profile Header */}
          <div className="relative">
            {/* Banner */}
            <div className="h-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>

            {/* Profile Picture */}
            <div className="absolute -bottom-10 left-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-4 border-[#2b2d31] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  You
                </div>
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#23a55a] border-4 border-[#2b2d31] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-12 px-4 pb-4">
            {/* Username and badges */}
            <div className="mb-3">
              <h2 className="text-white font-bold text-xl">Your Username</h2>
              <p className="text-[#b5bac1] text-sm">yourhandle</p>
            </div>

            {/* About Me */}
            <div className="mb-4">
              <h3 className="text-white font-semibold text-sm mb-2">
                ABOUT ME
              </h3>
              <p className="text-[#dbdee1] text-sm">
                Using DStatus for custom Rich Presence 🎮
              </p>
            </div>

            {/* Playing Section */}
            {(details || state || large_image || small_image) && (
              <div className="mb-4">
                <h3 className="text-white font-semibold text-sm mb-3 flex items-center">
                  PLAYING A GAME
                  <div className="ml-2 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-[#23a55a] rounded-full animate-pulse"></div>
                    <span className="text-[#23a55a] text-xs font-medium">
                      Live
                    </span>
                  </div>
                </h3>

                {/* Rich Presence Activity */}
                <div className="bg-[#1e1f22] rounded-lg p-3 border border-[#3f4147]">
                  <div className="flex space-x-3">
                    {/* Large Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        {large_image ? (
                          <span className="text-white font-bold text-xs">
                            {large_image.slice(0, 3).toUpperCase()}
                          </span>
                        ) : (
                          <div className="w-8 h-8 bg-white/20 rounded"></div>
                        )}
                      </div>
                      {/* Small Image */}
                      {small_image && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full border-2 border-[#1e1f22] flex items-center justify-center">
                          <span className="text-white font-bold text-[8px]">
                            {small_image.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm leading-tight mb-1">
                        {details || "DStatus Rich Presence"}
                      </div>
                      {state && (
                        <div className="text-[#b5bac1] text-sm leading-tight mb-1">
                          {state}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center space-x-2 text-xs text-[#87898c]">
                        <ActivityTimestamp />
                        {config.party_size > 0 && config.max_party_size > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              ({config.party_size} of {config.max_party_size})
                            </span>
                          </>
                        )}
                      </div>

                      {(large_text || small_text) && (
                        <div className="text-[#87898c] text-xs mt-1">
                          {large_text && <span>{large_text}</span>}
                          {large_text && small_text && <span> • </span>}
                          {small_text && <span>{small_text}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Buttons */}
                  {config.buttons && config.buttons.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {config.buttons.map((button, index) => (
                        <button
                          key={index}
                          className="w-full bg-[#4e5058] hover:bg-[#5d6269] text-white text-sm py-2 px-3 rounded transition-all duration-200 font-medium"
                        >
                          {button.label || `Button ${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Member Since */}
            <div className="text-[#b5bac1] text-xs">
              <span className="font-semibold">DISCORD MEMBER SINCE</span>
              <div className="mt-1">Jan 15, 2020</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
