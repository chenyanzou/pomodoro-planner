import { AppDataProvider } from './context/AppDataContext';
import { TimerProvider } from './context/TimerContext';
import { Header } from './components/layout/Header';
import { TimerCard } from './components/timer/TimerCard';
import { SchedulePanel } from './components/schedule/SchedulePanel';

export default function App() {
  return (
    <AppDataProvider>
      <TimerProvider>
        <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
          <Header />
          <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <TimerCard />
            </div>
            <div className="lg:col-span-7">
              <SchedulePanel />
            </div>
          </main>
        </div>
      </TimerProvider>
    </AppDataProvider>
  );
}
