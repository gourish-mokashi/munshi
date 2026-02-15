import {
  useAudioRecorder,
  AudioModule,
  setAudioModeAsync,
} from "expo-audio";
import { useEffect, useState } from "react";

export function useVoiceRecorder() {
  const recorder = useAudioRecorder({
    extension: ".wav",
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    android: {
      extension: ".wav",
      sampleRate: 16000,
      outputFormat: "default",
      audioEncoder: "default",
      maxFileSize: undefined,
      audioSource: "mic",  
    },
    ios: {
      extension: ".wav",
      sampleRate: 16000,
      outputFormat: "default",
      audioQuality: 0,
      bitRateStrategy: undefined,
      bitDepthHint: undefined,
      linearPCMBitDepth: undefined,
      linearPCMIsBigEndian: undefined,
      linearPCMIsFloat: undefined
    },
    web: {
      mimeType: undefined,
      bitsPerSecond: undefined
    }
  });

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      await AudioModule.requestRecordingPermissionsAsync();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, []);

  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);
  };

  const stopRecording = async (): Promise<string | null> => {
    await recorder.stop();
    setIsRecording(false);

    if (!recorder.uri) return null;

    const response = await fetch(recorder.uri);
    const blob = await response.blob();

    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  };

  return { isRecording, startRecording, stopRecording };
}
