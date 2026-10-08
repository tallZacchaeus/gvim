import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

/**
 * Confirmation dialogs and toasts for the admin area.
 *
 * The call shape is unchanged from the hand-rolled version — confirm() still
 * resolves to a boolean — so pages keep reading as:
 *   if (!(await confirm({...}))) return;
 *
 * What changed is the implementation: Radix AlertDialog brings focus trapping,
 * focus restoration, Escape handling, scroll locking and correct ARIA roles,
 * all of which the previous version maintained by hand. Toasts move to Sonner.
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

/**
 * NOTE ON PLACEMENT — this provider lives in ProtectedRoute, ABOVE the page
 * components. It must stay there. When it was inside AdminLayout, pages called
 * useFeedback() and then returned <AdminLayout>, making the provider a child of
 * its own consumer; four admin pages crashed to a blank screen as a result.
 */
export function AdminFeedbackProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] =
    useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>(resolve => setDialog({ ...opts, resolve })),
    []
  );

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') toast.error(message);
    else toast.success(message);
  }, []);

  function close(result: boolean) {
    dialog?.resolve(result);
    setDialog(null);
  }

  return (
    <Ctx.Provider value={{ confirm, notify }}>
      {children}

      <AlertDialog
        open={dialog !== null}
        // Covers Escape and outside-click alike: either is a cancel.
        onOpenChange={open => { if (!open) close(false); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog?.title}</AlertDialogTitle>
            {dialog?.message && (
              <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>
              {dialog?.cancelLabel || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              className={dialog?.destructive
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : undefined}
            >
              {dialog?.confirmLabel || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Ctx.Provider>
  );
}
