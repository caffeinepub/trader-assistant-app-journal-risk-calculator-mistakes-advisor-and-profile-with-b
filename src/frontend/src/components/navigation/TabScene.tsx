import { ReactNode } from 'react';

interface TabSceneProps {
  activeTab: string;
  children: ReactNode;
}

/**
 * TabScene ensures only the active tab content is mounted in the DOM,
 * preventing overlap and stacking issues when switching between tabs.
 */
export default function TabScene({ activeTab, children }: TabSceneProps) {
  return (
    <div key={activeTab} className="w-full h-full">
      {children}
    </div>
  );
}
