import { useEffect, useRef } from 'react';
import type { Sign } from '../lib/types';
import { useStore } from '../lib/store';

const SPEEDS = [0.5, 0.75, 1];

/**
 * Visar ett tecken. Just nu som video; avataren i fas 4 ska kunna ersätta videon här
 * utan att övningarna behöver ändras.
 */
export function SignPlayer({ sign, autoPlay = true }: { sign: Sign; autoPlay?: boolean }) {
  const { settings, updateSettings } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = settings.speed;
  }, [settings.speed, sign.id]);

  const replay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  return (
    <figure className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800 aspect-[4/3]">
        <video
          key={sign.id}
          ref={videoRef}
          className="h-full w-full object-contain"
          style={settings.mirror ? { transform: 'scaleX(-1)' } : undefined}
          src={sign.media.video}
          poster={sign.media.poster}
          autoPlay={autoPlay}
          loop={settings.loop}
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={(e) => (e.currentTarget.playbackRate = settings.speed)}
          onClick={replay}
          aria-label={`Tecken för ${sign.word}`}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <button type="button" onClick={replay} className="rounded-full bg-brand-600 px-4 py-2 font-medium text-white active:bg-brand-700">
          Spela igen
        </button>
        <div className="flex overflow-hidden rounded-full border border-slate-300 dark:border-slate-700" role="group" aria-label="Hastighet">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={settings.speed === s}
              onClick={() => updateSettings({ speed: s })}
              className={`px-3 py-2 ${settings.speed === s ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : ''}`}
            >
              {String(s).replace('.', ',')}x
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={settings.mirror}
          onClick={() => updateSettings({ mirror: !settings.mirror })}
          className={`rounded-full border px-3 py-2 ${settings.mirror ? 'border-slate-800 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900' : 'border-slate-300 dark:border-slate-700'}`}
        >
          Spegelvänd
        </button>
      </div>
    </figure>
  );
}
