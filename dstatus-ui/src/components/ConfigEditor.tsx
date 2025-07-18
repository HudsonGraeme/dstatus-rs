import { Check, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CSSTransition } from "react-transition-group";
import { Config, Button as ConfigButton } from "../types";

// InputField component is now defined outside to prevent re-creation on every render
const InputField = ({
  label,
  name,
  value,
  placeholder,
  type = "text",
  description,
  onChange,
}: {
  label: string;
  name: keyof Config;
  value: string | number;
  placeholder: string;
  type?: string;
  description?: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-semibold text-zinc-200">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 backdrop-blur-sm px-4 py-3 text-white placeholder-zinc-500 shadow-sm transition-all duration-200 focus:border-blue-500/50 focus:bg-zinc-800/80 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
    />
    {description && <p className="text-xs text-zinc-400">{description}</p>}
  </div>
);

interface ConfigEditorProps {
  config: Config;
  onSave: (config: Config) => void;
}

export default function ConfigEditor({
  config: initialConfig,
  onSave,
}: ConfigEditorProps) {
  const [editConfig, setEditConfig] = useState<Config>(initialConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const nodeRef = useRef(null);

  // Check for changes whenever editConfig updates
  useEffect(() => {
    const hasChanges =
      JSON.stringify(editConfig) !== JSON.stringify(initialConfig);
    setHasChanges(hasChanges);
  }, [editConfig, initialConfig]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isNumber =
      type === "number" || name === "party_size" || name === "max_party_size";
    setEditConfig((prev) => ({
      ...prev,
      [name]: isNumber ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEditConfig((prev) => ({ ...prev, [name]: checked }));
  };

  const handleButtonChange = (
    index: number,
    field: keyof ConfigButton,
    value: string
  ) => {
    const buttons = [...(editConfig.buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    setEditConfig((prev) => ({ ...prev, buttons }));
  };

  const addButton = () => {
    const buttons = editConfig.buttons || [];
    if (buttons.length < 2) {
      setEditConfig((prev) => ({
        ...prev,
        buttons: [...buttons, { label: "", url: "" }],
      }));
    }
  };

  const removeButton = (index: number) => {
    const buttons = editConfig.buttons?.filter((_, i) => i !== index) || [];
    setEditConfig((prev) => ({
      ...prev,
      buttons: buttons.length > 0 ? buttons : undefined,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSave(editConfig);
      setSaveSuccess(true);
      setHasChanges(false);

      // Reset success state after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditConfig(initialConfig);
    setHasChanges(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl space-y-8">
          {/* Basic Configuration */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
              Basic Configuration
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Details"
                name="details"
                value={editConfig.details}
                placeholder="What you're doing"
                description="The main activity text"
                onChange={handleChange}
              />
              <InputField
                label="State"
                name="state"
                value={editConfig.state}
                placeholder="Additional context"
                description="Additional activity information"
                onChange={handleChange}
              />
              <InputField
                label="Client ID"
                name="client_id"
                value={editConfig.client_id}
                placeholder="Discord application client ID"
                description="Your Discord app's client ID"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Images Configuration */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Images</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Large Image"
                name="large_image"
                value={editConfig.large_image}
                placeholder="large_image_key"
                description="Image key from Discord app assets"
                onChange={handleChange}
              />
              <InputField
                label="Large Image Text"
                name="large_text"
                value={editConfig.large_text}
                placeholder="Hover text for large image"
                description="Text shown on hover"
                onChange={handleChange}
              />
              <InputField
                label="Small Image"
                name="small_image"
                value={editConfig.small_image}
                placeholder="small_image_key"
                description="Small overlay image key"
                onChange={handleChange}
              />
              <InputField
                label="Small Image Text"
                name="small_text"
                value={editConfig.small_text}
                placeholder="Hover text for small image"
                description="Text shown on hover"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Party Configuration */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Party</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputField
                label="Party Size"
                name="party_size"
                type="number"
                value={editConfig.party_size}
                placeholder="1"
                description="Current party size"
                onChange={handleChange}
              />
              <InputField
                label="Max Party Size"
                name="max_party_size"
                type="number"
                value={editConfig.max_party_size}
                placeholder="4"
                description="Maximum party size"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Options */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Options</h3>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="timestamps"
                name="timestamps"
                checked={editConfig.timestamps}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500/20 focus:ring-2"
              />
              <label
                htmlFor="timestamps"
                className="text-sm font-medium text-zinc-200"
              >
                Show timestamps
              </label>
            </div>
          </div>

          {/* Buttons Configuration */}
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Buttons</h3>
              <button
                onClick={addButton}
                disabled={(editConfig.buttons?.length || 0) >= 2}
                className="inline-flex items-center space-x-2 rounded-lg bg-zinc-700/60 hover:bg-zinc-600/60 border border-zinc-600/40 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus className="h-4 w-4" />
                <span>Add Button</span>
              </button>
            </div>

            <div className="space-y-4">
              {editConfig.buttons?.map((button, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-600/50 bg-zinc-700/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-zinc-300">
                      Button {index + 1}
                    </span>
                    <button
                      onClick={() => removeButton(index)}
                      className="rounded-md p-1 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      value={button.label}
                      onChange={(e) =>
                        handleButtonChange(index, "label", e.target.value)
                      }
                      placeholder="Button Label"
                      className="w-full rounded-lg border border-zinc-600/50 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={button.url}
                      onChange={(e) =>
                        handleButtonChange(index, "url", e.target.value)
                      }
                      placeholder="Button URL"
                      className="w-full rounded-lg border border-zinc-600/50 bg-zinc-800/50 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              {!editConfig.buttons?.length && (
                <div className="text-center py-8 text-zinc-400">
                  No buttons added. Click "Add Button" to create one.
                </div>
              )}
            </div>
          </div>

          {/* Extra padding at bottom for dynamic island */}
          <div className="h-24" />
        </div>
      </div>

      {/* Dynamic Island Save Bar - Animation with react-transition-group */}
      <CSSTransition
        in={hasChanges}
        nodeRef={nodeRef}
        timeout={500}
        classNames="dynamic-island"
        unmountOnExit
      >
        <div
          ref={nodeRef}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 rounded-2xl px-8 py-4 shadow-2xl">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-zinc-200">
                  Unsaved changes
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleReset}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-all duration-200 hover:scale-105 disabled:opacity-50"
                >
                  Reset
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 rounded-lg bg-zinc-700/80 hover:bg-zinc-600/80 border border-zinc-600/50 px-4 py-2 text-sm font-medium text-zinc-200 shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-zinc-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-zinc-300/30 border-t-zinc-300 rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
}
