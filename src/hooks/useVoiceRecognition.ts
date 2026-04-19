import { useState, useCallback, useEffect } from 'react';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

export function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      const result = e.value?.[0] ?? '';
      setTranscript(result);
      // Confidence approximated from number of results matched
      const conf = e.value && e.value.length > 0 ? 0.85 : 0.5;
      setAccuracy(conf);
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      setError(e.error?.message ?? 'Speech error');
      setIsListening(false);
    };
    Voice.onSpeechEnd = () => setIsListening(false);

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = useCallback(async () => {
    setTranscript('');
    setError(null);
    setAccuracy(null);
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
    } catch {}
    setIsListening(false);
  }, []);

  return { isListening, transcript, accuracy, error, startListening, stopListening };
}
