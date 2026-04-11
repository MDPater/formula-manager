import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteBrowserSave,
  listBrowserSaves,
  readJsonFile,
} from '../../lib/persistence';
import { parseCustomDatabaseFile } from '../../lib/validators';
import { useGameStore } from '../../store/gameStore';
import type { SaveMeta } from '../season/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function StartScreen() {
  const navigate = useNavigate();
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const loadCareer = useGameStore((state) => state.loadCareer);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  function refreshSaves() {
    setSaves(listBrowserSaves());
  }

  useEffect(() => {
    refreshSaves();
  }, []);

  async function handleImportDatabase(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const raw = await readJsonFile(file);
      parseCustomDatabaseFile(raw);

      navigate('/career/setup');
      setImportStatus('Imported database validated. Complete setup to begin.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import database.';
      setImportStatus(message);
      window.alert(message);
    } finally {
      event.target.value = '';
    }
  }

  function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this save file?');
    if (!confirmed) return;

    deleteBrowserSave(id);
    refreshSaves();
  }

  function handleDownloadTemplate() {
    const anchor = document.createElement('a');
    anchor.href = '/example.json';
    anchor.download = 'database-template.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-10 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-red-500/10 to-transparent p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-8">
            <div className="text-[11px] uppercase tracking-[0.35em] text-red-400">
              Career Hub
            </div>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
              Formula Manager
            </h1>
            <p className="mt-4 max-w-xl text-sm text-zinc-400 md:text-base">
              Start a new career, continue a save, import your own custom team and driver database,
              or download a template to edit.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  Saves
                </div>
                <div className="mt-2 text-3xl font-bold text-white">{saves.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  Storage
                </div>
                <div className="mt-2 text-3xl font-bold text-white">Browser</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                  Import
                </div>
                <div className="mt-2 text-3xl font-bold text-white">JSON</div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                className="rounded-2xl border border-red-500/30 bg-red-500 px-5 py-3 font-semibold text-white transition hover:opacity-90"
                onClick={() => navigate('/career/setup')}
              >
                Start New Career
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
                  onClick={() => importInputRef.current?.click()}
                >
                  Import Custom Database
                </button>

                <button
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/10"
                  onClick={handleDownloadTemplate}
                >
                  Download JSON Database Template
                </button>
              </div>
            </div>

            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportDatabase}
            />

            {importStatus ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                {importStatus}
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-6">
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
                Local Saves
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">Continue Career</h2>
            </div>

            {saves.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-zinc-400">
                No saves found yet. Start a new career to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.07]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <button
                        className="flex-1 text-left"
                        onClick={() => loadCareer(save.id)}
                      >
                        <div className="text-lg font-semibold text-white">{save.saveName}</div>
                        <div className="mt-1 text-sm text-zinc-400">
                          Last played: {formatDate(save.updatedAt)}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-4">
                          <div className="rounded-xl bg-black/30 px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                              Season
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {save.seasonNumber}
                            </div>
                          </div>
                          <div className="rounded-xl bg-black/30 px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                              Team
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {save.teamName}
                            </div>
                          </div>
                          <div className="rounded-xl bg-black/30 px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                              Points
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {save.teamPoints}
                            </div>
                          </div>
                          <div className="rounded-xl bg-black/30 px-3 py-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                              Budget
                            </div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              ${save.budget.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </button>

                      <button
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/10"
                        onClick={() => handleDelete(save.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}