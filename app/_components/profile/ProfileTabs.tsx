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
    <div>
      {/* Tabs header */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-muted mb-4">
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
      {/* Tab content */}
      <div>
        {tabs[activeTab].content}
      </div>
    </div>
  );
} 