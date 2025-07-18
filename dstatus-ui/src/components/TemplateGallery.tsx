import { invoke } from "@tauri-apps/api/tauri";
import { Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Template } from "../types";

interface TemplateGalleryProps {
  onLoadTemplate: (template: Template) => void;
}

export default function TemplateGallery({
  onLoadTemplate,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const fetchedTemplates = await invoke<Template[]>("load_templates");
        setTemplates(fetchedTemplates);
      } catch (error) {
        console.error("Failed to load templates:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-zinc-800/50 border border-zinc-700/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-white">Template Gallery</h3>
        <p className="text-zinc-400">
          Choose from our collection of pre-made Discord Rich Presence templates
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.name}
            className="group rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:scale-105 hover:border-zinc-600/50 hover:shadow-xl"
          >
            {/* Template Header */}
            <div className="p-6 space-y-3">
              <h4 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                {template.name}
              </h4>
              <p className="text-sm text-zinc-400 line-clamp-2">
                {template.description}
              </p>
            </div>

            {/* Template Preview */}
            <div className="px-6 pb-4">
              <div className="bg-[#36393f] border border-[#4f545c] rounded-lg p-3 text-xs">
                <div className="flex items-start space-x-2">
                  {template.config.large_image && (
                    <div className="relative">
                      <div className="w-8 h-8 bg-[#4f545c] rounded flex items-center justify-center text-[#72767d]">
                        {template.config.large_image.slice(0, 2)}
                      </div>
                      {template.config.small_image && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4f545c] rounded-full border border-[#36393f]" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 space-y-0.5">
                    <div className="text-white font-medium text-xs">
                      {template.config.details || "No details"}
                    </div>
                    {template.config.state && (
                      <div className="text-[#b9bbbe] text-xs">
                        {template.config.state}
                      </div>
                    )}
                    <div className="text-[#72767d] text-xs">00:01 elapsed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Footer */}
            <div className="p-6 pt-0 space-y-3">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>{template.config.buttons?.length || 0} buttons</span>
                <span>
                  {
                    [
                      template.config.large_image,
                      template.config.small_image,
                    ].filter(Boolean).length
                  }{" "}
                  images
                </span>
              </div>
              <button
                onClick={() => onLoadTemplate(template)}
                className="w-full flex items-center justify-center space-x-2 rounded-lg bg-zinc-700/60 hover:bg-zinc-600/60 border border-zinc-600/40 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:scale-105 group-hover:bg-zinc-600/70"
              >
                <Download className="h-4 w-4" />
                <span>Use Template</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {templates.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
              <ExternalLink className="h-8 w-8 text-zinc-500" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-white">
                No templates found
              </h4>
              <p className="text-zinc-400">
                Check your connection and try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-500/30">
            <ExternalLink className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h4 className="text-lg font-semibold text-white">
                Want more templates?
              </h4>
              <p className="text-zinc-400">
                Browse our online collection of community-created templates and
                download them directly to your app.
              </p>
            </div>
            <button className="inline-flex items-center space-x-2 rounded-lg bg-zinc-700/60 hover:bg-zinc-600/60 border border-zinc-600/40 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:scale-105">
              <ExternalLink className="h-4 w-4" />
              <span>Browse Online Gallery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
