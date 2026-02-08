import { useState, useEffect } from 'react';
import { useGetAllTrades, useGetAnalytics } from '../hooks/useQueries';
import JournalAnalyticsHeader from '../components/journal/JournalAnalyticsHeader';
import TradeEntryForm from '../components/journal/TradeEntryForm';
import TradeList from '../components/journal/TradeList';
import ProfitCalendar from '../components/journal/ProfitCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar as CalendarIcon } from 'lucide-react';

export default function JournalTab() {
  const { data: trades = [], isLoading } = useGetAllTrades();
  const { data: analytics } = useGetAnalytics();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Clear selection if the selected date no longer has trades or is outside current view
  useEffect(() => {
    if (selectedDate) {
      const hasTradesOnDate = trades.some((trade) => {
        const tradeDate = new Date(Number(trade.tradeDate) / 1_000_000);
        return (
          tradeDate.getDate() === selectedDate.getDate() &&
          tradeDate.getMonth() === selectedDate.getMonth() &&
          tradeDate.getFullYear() === selectedDate.getFullYear()
        );
      });
      
      if (!hasTradesOnDate) {
        setSelectedDate(undefined);
      }
    }
  }, [trades, selectedDate]);

  const tradesForSelectedDate = selectedDate
    ? trades.filter((trade) => {
        const tradeDate = new Date(Number(trade.tradeDate) / 1_000_000);
        return (
          tradeDate.getDate() === selectedDate.getDate() &&
          tradeDate.getMonth() === selectedDate.getMonth() &&
          tradeDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <JournalAnalyticsHeader analytics={analytics} />

      <div className="mt-8">
        <Tabs defaultValue="trades" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="trades">
              <BookOpen className="w-4 h-4 mr-2" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trades" className="space-y-6 mt-6">
            <TradeEntryForm />
            <TradeList trades={trades} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <ProfitCalendar
              trades={trades}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            {selectedDate && tradesForSelectedDate.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>
                    Trades for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                  <CardDescription>
                    {tradesForSelectedDate.length} trade{tradesForSelectedDate.length !== 1 ? 's' : ''} on this day
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TradeList trades={tradesForSelectedDate} isLoading={false} compact />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
