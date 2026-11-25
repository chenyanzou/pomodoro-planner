import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Bell, Download, RotateCcw, Trash2, Upload, Volume2, X } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import type { ThemeMode } from '../../types';
import { playCompletionChime } from '../../utils/audioEngine';
import { createBackupPayload, parseAndValidateBackup } from '../../utils/backup';
import { toLocalDateKey } from '../../utils/date';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    state,
    updateSettings,
    replaceAllData,
    resetToSampleData,
    clearAllData,
    showToast,
  } = useAppData();

  const { settings } = state;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="paper-card animate-fade-up max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5">
          <h3 id="settings-modal-title" className="text-base font-semibold">
            番茄钟设置与数据备份
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭设置弹窗"
            className="focus-ring rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6 text-sm">
          {/* Timer Durations */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              计时时长（分钟）
            </h4>
            <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  { key: 'focusMinutes', label: '专注', min: 1, max: 120 },
                  { key: 'shortBreakMinutes', label: '短休', min: 1, max: 60 },
                  { key: 'longBreakMinutes', label: '长休', min: 1, max: 90 },
                  { key: 'longBreakInterval', label: '长休间隔(轮)', min: 2, max: 8 },
                ] as const
              ).map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs text-[var(--text-secondary)]">
                    {field.label}
                  </span>
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={settings[field.key]}
                    onChange={(e) =>
                      updateSettings({
                        [field.key]: Number(e.target.value) || field.min,
                      })
                    }
                    className="focus-ring tabular-nums w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--text-secondary)]">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartBreak}
                  onChange={(e) => updateSettings({ autoStartBreak: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent-focus)]"
                />
                专注结束自动开始休息
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.autoStartFocus}
                  onChange={(e) => updateSettings({ autoStartFocus: e.target.checked })}
                  className="h-4 w-4 accent-[var(--accent-focus)]"
                />
                休息结束自动进入专注
              </label>
            </div>
          </div>

          {/* Sound & Notification */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              提示音、桌面通知与外观
            </h4>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="h-4 w-4 accent-[var(--accent-focus)]"
                  />
                  结束提示音（Web Audio 纯合成，免外链）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={settings.soundVolume}
                    onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                    aria-label="提示音音量"
                    className="w-24 accent-[var(--accent-focus)]"
                  />
                  <button
                    type="button"
                    onClick={() => playCompletionChime(settings.soundVolume)}
                    className="focus-ring inline-flex items-center gap-1 rounded-xl bg-[var(--bg-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <Volume2 className="h-3.5 w-3.5" /> 试听
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
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {settings.notificationsEnabled ? '已开启' : '点击授权开启'}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-primary)]">界面主题模式</span>
                <div className="inline-flex rounded-xl bg-[var(--bg-subtle)] p-0.5 text-xs">
                  {(
                    [
                      { value: 'light', label: '暖纸浅色' },
                      { value: 'dark', label: '暖炭深色' },
                      { value: 'system', label: '跟随系统' },
                    ] as Array<{ value: ThemeMode; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateSettings({ theme: opt.value })}
                      className={`focus-ring rounded-lg px-2.5 py-1 font-medium transition ${
                        settings.theme === opt.value
                          ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-2xs'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Local Data Backup */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              本地数据备份与管理
            </h4>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              所有任务、目标与专注记录均保存在当前浏览器本地，支持随时导出 JSON 备份迁移。
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--accent-focus)]" />
                导出 JSON 备份
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-[var(--bg-subtle)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
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
                  resetToSampleData();
                  onClose();
                }}
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                恢复演示数据
              </button>
            </div>

            {importError && (
              <p className="mt-2.5 rounded-xl bg-[var(--accent-focus-soft)] px-3 py-2 text-xs text-[var(--accent-focus)]">
                {importError}
              </p>
            )}

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5">
              <span className="text-xs text-[var(--text-secondary)]">危险操作：清空本地全部数据</span>
              {confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-lg px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
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
                    className="rounded-lg bg-[var(--accent-focus)] px-3 py-1 text-xs font-medium text-white"
                  >
                    确认清空
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="focus-ring inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus-soft)]"
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
