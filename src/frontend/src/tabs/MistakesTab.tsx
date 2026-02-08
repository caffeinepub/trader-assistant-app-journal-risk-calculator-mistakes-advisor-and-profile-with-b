import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';
import { useGetAllMistakes } from '../hooks/useQueries';
import MistakeEntryForm from '../components/mistakes/MistakeEntryForm';
import MistakeList from '../components/mistakes/MistakeList';

export default function MistakesTab() {
  const { data: mistakes = [], isLoading } = useGetAllMistakes();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
      <Alert className="border-blue-600/20 bg-blue-600/10">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-600">AI-Powered Learning</AlertTitle>
        <AlertDescription>
          Log your trading mistakes and receive personalized AI suggestions to improve your strategy.
        </AlertDescription>
      </Alert>

      <MistakeEntryForm />
      <MistakeList mistakes={mistakes} isLoading={isLoading} />
    </div>
  );
}
