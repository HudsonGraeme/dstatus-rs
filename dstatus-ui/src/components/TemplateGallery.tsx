import { open } from "@tauri-apps/api/dialog";
import { invoke } from "@tauri-apps/api/tauri";
import {
  ExternalLink,
  FileText,
  Link,
  Loader,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { Config, Template, UserTemplate } from "../types";

interface TemplateGalleryProps {
  onLoadTemplate: (template: Template) => void;
  onSelectTemplate?: (template: Template | UserTemplate) => void;
  selectedTemplate?: Template | UserTemplate | null;
  isTemplateInUse?: (template: Template | UserTemplate) => boolean;
}

export default function TemplateGallery({
  onLoadTemplate,
  onSelectTemplate,
  selectedTemplate,
  isTemplateInUse,
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
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-zinc-800/50 border border-zinc-700/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const inUse = isTemplateInUse ? isTemplateInUse(template) : false;
        const isSelected =
          selectedTemplate &&
          !("id" in selectedTemplate) &&
          selectedTemplate.name === template.name;

        return (
          <div
            key={template.name}
            className={cn(
              "bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3 hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer",
              isSelected && "ring-1 ring-blue-500"
            )}
            onClick={() =>
              onSelectTemplate
                ? onSelectTemplate(template)
                : onLoadTemplate(template)
            }
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-medium text-white truncate">
                {template.name}
              </h4>
            </div>
            <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
              {template.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-500 space-x-2">
                <span>{template.config.buttons?.length || 0} buttons</span>
                <span>•</span>
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (!inUse) onLoadTemplate(template);
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

      {templates.length === 0 && !loading && (
        <div className="col-span-full text-center py-8">
          <ExternalLink className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No gallery templates</p>
        </div>
      )}
    </div>
  );
}

function ImportButton({
  onLoadTemplate,
}: {
  onLoadTemplate: (template: Template) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center space-x-2 rounded-lg bg-zinc-700/60 hover:bg-zinc-600/60 border border-zinc-600/40 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:scale-105"
      >
        <UploadCloud className="h-4 w-4" />
        <span>Import</span>
      </button>

      {isOpen && (
        <ImportModal
          onClose={() => setIsOpen(false)}
          onLoadTemplate={onLoadTemplate}
        />
      )}
    </>
  );
}

function ImportModal({
  onClose,
  onLoadTemplate,
}: {
  onClose: () => void;
  onLoadTemplate: (template: Template) => void;
}) {
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilePick = async () => {
    setError(null);
    const selected = await open({
      multiple: false,
      filters: [{ name: "TOML", extensions: ["toml"] }],
    });

    if (typeof selected === "string") {
      setSource(selected);
    }
  };

  const handleImport = async () => {
    if (!source) return;
    setIsLoading(true);
    setError(null);

    try {
      const config = await invoke<Config>("load_config_from_source", {
        source,
      });
      const template: Template = {
        name: "Imported Template",
        description: `Imported from ${source}`,
        config,
      };
      onLoadTemplate(template);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-700/50 bg-zinc-900/80 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Import Template</h3>
          <p className="text-sm text-zinc-400">
            Import a template from a local file or a URL.
          </p>

          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Enter URL or select a file"
                className="w-full rounded-lg border border-zinc-600/50 bg-zinc-800/50 px-10 py-3 text-white placeholder-zinc-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                {source.startsWith("http") ? (
                  <Link className="h-4 w-4 text-zinc-500" />
                ) : (
                  <FileText className="h-4 w-4 text-zinc-500" />
                )}
              </div>
            </div>

            <button
              onClick={handleFilePick}
              className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-700/60 rounded-lg border border-zinc-600/40 hover:bg-zinc-600/60"
            >
              Browse
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!source || isLoading}
              className="inline-flex items-center space-x-2 rounded-lg bg-black border border-white/20 hover:bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
            >
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              <span>Import</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
