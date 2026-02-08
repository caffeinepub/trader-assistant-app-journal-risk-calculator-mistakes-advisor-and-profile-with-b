import { useState, useMemo } from 'react';
import type { TradeEntry } from '../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { calculatePL, formatSignedPL } from '../../lib/trades';

interface Props {
  trades: TradeEntry[];
  selectedDate?: Date;
  onSelectDate: (date: Date | undefined) => void;
}

interface DayData {
  netPL: number;
  tradeCount: number;
}

export default function ProfitCalendar({ trades, selectedDate, onSelectDate }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const dailyData = useMemo(() => {
    const data = new Map<string, DayData>();
    
    trades.forEach((trade) => {
      const date = new Date(Number(trade.tradeDate) / 1_000_000);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const pl = calculatePL(trade);
      
      const existing = data.get(key) || { netPL: 0, tradeCount: 0 };
      data.set(key, {
        netPL: existing.netPL + pl,
        tradeCount: existing.tradeCount + 1,
      });
    });

    return data;
  }, [trades]);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDataForDay = (day: number): DayData | null => {
    const key = `${year}-${month}-${day}`;
    return dailyData.get(key) || null;
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    if (isSelectedDate(day)) {
      onSelectDate(undefined);
    } else {
      onSelectDate(date);
    }
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profit Calendar</CardTitle>
            <CardDescription>Daily P/L overview and trade count</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {blanks.map((blank) => (
            <div key={`blank-${blank}`} />
          ))}
          {days.map((day) => {
            const dayData = getDataForDay(day);
            const hasTrades = dayData !== null;
            const isSelected = isSelectedDate(day);
            
            return (
              <button
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  aspect-square rounded-lg p-2 text-sm font-medium transition-all
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background' : ''}
                  ${hasTrades
                    ? dayData.netPL > 0
                      ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                      : dayData.netPL < 0
                      ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      : 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
              >
                <div className="flex flex-col items-center justify-center h-full gap-0.5">
                  <span className="text-base">{day}</span>
                  {hasTrades && (
                    <>
                      <span className="text-[10px] font-bold leading-tight">
                        {formatSignedPL(dayData.netPL)}
                      </span>
                      <span className="text-[9px] opacity-80 leading-tight">
                        {dayData.tradeCount} {dayData.tradeCount === 1 ? 'trade' : 'trades'}
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
