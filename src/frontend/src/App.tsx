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
            <LoginButton />
          </div>
        </header>

        {/* Error State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              {errorClassification.isMisconfigured ? (
                <AlertCircle className="w-10 h-10 text-destructive" />
              ) : errorClassification.isStoppedCanister ? (
                <ServerCrash className="w-10 h-10 text-destructive" />
              ) : errorClassification.isAuthorizationError ? (
                <Lock className="w-10 h-10 text-destructive" />
              ) : (
                <WifiOff className="w-10 h-10 text-destructive" />
              )}
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{errorClassification.title}</h2>
              <p className="text-muted-foreground">{errorClassification.description}</p>
            </div>

            {errorClassification.isStoppedCanister && !errorClassification.isMisconfigured && (
              <Alert>
                <AlertTitle>What you can do:</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">• Wait 10-15 seconds for the backend to start automatically</p>
                  <p className="text-sm">• Refresh the page if the issue persists</p>
                  <p className="text-sm">• The app will automatically retry the connection</p>
                </AlertDescription>
              </Alert>
            )}

            {errorClassification.isAuthorizationError && (
              <Alert>
                <AlertTitle>What you can do:</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="text-sm">• Try logging out and logging in again</p>
                  <p className="text-sm">• Contact support if the issue persists</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              {errorClassification.shouldRetry && (
                <Button onClick={retry} className="w-full" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                  {nextRetryIn !== null && nextRetryIn > 0 && ` (${Math.ceil(nextRetryIn)}s)`}
                </Button>
              )}

              <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full">
                    {showErrorDetails ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Technical Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show Technical Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <Alert>
                    <AlertDescription className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1">Error Type:</p>
                        <p className="text-xs font-mono break-all">
                          {errorClassification.isMisconfigured 
                            ? 'Configuration Error (Missing Backend Canister ID)' 
                            : errorClassification.isStoppedCanister 
                            ? 'Stopped Canister / Health Check Failed' 
                            : errorClassification.isAuthorizationError 
                            ? 'Authorization Error' 
                            : 'Connection Error'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Error Message:</p>
                        <p className="text-xs font-mono break-all">{error.message}</p>
                      </div>
                      {errorClassification.diagnostics && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Backend Diagnostics:</p>
                          <pre className="text-xs font-mono break-all whitespace-pre-wrap bg-muted p-2 rounded">
                            {errorClassification.diagnostics}
                          </pre>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold mb-1">Retry Count:</p>
                        <p className="text-xs">{retryCount} attempts</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main app UI - only render when backend is ready
  if (status === 'ready') {
    return <AuthenticatedApp isAuthenticated={isAuthenticated} />;
  }

  // Safe loading fallback (instead of null)
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

// Separate component that uses hooks requiring authenticated actor
function AuthenticatedApp({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  
  // Initialize user access on login (auto-grants #user role)
  const { isLoading: isInitializing, isError: initError } = useInitializeUserAccess(isAuthenticated);
  
  // Only fetch profile after initialization completes
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile(!isInitializing);
  const entitlement = useEntitlement();

  const showProfileSetup = isAuthenticated && !isInitializing && !profileLoading && isFetched && userProfile === null;

  // Build tabs based on entitlement - Admin Panel always visible when authenticated
  const allTabs = [
    { id: 'journal' as TabType, label: 'Journal', icon: BookOpen, enabled: entitlement.hasJournal },
    { id: 'calculator' as TabType, label: 'Calculator', icon: Calculator, enabled: entitlement.hasCalculator },
    { id: 'mistakes' as TabType, label: 'Mistakes', icon: AlertTriangle, enabled: entitlement.hasMistakes },
    { id: 'profile' as TabType, label: 'Profile', icon: User, enabled: true },
    { id: 'admin' as TabType, label: 'Admin', icon: Shield, enabled: isAuthenticated },
  ];

  const tabs = allTabs.filter(tab => tab.enabled);

  // Redirect to profile if current tab is not enabled
  useEffect(() => {
    const currentTabEnabled = allTabs.find(tab => tab.id === activeTab)?.enabled;
    if (!currentTabEnabled) {
      setActiveTab('profile');
    }
  }, [entitlement, activeTab, isAuthenticated]);

  // Show initializing state after login
  if (isAuthenticated && isInitializing) {
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

        {/* Initializing State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <img 
              src={LOGO_PATH} 
              alt={`${APP_NAME} logo`}
              className="w-20 h-20 mx-auto object-contain animate-pulse"
            />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Setting up your account...</h2>
              <p className="text-muted-foreground">
                Initializing your user access. This will only take a moment.
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

  // Show error if initialization failed
  if (initError) {
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

        {/* Error State */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Initialization Failed</h2>
              <p className="text-muted-foreground">
                Failed to initialize your user access. Please try logging out and logging in again.
              </p>
            </div>

            <Button onClick={() => window.location.reload()} className="w-full" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Main app UI
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

      {/* Main Content - with key prop to force remount on tab change */}
      <main className="flex-1 bg-background app-content">
        <div key={activeTab} className="w-full h-full">
          {activeTab === 'journal' && <JournalTab />}
          {activeTab === 'calculator' && <RiskCalculatorTab />}
          {activeTab === 'mistakes' && <MistakesTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'admin' && <AdminPanelTab />}
        </div>
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
