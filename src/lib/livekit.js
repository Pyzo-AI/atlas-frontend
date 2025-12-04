import { Room, RoomEvent, RemoteParticipant, LocalParticipant, RemoteAudioTrack } from "livekit-client";

export class LiveKitService {
  constructor() {
    this.room = null;
    this.localParticipant = null;
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      isAudioPlaying: false,
      error: null,
    };
    this.onConnectionStateChanged = null;
    this.onMessage = null;
    this.isAgentSpeaking = false;
    this.agentState = "idle"; // 'idle', 'listening', 'thinking', 'speaking'
    this.lastSpeaker = null; // 'agent' | 'user' | null
    this.onAgentStateChanged = null;
  }

  async connect(config) {
    try {
      this.updateConnectionState({ isConnecting: true, error: null });

      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.setupEventListeners();
      await this.room.connect(config.url, config.token, { autoSubscribe: true });
      this.localParticipant = this.room.localParticipant;
      await this.enableMicrophone();

      this.updateConnectionState({ isConnected: true, isConnecting: false, isAudioPlaying: false, error: null });
      console.log("Connected to LiveKit room");
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        error: error.message,
      });
      throw error;
    }
  }

  setupEventListeners() {
    if (!this.room) return;

    this.room.on(RoomEvent.Connected, () => {
      this.updateConnectionState({ isConnected: true, isConnecting: false, isAudioPlaying: false, error: null });
    });

    this.room.on(RoomEvent.Disconnected, (reason) => {
      // Only treat unexpected disconnections as errors
      const isExpectedDisconnect = !reason || reason === 1; // 1 = normal disconnect
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        isAudioPlaying: false,
        error: isExpectedDisconnect ? null : `Unexpected disconnection: ${reason}`,
      });
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === "audio" && participant.identity.startsWith("agent-")) {
        console.log("Agent audio track subscribed");
        this.isAgentSpeaking = true;
        this.updateConnectionState({ isAudioPlaying: true });
        const audioElement = track.attach();
        audioElement.autoplay = true;
        audioElement.onended = () => {
          this.isAgentSpeaking = false;
          this.updateConnectionState({ isAudioPlaying: false });
        };
        audioElement.onpause = () => {
          this.isAgentSpeaking = false;
          this.updateConnectionState({ isAudioPlaying: false });
        };
        document.body.appendChild(audioElement);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === "audio") {
        this.isAgentSpeaking = false;
        this.updateConnectionState({ isAudioPlaying: false });
        track.detach().forEach((element) => element.remove());
      }
    });

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      this.handleActiveSpeakersChanged(speakers);
    });
  }

  updateConnectionState(updates) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.onConnectionStateChanged?.(this.connectionState);
  }

  async enableMicrophone() {
    if (!this.room || !this.localParticipant) throw new Error("Room not connected");
    await this.localParticipant.setMicrophoneEnabled(true);
  }

  async disableMicrophone() {
    if (!this.room || !this.localParticipant) throw new Error("Room not connected");
    await this.localParticipant.setMicrophoneEnabled(false);
  }

  async disconnect() {
    try {
      if (this.room) {
        if (this.localParticipant) {
          await this.localParticipant.setMicrophoneEnabled(false);
        }
        await this.room.disconnect();
        this.room = null;
        this.localParticipant = null;
      }
      this.updateConnectionState({ isConnected: false, isConnecting: false, isAudioPlaying: false, error: null });
    } catch (error) {
      console.error("Error disconnecting:", error);
      this.room = null;
      this.localParticipant = null;
      this.updateConnectionState({ isConnected: false, isConnecting: false, isAudioPlaying: false, error: null });
    }
  }

  isSpeaking() {
    return this.isAgentSpeaking;
  }

  isConnected() {
    return this.connectionState.isConnected;
  }

  isConnecting() {
    return this.connectionState.isConnecting;
  }

  isMicrophoneEnabled() {
    return this.localParticipant?.isMicrophoneEnabled ?? false;
  }

  handleActiveSpeakersChanged(speakers) {
    if (!this.localParticipant) return;

    const isAgentSpeaking = speakers.some((p) => p.identity.startsWith("agent-"));
    const isUserSpeaking = speakers.some((p) => p.identity === this.localParticipant.identity);

    let newState = "idle";

    if (isAgentSpeaking) {
      newState = "speaking";
      this.lastSpeaker = "agent";
    } else if (isUserSpeaking) {
      newState = "listening";
      this.lastSpeaker = "user";
    } else {
      // Silence - determine if thinking or idle
      newState = this.lastSpeaker === "user" ? "thinking" : "idle";
    }

    if (this.agentState !== newState) {
      this.agentState = newState;
      this.onAgentStateChanged?.(newState);
    }
  }

  getAgentState() {
    return this.agentState;
  }

  setOnAgentStateChanged(callback) {
    this.onAgentStateChanged = callback;
  }
}

export const liveKitService = new LiveKitService();
