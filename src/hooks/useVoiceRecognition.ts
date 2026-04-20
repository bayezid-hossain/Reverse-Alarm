import { useState, useCallback, useEffect, useRef } from 'react';
import { SpeechRecognitionModule, SpeechEventEmitter } from '@/native/SpeechRecognitionModule';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listening = useRef(false);

  useEffect(() => {
    const subs = [
      SpeechEventEmitter.addListener('SpeechStart', () => {
        listening.current = true;
        setIsListening(true);
        setError(null);
      }),
      SpeechEventEmitter.addListener('SpeechResults', (e: { value: string[]; confidence: number[] }) => {
        const best = e.value?.[0] ?? '';
        const conf = e.confidence?.[0] ?? 0.85;
        setTranscript(best);
        setAccuracy(conf);
      }),
      SpeechEventEmitter.addListener('SpeechPartialResults', (e: { value: string[] }) => {
        if (e.value?.[0]) setTranscript(e.value[0]);
      }),
      SpeechEventEmitter.addListener('SpeechEnd', () => {
        listening.current = false;
        setIsListening(false);
      }),
      SpeechEventEmitter.addListener('SpeechError', (e: { message: string }) => {
        setError(e.message);
        listening.current = false;
        setIsListening(false);
      }),
    ];

    return () => {
      subs.forEach((s) => s.remove());
      SpeechRecognitionModule.destroy().catch(() => {});
    };
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    setError(null);
    setAccuracy(null);
    try {
      await SpeechRecognitionModule.startListening('en-US');
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await SpeechRecognitionModule.stopListening();
    } catch {}
    listening.current = false;
    setIsListening(false);
  }, []);

  return { isListening, transcript, accuracy, error, startListening, stopListening };
}
