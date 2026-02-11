import { useGetAllMistakes } from '../hooks/useQueries';
import MistakeEntryForm from '../components/mistakes/MistakeEntryForm';
import MistakeList from '../components/mistakes/MistakeList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function MistakesTab() {
  const { data: mistakes = [], isLoading } = useGetAllMistakes();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Trading Mistakes Log</h2>
        <p className="text-muted-foreground">
          Track and learn from your trading mistakes with AI-powered suggestions
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Lightbulb className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">AI Suggestions</AlertTitle>
        <AlertDescription>
          Our AI analyzes your mistakes and provides personalized suggestions to help you improve your trading strategy.
        </AlertDescription>
      </Alert>

      <MistakeEntryForm />
      <MistakeList mistakes={mistakes} isLoading={isLoading} />
    </div>
  );
}
