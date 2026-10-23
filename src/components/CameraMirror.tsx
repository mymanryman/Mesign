import { useEffect, useRef, useState } from 'react';

/** Visar framkameran som en spegel så att man ser sig själv teckna. Inget spelas in eller skickas. */
export function CameraMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError('Kameran kunde inte startas. Kontrollera att appen får använda kameran.'));
    if (!navigator.mediaDevices) setError('Den här webbläsaren kan inte visa kameran.');
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) return <p className="text-sm text-slate-500">{error}</p>;
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="aspect-[4/3] w-full rounded-2xl bg-slate-200 object-cover dark:bg-slate-800"
      style={{ transform: 'scaleX(-1)' }}
      aria-label="Du själv i kameran"
    />
  );
}
