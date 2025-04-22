"use client";

import { useState } from "react";
import { User } from "firebase/auth";
import { UserCircle, Sliders, Sun, Lock } from "lucide-react";
import AppearanceSettings from "./AppearanceSettings";
import SecuritySettings from "./SecuritySettings";
import UserProfileForm from "./UserProfileForm";
import UserPreferences from "./UserPreferences";
// Puedes crear o importar tus componentes de Perfil y Preferencias aquí
// import ProfileSection from "./ProfileSection";
// import PreferencesSection from "./PreferencesSection";

const tabs = [
  {
    name: "Perfil",
    icon: UserCircle,
    content: <UserProfileForm />,
  },
  {
    name: "Preferencias",
    icon: Sliders,
    content: <UserPreferences />,
  },
  {
    name: "Apariencia",
    icon: Sun,
    content: <AppearanceSettings />,
  },
  {
    name: "Seguridad",
    icon: Lock,
    content: <SecuritySettings />,
  },
];

export default function ProfileTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative min-h-[60vh]">
      {/* Tabs header: fijo abajo en móvil, arriba en desktop */}
      {/* Desktop (sm+) */}
      <div className="hidden sm:flex overflow-x-auto scrollbar-none border-b border-muted mb-4">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = idx === activeTab;
          return (
            <button
              key={tab.name}
              className={`flex flex-col items-center justify-center px-4 py-2 min-w-[80px] focus:outline-none transition-colors duration-150 whitespace-nowrap
                ${isActive ? "border-b-2 border-primary text-primary font-semibold bg-muted/40" : "text-muted-foreground hover:text-primary"}
              `}
              onClick={() => setActiveTab(idx)}
              type="button"
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{tab.name}</span>
            </button>
          );
        })}
      </div>
      {/* Mobile: tabs fijas abajo */}
      <div className="sm:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-muted flex justify-around shadow-lg">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = idx === activeTab;
            return (
              <button
                key={tab.name}
                className={`flex flex-col items-center justify-center flex-1 py-2 focus:outline-none transition-colors duration-150
                  ${isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"}
                `}
                onClick={() => setActiveTab(idx)}
                type="button"
              >
                <div className={`flex flex-col items-center justify-center transition-colors duration-150 ${isActive ? "bg-primary text-primary-foreground" : ""} rounded-md py-2 px-2 ${tab.name === "Perfil" ? "w-20" : "w-22"}`}>
                  <Icon className="h-5 w-5 mb-0.5" />
                  <span className="text-xs">{tab.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Tab content */}
      <div className="pb-20 sm:pb-0 pt-2">
        {tabs[activeTab].content}
      </div>
    </div>
  );
} 