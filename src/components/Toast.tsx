import { useCallback, useEffect, useRef, useState } from "react";

/** One short message at a time, announced to screen readers. */
export function useToast() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const notify = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage({ text, id: Date.now() });
    timer.current = window.setTimeout(() => setMessage(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toast = (
    <div className="toast-region" aria-live="polite" role="status">
      {message && (
        <div className="toast" key={message.id}>
          {message.text}
        </div>
      )}
    </div>
  );

  return { notify, toast };
}
