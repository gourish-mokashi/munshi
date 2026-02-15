import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { File, Paths } from "expo-file-system";

let currentPlayer: any = null;

export async function playBase64Wav(base64: string) {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
    });

    const cleanedBase64 = base64.includes(",")
      ? base64.split(",")[1]
      : base64;

    const file = new File(Paths.cache, `tts-${Date.now()}.wav`);
    file.create({ overwrite: true });

    file.write(cleanedBase64, { encoding: "base64" });

    if (currentPlayer) {
      currentPlayer.remove();
    }

    currentPlayer = createAudioPlayer({ uri: file.uri });

    currentPlayer.play();

  } catch (err) {
    console.error("Playback error:", err);
  }
}