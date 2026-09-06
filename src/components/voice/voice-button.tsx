'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function VoiceButton({
  value,
  onTranscript,
}: {
  value: string;
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);
  const baseRef = useRef(value);

  useEffect(() => {
    return () => recRef.current?.stop();
  }, []);

  const toggle = () => {
    const SR =
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec; SpeechRecognition?: new () => SpeechRec })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec }).webkitSpeechRecognition;

    if (!SR) {
      alert('Voice is not available in this browser. Use Chrome or Edge, or type the goal.');
      return;
    }

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }

    baseRef.current = value.trim();
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      let spoken = '';
      for (let i = 0; i < ev.results.length; i++) {
        spoken += ev.results[i][0]?.transcript ?? '';
      }
      const next = [baseRef.current, spoken.trim()].filter(Boolean).join(' ');
      onTranscript(next);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border ${
        listening ? 'bg-white text-black border-white anim-pulse-ring' : 'btn-ghost'
      }`}
      title="Speak your goal — it will be transcribed into the box"
    >
      {listening ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      {listening ? 'Stop' : 'Voice'}
    </button>
  );
}
