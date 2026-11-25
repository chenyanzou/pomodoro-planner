import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Bell, Download, Sparkles, Trash2, Upload, Volume2, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import type { ThemeMode } from '../../types';
import { playCompletionChime } from '../../utils/audioEngine';
import { createBackupPayload, parseAndValidateBackup } from '../../utils/backup';
import { toLocalDateKey } from '../../utils/date';
import { SegmentedControl } from '../ui/SegmentedControl';

interface SettingsModalProps {
  onClose: () => void;
}

const TIMER_FIELDS = [
  { key: 'focusMinutes', label: '专注 (分)', min: 1, max: 120 },
  { key: 'shortBreakMinutes', label: '短休 (分)', min: 1, max: 60 },
  { key: 'longBreakMinutes', label: '长休 (分)', min: 1, max: 90 },
  { key: 'longBreakInterval', label: '长休间隔', min: 2, max: 8 },
] as const;

type TimerFieldKey = (typeof TIMER_FIELDS)[number]['key'];

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    state,
    isDemoMode,
    toggleDemoMode,
    updateSettings,
    replaceAllData,
    clearAllData,
    showToast,
  } = useAppData();

  const { settings } = state;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const [drafts, setDrafts] = useState<Record<TimerFieldKey, string>>({
    focusMinutes: String(settings.focusMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
    longBreakInterval: String(settings.longBreakInterval),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const commitField = (key: TimerFieldKey, min: number, max: number) => {
    const num = Math.max(min, Math.min(max, Math.round(Number(drafts[key])) || min));
    setDrafts((prev) => ({ ...prev, [key]: String(num) }));
    updateSettings({ [key]: num });
  };

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('当前浏览器不支持桌面通知');
      return;
    }
    if (settings.notificationsEnabled) {
      updateSettings({ notificationsEnabled: false });
      return;
    }
    const perm =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm === 'granted') {
      updateSettings({ notificationsEnabled: true });
      showToast('已开启浏览器桌面通知');
    } else {
      showToast('未获得桌面通知权限，可在浏览器地址栏左侧重新开启');
    }
  };

  const handleExport = () => {
    const json = createBackupPayload(state);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pomodoro-planner-backup-${toLocalDateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON 备份文件已导出');
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseAndValidateBackup(text);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      replaceAllData(result.state);
      showToast(
        `导入成功：${result.summary.goals} 个目标、${result.summary.tasks} 项任务、${result.summary.sessions} 条专注记录`,
      );
      onClose();
    } catch {
      setImportError('读取备份文件失败，请重试。');
    }
  };

  const volPct = Math.round(((settings.soundVolume - 0.1) / 0.9) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-scale-in max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-[26px] p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <div>
            <p className="font-serif-italic text-xs text-[var(--text-muted)]">Preferences &amp; Backup</p>
            <h3 id="settings-modal-title" className="text-base font-semibold">
              番茄钟设置与数据备份
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭设置弹窗" className="focus-ring icon-btn h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Timer Durations */}
          <div>
            <h4 className="eyebrow">计时节奏</h4>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TIMER_FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs text-[var(--text-secondary)]">{field.label}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={drafts[field.key]}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [field.key]: e.target.value.replace(/[^\d]/g, '').slice(0, 3),
                      }))
                    }
                    onBlur={() => commitField(field.key, field.min, field.max)}
                    className="field num-display w-full rounded-xl px-3 py-2 text-center text-sm font-semibold !tracking-normal"
                  />
                </label>
              ))}
            </div>

            <div className="mt-3.5 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreak}
                  onChange={(e) => updateSettings({ autoStartBreak: e.target.checked })}
                  className="h-4 w-4 rounded accent-[var(--accent-focus)]"
                />
                专注结束自动开始休息
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  onChange={(e) => updateSettings({ autoStartFocus: e.target.checked })}
                  className="h-4 w-4 rounded accent-[var(--accent-focus)]"
                />
                休息结束自动进入专注
              </label>
            </div>
          </div>

          {/* Sound & Notification */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <h4 className="eyebrow">声音、提醒与外观</h4>
            <div className="mt-3 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--accent-focus)]"
                  />
                  结束提示音（Web Audio 纯合成，免外链）
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={settings.soundVolume}
                    onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                    aria-label="提示音音量"
                    className="range w-24"
                    style={{ ['--range-pct' as string]: `${volPct}%` }}
                  />
                  <button
                    type="button"
                    onClick={() => playCompletionChime(settings.soundVolume)}
                    className="focus-ring btn-soft h-7 px-2.5 text-xs"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-[var(--accent-focus)]" /> 试听
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs text-[var(--text-primary)]">
                  <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
                  浏览器桌面提醒
                </span>
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className={`focus-ring rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    settings.notificationsEnabled
                      ? 'bg-[var(--accent-break-soft)] text-[var(--accent-break)]'
                      : 'btn-soft h-8 px-3'
                  }`}
                >
                  {settings.notificationsEnabled ? '已开启' : '点击授权开启'}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-primary)]">界面主题模式</span>
                <SegmentedControl
                  ariaLabel="界面主题模式"
                  value={settings.theme}
                  onChange={(v) => updateSettings({ theme: v as ThemeMode })}
                  options={[
                    { value: 'light', label: '暖纸浅色' },
                    { value: 'dark', label: '暗夜书房' },
                    { value: 'system', label: '跟随系统' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Local Data Backup */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <h4 className="eyebrow">本地数据备份与管理</h4>
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              所有任务、目标与专注记录均保存在当前浏览器本地，支持随时导出 JSON 备份迁移。
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={handleExport} className="focus-ring btn-soft h-9 px-3.5 text-xs">
                <Download className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
                导出 JSON 备份
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="focus-ring btn-soft h-9 px-3.5 text-xs"
              >
                <Upload className="h-3.5 w-3.5 text-[var(--accent-break)]" />
                导入恢复备份
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  toggleDemoMode();
                  onClose();
                }}
                className="focus-ring btn-soft h-9 px-3.5 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
                {isDemoMode ? '退出演示模式' : '进入演示模式'}
              </button>
            </div>

            {importError && (
              <p className="mt-2.5 rounded-xl bg-[var(--accent-focus-soft)] px-3 py-2 text-xs text-[var(--accent-focus)]">
                {importError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--bg-subtle)_45%,var(--bg-surface))] px-3.5 py-2.5">
              <span className="text-xs text-[var(--text-secondary)]">危险操作：清空本地全部数据</span>
              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="focus-ring btn-soft h-7 px-2.5 text-xs"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAllData();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="focus-ring rounded-lg bg-[var(--accent-focus)] px-3 py-1 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-focus-hover)]"
                  >
                    确认清空
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="focus-ring inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)] transition hover:bg-[var(--accent-focus-soft)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  清空全部
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
