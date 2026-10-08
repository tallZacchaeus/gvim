import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';

/**
 * Confirmation dialogs and toasts for the admin area.
 *
 * Replaces window.confirm / window.alert, which could not be styled, read as a
 * browser error rather than part of the app, and on mobile appear detached from
 * the page. confirm() keeps the same call shape — it resolves to a boolean — so
 * pages read as `if (!(await confirm(...))) return;`.
 */

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface FeedbackApi {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  notify: (message: string, type?: 'success' | 'error') => void;
}

const Ctx = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useFeedback must be used inside <AdminFeedbackProvider>');
  return ctx;
}

export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const confirmBtn = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>(resolve => setDialog({ ...opts, resolve })),
    []
  );

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 5000 : 3000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function close(result: boolean) {
    dialog?.resolve(result);
    setDialog(null);
  }

  // Escape cancels, and focus moves into the dialog so keyboard and screen
  // reader users are not left behind on the page underneath.
  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    confirmBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [dialog]);

  return (
    <Ctx.Provider value={{ confirm, notify }}>
      {children}

      {dialog && (
        <div
          className="admin-dialog-backdrop"
          onMouseDown={e => { if (e.target === e.currentTarget) close(false); }}
        >
          <div className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title">
            <h3 id="admin-dialog-title">{dialog.title}</h3>
            {dialog.message && <p>{dialog.message}</p>}
            <div className="admin-dialog-actions">
              <button type="button" className="btn btn-outline" onClick={() => close(false)}>
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                ref={confirmBtn}
                type="button"
                className={`btn ${dialog.destructive ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => close(true)}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`admin-toast${toast.type === 'error' ? ' is-error' : ''}`} role="status" aria-live="polite">
          <i className={`fas ${toast.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />
          {toast.message}
        </div>
      )}
    </Ctx.Provider>
  );
}
