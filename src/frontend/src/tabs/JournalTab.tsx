import { useState, useEffect } from 'react';
import { useGetAllTrades, useGetAnalytics } from '../hooks/useQueries';
import JournalAnalyticsHeader from '../components/journal/JournalAnalyticsHeader';
import TradeEntryForm from '../components/journal/TradeEntryForm';
import TradeList from '../components/journal/TradeList';
import ProfitCalendar from '../components/journal/ProfitCalendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function JournalTab() {
  const { data: trades = [], isLoading, error } = useGetAllTrades();
  const { data: analytics } = useGetAnalytics(null, null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Filter trades by selected date
  const filteredTrades = selectedDate
    ? trades.filter((trade) => {
        const tradeDate = new Date(Number(trade.tradeDate) / 1_000_000);
        return (
          tradeDate.getDate() === selectedDate.getDate() &&
          tradeDate.getMonth() === selectedDate.getMonth() &&
          tradeDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : trades;

  // Clear selection if selected date no longer has trades
  useEffect(() => {
    if (selectedDate && filteredTrades.length === 0 && trades.length > 0) {
      setSelectedDate(undefined);
    }
  }, [selectedDate, filteredTrades.length, trades.length]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load trades. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Analytics Header */}
      <JournalAnalyticsHeader analytics={analytics} />

      {/* Trade Entry Form */}
      <TradeEntryForm />

      {/* Tabs for Trades List and Calendar */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Trades List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <TradeList trades={filteredTrades} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <ProfitCalendar
            trades={trades}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {selectedDate && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                Trades on {selectedDate.toLocaleDateString()}
              </h3>
              <TradeList trades={filteredTrades} isLoading={false} compact />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
