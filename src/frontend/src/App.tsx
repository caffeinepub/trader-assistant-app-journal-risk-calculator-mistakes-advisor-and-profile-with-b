import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useEntitlement } from './hooks/useEntitlement';
import { BookOpen, Calculator, AlertTriangle, User } from 'lucide-react';
import LoginButton from './components/auth/LoginButton';
import ProfileSetupDialog from './components/profile/ProfileSetupDialog';
import JournalTab from './tabs/JournalTab';
import RiskCalculatorTab from './tabs/RiskCalculatorTab';
import MistakesTab from './tabs/MistakesTab';
import ProfileTab from './tabs/ProfileTab';
import BottomNav from './components/navigation/BottomNav';
import ViewContainer from './components/layout/ViewContainer';
import { Toaster } from '@/components/ui/sonner';
import { APP_NAME, APP_TAGLINE, LOGO_PATH } from './lib/branding';

type TabType = 'journal' | 'calculator' | 'mistakes' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  
  const isAuthenticated = !!identity;
  
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const entitlement = useEntitlement();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  // Build tabs based on entitlement
  const allTabs = [
    { id: 'journal' as TabType, label: 'Journal', icon: BookOpen, enabled: entitlement.hasJournal },
    { id: 'calculator' as TabType, label: 'Calculator', icon: Calculator, enabled: entitlement.hasCalculator },
    { id: 'mistakes' as TabType, label: 'Mistakes', icon: AlertTriangle, enabled: entitlement.hasMistakes },
    { id: 'profile' as TabType, label: 'Profile', icon: User, enabled: true },
  ];

  const tabs = allTabs.filter(tab => tab.enabled);

  // Redirect to calculator if current tab is not enabled
  useEffect(() => {
    const currentTabEnabled = allTabs.find(tab => tab.id === activeTab)?.enabled;
    if (!currentTabEnabled) {
      setActiveTab('calculator');
    }
  }, [entitlement, activeTab]);

  // Show loading state while actor is initializing
  if (isFetching || !actor) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Toaster />
        <div className="text-center space-y-4">
          <img 
            src={LOGO_PATH} 
            alt={`${APP_NAME} logo`}
            className="w-16 h-16 mx-auto object-contain animate-pulse"
          />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col app-shell">
      <Toaster />
      {showProfileSetup && <ProfileSetupDialog />}

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_PATH} 
              alt={`${APP_NAME} logo`}
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{APP_NAME}</h1>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>
          <LoginButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-background app-content">
        <ViewContainer>
          {activeTab === 'journal' && <JournalTab />}
          {activeTab === 'calculator' && <RiskCalculatorTab />}
          {activeTab === 'mistakes' && <MistakesTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </ViewContainer>
      </main>

      {/* Bottom Navigation */}
      <BottomNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm py-6 app-footer">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()}. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
