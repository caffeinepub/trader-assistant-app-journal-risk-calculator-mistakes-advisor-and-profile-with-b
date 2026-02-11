import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActorWithStatus } from './hooks/useActorWithStatus';
import { useInitializeUserAccess, useGetCallerUserProfile } from './hooks/useQueries';
import { useEntitlement } from './hooks/useEntitlement';
import { BookOpen, Calculator, AlertTriangle, User, RefreshCw, WifiOff, ServerCrash, ChevronDown, ChevronUp, Shield, Lock, AlertCircle } from 'lucide-react';
import LoginButton from './components/auth/LoginButton';
import ProfileSetupDialog from './components/profile/ProfileSetupDialog';
import JournalTab from './tabs/JournalTab';
import RiskCalculatorTab from './tabs/RiskCalculatorTab';
import MistakesTab from './tabs/MistakesTab';
import ProfileTab from './tabs/ProfileTab';
import AdminPanelTab from './tabs/AdminPanelTab';
import BottomNav from './components/navigation/BottomNav';
import TabScene from './components/navigation/TabScene';
import ViewContainer from './components/layout/ViewContainer';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { APP_NAME, APP_TAGLINE, LOGO_PATH } from './lib/branding';
import { classifyBackendError } from './lib/backendConnectionErrors';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type TabType = 'journal' | 'calculator' | 'mistakes' | 'profile' | 'admin';

export default function App() {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const { identity } = useInternetIdentity();
  const { status, error, retry, isConnecting, nextRetryIn, retryCount } = useActorWithStatus();

  const isAuthenticated = !!identity;

  // Show connecting state
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster />
        
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

        {/* Connecting State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <img 
              src={LOGO_PATH} 
              alt={`${APP_NAME} logo`}
              className="w-20 h-20 mx-auto object-contain animate-pulse"
            />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Connecting to backend...</h2>
              <p className="text-muted-foreground">
                {retryCount > 0 
                  ? `Retry attempt ${retryCount}. The backend is starting up, please wait...`
                  : 'Initializing the backend canister. This usually takes a few seconds.'
                }
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (status === 'error' && error) {
    const errorClassification = classifyBackendError(error);
    
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Toaster />
        
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
          </div>
        </header>

        {/* Error State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-4">
              {errorClassification.isMisconfigured ? (
                <ServerCrash className="w-16 h-16 mx-auto text-destructive" />
              ) : (
                <WifiOff className="w-16 h-16 mx-auto text-destructive" />
              )}
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {errorClassification.isMisconfigured 
                    ? 'Configuration Error' 
                    : 'Connection Error'
                  }
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {errorClassification.description}
                </p>
              </div>
            </div>

            <Alert variant="destructive" className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to connect to backend</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{errorClassification.description}</p>
                {errorClassification.shouldRetry && nextRetryIn !== null && (
                  <p className="text-sm">
                    {nextRetryIn > 0 
                      ? `Retrying in ${nextRetryIn} seconds...`
                      : 'Retrying now...'
                    }
                  </p>
                )}
              </AlertDescription>
            </Alert>

            {errorClassification.shouldRetry && (
              <div className="flex justify-center">
                <Button onClick={retry} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Now
                </Button>
              </div>
            )}

            <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full gap-2">
                  {showErrorDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Technical Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Technical Details
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="bg-muted p-4 rounded-lg text-sm font-mono break-all">
                  <p className="text-muted-foreground mb-2">Error Details:</p>
                  <p className="text-foreground">{error.message}</p>
                  {error.stack && (
                    <>
                      <p className="text-muted-foreground mt-4 mb-2">Stack Trace:</p>
                      <pre className="text-xs text-foreground whitespace-pre-wrap">{error.stack}</pre>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </main>
      </div>
    );
  }

  return <AuthenticatedApp isAuthenticated={isAuthenticated} />;
}

function AuthenticatedApp({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [activeTab, setActiveTab] = useState<TabType>('journal');

  // Initialize user access (auto-grant #user role)
  useInitializeUserAccess(isAuthenticated);

  // Fetch user profile with proper gating
  const { 
    data: userProfile, 
    isLoading: profileLoading,
    isFetched 
  } = useGetCallerUserProfile(isAuthenticated);

  const { hasJournal, hasCalculator, hasMistakes } = useEntitlement();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const tabs = [
    { id: 'journal' as TabType, label: 'Journal', icon: BookOpen, enabled: true },
    { id: 'calculator' as TabType, label: 'Lot Size', icon: Calculator, enabled: true },
    { id: 'mistakes' as TabType, label: 'Mistakes', icon: AlertTriangle, enabled: true },
    { id: 'profile' as TabType, label: 'Profile', icon: User, enabled: isAuthenticated },
    { id: 'admin' as TabType, label: 'Admin', icon: Shield, enabled: isAuthenticated },
  ];

  const renderTabContent = () => {
    if (!isAuthenticated) {
      return (
        <ViewContainer>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
            <Lock className="w-16 h-16 text-muted-foreground/50" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground max-w-md">
                Please log in to access your trading journal and tools.
              </p>
            </div>
            <LoginButton />
          </div>
        </ViewContainer>
      );
    }

    if (profileLoading) {
      return (
        <ViewContainer>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </div>
        </ViewContainer>
      );
    }

    switch (activeTab) {
      case 'journal':
        if (!hasJournal) {
          return (
            <ViewContainer>
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
                <Lock className="w-16 h-16 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Subscription Required</h2>
                  <p className="text-muted-foreground max-w-md">
                    Access to the trading journal requires an active subscription. Visit your profile to manage subscriptions.
                  </p>
                </div>
                <Button onClick={() => setActiveTab('profile')}>
                  Go to Profile
                </Button>
              </div>
            </ViewContainer>
          );
        }
        return <JournalTab />;
      case 'calculator':
        if (!hasCalculator) {
          return (
            <ViewContainer>
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
                <Lock className="w-16 h-16 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Subscription Required</h2>
                  <p className="text-muted-foreground max-w-md">
                    Access to the lot size calculator requires Pro (₹799) or Premium (₹999) plan. Visit your profile to upgrade.
                  </p>
                </div>
                <Button onClick={() => setActiveTab('profile')}>
                  Go to Profile
                </Button>
              </div>
            </ViewContainer>
          );
        }
        return <RiskCalculatorTab />;
      case 'mistakes':
        if (!hasMistakes) {
          return (
            <ViewContainer>
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-6">
                <Lock className="w-16 h-16 text-muted-foreground/50" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">Subscription Required</h2>
                  <p className="text-muted-foreground max-w-md">
                    Access to mistakes tracking requires Pro (₹799) or Premium (₹999) plan. Visit your profile to upgrade.
                  </p>
                </div>
                <Button onClick={() => setActiveTab('profile')}>
                  Go to Profile
                </Button>
              </div>
            </ViewContainer>
          );
        }
        return <MistakesTab />;
      case 'profile':
        return <ProfileTab />;
      case 'admin':
        return <AdminPanelTab />;
      default:
        return <JournalTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster />
      
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
      <main className="flex-1">
        <TabScene activeTab={activeTab}>
          {renderTabContent()}
        </TabScene>
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        tabs={tabs.filter(tab => tab.enabled)} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Profile Setup Dialog */}
      {showProfileSetup && <ProfileSetupDialog />}

      {/* Footer */}
      <footer className="hidden sm:block border-t border-border bg-card/30 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'unknown-app'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
