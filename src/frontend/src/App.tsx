import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActorWithStatus } from './hooks/useActorWithStatus';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useEntitlement } from './hooks/useEntitlement';
import { BookOpen, Calculator, AlertTriangle, User, RefreshCw, WifiOff, ServerCrash, ChevronDown, ChevronUp } from 'lucide-react';
import LoginButton from './components/auth/LoginButton';
import ProfileSetupDialog from './components/profile/ProfileSetupDialog';
import JournalTab from './tabs/JournalTab';
import RiskCalculatorTab from './tabs/RiskCalculatorTab';
import MistakesTab from './tabs/MistakesTab';
import ProfileTab from './tabs/ProfileTab';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { APP_NAME, APP_TAGLINE, LOGO_PATH } from './lib/branding';
import { classifyBackendError } from './lib/backendConnectionErrors';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type TabType = 'journal' | 'calculator' | 'mistakes' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const { identity } = useInternetIdentity();
  const { status, error, retry, isConnecting, nextRetryIn } = useActorWithStatus();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const entitlement = useEntitlement();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && status === 'ready';

  // Build tabs based on entitlement
  const allTabs = [
    { id: 'journal' as TabType, label: 'Journal', icon: BookOpen, enabled: entitlement.hasJournal },
    { id: 'calculator' as TabType, label: 'Calculator', icon: Calculator, enabled: entitlement.hasCalculator },
    { id: 'mistakes' as TabType, label: 'Mistakes', icon: AlertTriangle, enabled: entitlement.hasMistakes },
    { id: 'profile' as TabType, label: 'Profile', icon: User, enabled: true }, // Profile always enabled
  ];

  const tabs = allTabs.filter(tab => tab.enabled);

  // Redirect to profile if current tab is not enabled and user is expired
  useEffect(() => {
    const currentTabEnabled = allTabs.find(tab => tab.id === activeTab)?.enabled;
    if (!currentTabEnabled) {
      setActiveTab('profile');
    }
  }, [entitlement, activeTab]);

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
                Initializing the backend canister. This usually takes a few seconds.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              {errorClassification.isStoppedCanister ? (
                <ServerCrash className="w-10 h-10 text-destructive" />
              ) : (
                <WifiOff className="w-10 h-10 text-destructive" />
              )}
            </div>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{errorClassification.title}</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>{errorClassification.description}</p>
                
                {/* Auto-retry indicator */}
                {errorClassification.isStoppedCanister && nextRetryIn !== null && (
                  <div className="mt-3 p-2 bg-background/50 rounded-md border border-border">
                    <p className="text-xs font-medium">
                      Automatically retrying in {nextRetryIn} second{nextRetryIn !== 1 ? 's' : ''}...
                    </p>
                  </div>
                )}

                {/* Error details collapsible */}
                {!errorClassification.showRawError && (
                  <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                      {showErrorDetails ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide technical details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show technical details
                        </>
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="p-2 bg-background/50 rounded text-xs font-mono break-all">
                        {error.message}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-foreground">What to do:</p>
              <ul className="text-sm text-muted-foreground space-y-2 text-left list-decimal list-inside">
                <li>Click "Try Again" below to retry the connection</li>
                <li>If the error persists, refresh the page completely</li>
                <li>Wait 10-15 seconds after refresh for the backend to initialize</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={retry} 
                disabled={isConnecting || nextRetryIn !== null}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                size="lg"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${nextRetryIn !== null ? 'animate-spin' : ''}`} />
                {nextRetryIn !== null ? `Retrying in ${nextRetryIn}s...` : 'Try Again'}
              </Button>
              
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
      <main className="flex-1 pb-20 md:pb-24">
        {!isAuthenticated ? (
          <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-md text-center space-y-6">
              <img 
                src={LOGO_PATH} 
                alt={`${APP_NAME} logo`}
                className="w-20 h-20 mx-auto object-contain"
              />
              <h2 className="text-3xl font-bold">Welcome to {APP_NAME}</h2>
              <p className="text-muted-foreground text-lg">
                Your professional trading companion. Track trades, manage risk, learn from mistakes, and improve your trading performance.
              </p>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-blue-600">
                  🎉 Get 2 days free trial with all features!
                </p>
                <LoginButton />
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'journal' && entitlement.hasJournal && <JournalTab />}
            {activeTab === 'calculator' && entitlement.hasCalculator && <RiskCalculatorTab />}
            {activeTab === 'mistakes' && entitlement.hasMistakes && <MistakesTab />}
            {activeTab === 'profile' && <ProfileTab />}
            
            {/* Show upgrade message if trying to access disabled tab or expired */}
            {entitlement.isExpired && activeTab !== 'profile' && (
              <div className="container mx-auto px-4 py-16 text-center space-y-4">
                <Alert variant="destructive" className="max-w-2xl mx-auto">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Trial Expired</AlertTitle>
                  <AlertDescription>
                    Your 2-day free trial has expired. Please select a plan in the Profile tab to continue using the app.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setActiveTab('profile')} className="bg-blue-600 hover:bg-blue-700">
                  Go to Profile & Select Plan
                </Button>
              </div>
            )}
            {activeTab === 'calculator' && !entitlement.hasCalculator && !entitlement.isExpired && (
              <div className="container mx-auto px-4 py-16 text-center space-y-4">
                <Alert className="max-w-2xl mx-auto">
                  <AlertTitle>Upgrade Required</AlertTitle>
                  <AlertDescription>
                    The Calculator feature is available in Pro (₹799) and Premium (₹999) plans. Please upgrade your subscription to access this feature.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setActiveTab('profile')} className="bg-blue-600 hover:bg-blue-700">
                  View Plans
                </Button>
              </div>
            )}
            {activeTab === 'mistakes' && !entitlement.hasMistakes && !entitlement.isExpired && (
              <div className="container mx-auto px-4 py-16 text-center space-y-4">
                <Alert className="max-w-2xl mx-auto">
                  <AlertTitle>Upgrade Required</AlertTitle>
                  <AlertDescription>
                    The Mistakes Tracker is available in the Premium plan (₹999). Please upgrade your subscription to access this feature.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => setActiveTab('profile')} className="bg-blue-600 hover:bg-blue-700">
                  View Plans
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      {isAuthenticated && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
          <div className="container mx-auto px-2">
            <div className="flex items-center justify-around">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 transition-colors ${
                      isActive
                        ? 'text-blue-500'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Profile Setup Dialog */}
      {showProfileSetup && <ProfileSetupDialog />}
    </div>
  );
}
