/**
 * Prompts for microphone permission without holding the mic open.
 * The probe stream is stopped right away so the browser's mic indicator turns off
 * once the voice agent (LiveKit / ElevenLabs) releases its own track.
 * Throws if permission is denied, same as getUserMedia.
 */
export const requestMicrophonePermission = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
};
