import React from "react";
import { cn } from "@bill/_lib/utils";
import { Button } from "./button";
import { Switch } from "./switch";
import { Separator } from "./separator";

export interface SettingOption {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface SettingSection {
  title: string;
  description?: string;
  options?: SettingOption[];
  customContent?: React.ReactNode;
  icon?: React.ReactNode;
}

interface SettingsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  sections: SettingSection[];
  showSaveButton?: boolean;
  onSave?: () => void;
  saveButtonText?: string;
  showResetButton?: boolean;
  onReset?: () => void;
  resetButtonText?: string;
  saveButtonDisabled?: boolean;
  resetButtonDisabled?: boolean;
}

export function SettingsPanel({
  title,
  description,
  sections,
  showSaveButton = false,
  onSave,
  saveButtonText = "Guardar cambios",
  showResetButton = false,
  onReset,
  resetButtonText = "Restablecer",
  saveButtonDisabled = false,
  resetButtonDisabled = false,
  className,
  ...props
}: SettingsPanelProps) {
  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {sections.map((section, index) => (
        <div key={`section-${index}`} className="space-y-3">
          {section.title && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center">
                {section.icon}
                {section.title}
              </h4>
              {section.description && (
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 rounded-md border p-3 sm:p-4">
            {section.options?.map((option) => (
              <div
                key={option.id}
                className="flex flex-wrap items-start justify-between gap-2"
              >
                <div className="space-y-0.5 flex-1 min-w-[200px]">
                  <label
                    htmlFor={option.id}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>
                <Switch
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={option.onChange}
                />
              </div>
            ))}
            {section.customContent && (
              <div className="w-full">
                {section.customContent}
              </div>
            )}
          </div>
        </div>
      ))}

      {(showSaveButton || showResetButton) && (
        <>
          <Separator />
          <div className="flex flex-wrap justify-end gap-2">
            {showResetButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={resetButtonDisabled}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                {resetButtonText}
              </Button>
            )}
            {showSaveButton && (
              <Button
                size="sm"
                onClick={onSave}
                disabled={saveButtonDisabled}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                {saveButtonText}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
} 