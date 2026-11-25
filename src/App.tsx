import { useState } from 'react';
import { AppDataProvider } from './context/AppDataContext';
import { TimerProvider } from './context/TimerContext';
import { Header, type ActiveTab } from './components/layout/Header';
import { UndoToast } from './components/layout/UndoToast';
import { TimerCard } from './components/timer/TimerCard';
import { SchedulePanel } from './components/schedule/SchedulePanel';
import { GoalsView } from './components/goals/GoalsView';
import { toLocalDateKey } from './utils/date';

function AppShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('focus');
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateKey());

  const handleJumpToSchedule = (dateKey: string) => {
    setSelectedDate(dateKey);
    setActiveTab('focus');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === 'focus' && (
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <TimerCard />
          </div>
          <div className="lg:col-span-7">
            <SchedulePanel selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
        </main>
      )}

      {activeTab === 'goals' && <GoalsView onJumpToSchedule={handleJumpToSchedule} />}

      {activeTab === 'analytics' && (
        <main className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-[var(--text-muted)] sm:px-6">
          复盘统计看板即将载入...
        </main>
      )}

      <UndoToast />
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <TimerProvider>
        <AppShell />
      </TimerProvider>
    </AppDataProvider>
  );
}
