import { motion } from "framer-motion";
import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Config } from "../types";

interface ConfigEditorProps {
  config: Config;
  onSave: (config: Config) => void;
}

export default function ConfigEditor({ config, onSave }: ConfigEditorProps) {
  const [editedConfig, setEditedConfig] = useState<Config>({ ...config });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedConfig);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Config, value: string | number) => {
    setEditedConfig((prev) => ({ ...prev, [field]: value }));
  };

  const addButton = () => {
    const buttons = editedConfig.buttons || [];
    if (buttons.length < 2) {
      setEditedConfig((prev) => ({
        ...prev,
        buttons: [...buttons, { label: "", url: "" }],
      }));
    }
  };

  const updateButton = (index: number, field: keyof Button, value: string) => {
    const buttons = [...(editedConfig.buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    setEditedConfig((prev) => ({ ...prev, buttons }));
  };

  const removeButton = (index: number) => {
    const buttons = editedConfig.buttons?.filter((_, i) => i !== index) || [];
    setEditedConfig((prev) => ({
      ...prev,
      buttons: buttons.length > 0 ? buttons : undefined,
    }));
  };

  const inputClasses =
    "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200";

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Application Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={editedConfig.client_id}
                    onChange={(e) => updateField("client_id", e.target.value)}
                    className={inputClasses}
                    placeholder="Your Discord application's client ID"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Rich Presence Content
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details
                  </label>
                  <input
                    type="text"
                    value={editedConfig.details}
                    onChange={(e) => updateField("details", e.target.value)}
                    className={inputClasses}
                    placeholder="What you're doing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={editedConfig.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className={inputClasses}
                    placeholder="Additional info"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Large Image
                  </label>
                  <input
                    type="text"
                    value={editedConfig.large_image}
                    onChange={(e) => updateField("large_image", e.target.value)}
                    className={inputClasses}
                    placeholder="Image key or URL"
                  />
                  <input
                    type="text"
                    value={editedConfig.large_text}
                    onChange={(e) => updateField("large_text", e.target.value)}
                    className={`${inputClasses} mt-2`}
                    placeholder="Large image hover text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Small Image
                  </label>
                  <input
                    type="text"
                    value={editedConfig.small_image}
                    onChange={(e) => updateField("small_image", e.target.value)}
                    className={inputClasses}
                    placeholder="Image key or URL"
                  />
                  <input
                    type="text"
                    value={editedConfig.small_text}
                    onChange={(e) => updateField("small_text", e.target.value)}
                    className={`${inputClasses} mt-2`}
                    placeholder="Small image hover text"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Party
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Party Size
                  </label>
                  <input
                    type="number"
                    value={editedConfig.party_size}
                    onChange={(e) =>
                      updateField("party_size", parseInt(e.target.value) || 0)
                    }
                    className={inputClasses}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Party Size
                  </label>
                  <input
                    type="number"
                    value={editedConfig.max_party_size}
                    onChange={(e) =>
                      updateField(
                        "max_party_size",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className={inputClasses}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Buttons</h3>
                <button
                  onClick={addButton}
                  disabled={(editedConfig.buttons?.length || 0) >= 2}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  <span>Add Button</span>
                </button>
              </div>

              {editedConfig.buttons?.map((button, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 border border-gray-200 rounded-xl mb-3"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-gray-700">
                      Button {index + 1}
                    </h4>
                    <button
                      onClick={() => removeButton(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={button.label}
                      onChange={(e) =>
                        updateButton(index, "label", e.target.value)
                      }
                      className={inputClasses}
                      placeholder="Button label"
                    />
                    <input
                      type="url"
                      value={button.url}
                      onChange={(e) =>
                        updateButton(index, "url", e.target.value)
                      }
                      className={inputClasses}
                      placeholder="Button URL"
                    />
                  </div>
                </motion.div>
              ))}

              {!editedConfig.buttons?.length && (
                <p className="text-gray-500 text-center py-8">
                  No buttons added. Click "Add Button" to create one.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-6 bg-white">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
