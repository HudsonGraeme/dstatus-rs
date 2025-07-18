import { invoke } from "@tauri-apps/api/tauri";
import { motion } from "framer-motion";
import { Download, ExternalLink, Palette } from "lucide-react";
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
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await invoke<Template[]>("load_templates");
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">
              Template Gallery
            </h2>
          </div>
          <p className="text-gray-600">
            Choose from our collection of pre-made Discord Rich Presence
            templates
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="discord-preview rounded-lg p-4 mb-4 border border-gray-600">
                  <div className="flex items-start space-x-3">
                    {template.config.large_image && (
                      <div className="flex-shrink-0 relative">
                        <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs text-center">
                            {template.config.large_image}
                          </span>
                        </div>
                        {template.config.small_image && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gray-600 rounded-full border border-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              {template.config.small_image.slice(0, 1)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm mb-1">
                        {template.config.details}
                      </div>
                      {template.config.state && (
                        <div className="text-gray-300 text-xs mb-1">
                          {template.config.state}
                        </div>
                      )}
                      {template.config.party_size > 0 &&
                        template.config.max_party_size > 0 && (
                          <div className="text-gray-300 text-xs">
                            ({template.config.party_size} of{" "}
                            {template.config.max_party_size})
                          </div>
                        )}
                    </div>
                  </div>

                  {template.config.buttons &&
                    template.config.buttons.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {template.config.buttons.map((button, buttonIndex) => (
                          <div
                            key={buttonIndex}
                            className="bg-gray-700 text-white text-xs py-1.5 px-3 rounded text-center"
                          >
                            {button.label}
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => onLoadTemplate(template)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Download size={16} />
                    <span>Use This Template</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-600">Buttons:</span>
                      <span className="text-gray-900 ml-1 font-medium">
                        {template.config.buttons?.length || 0}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <span className="text-gray-600">Images:</span>
                      <span className="text-gray-900 ml-1 font-medium">
                        {
                          [
                            template.config.large_image,
                            template.config.small_image,
                          ].filter(Boolean).length
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {templates.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Palette className="text-gray-400 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No templates found
            </h3>
            <p className="text-gray-600">
              Check your connection and try again later.
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100"
        >
          <div className="flex items-start space-x-4">
            <ExternalLink className="text-blue-600 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Want more templates?
              </h3>
              <p className="text-gray-600 mb-4">
                Browse our online collection of community-created templates and
                download them directly to your app.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                Browse Online Gallery
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
