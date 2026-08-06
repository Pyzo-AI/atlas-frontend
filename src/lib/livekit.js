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
    this.onDataReceived = null;
    this.isAgentSpeaking = false;
    this.agentState = "idle"; // 'idle', 'listening', 'thinking', 'speaking'
    this.lastSpeaker = null; // 'agent' | 'user' | null
    this.onAgentStateChanged = null;
    this.idleTimeout = null;
    this.onSlideMetadataReceived = null;
    this.isAgentMuted = false; // Agent voice is ON by default
    this.agentAudioElements = []; // Track all agent audio elements
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
      console.log("Failed to connect to LiveKit:", error);
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
        // Apply current mute state to the new audio element
        audioElement.muted = this.isAgentMuted;
        audioElement.onended = () => {
          this.isAgentSpeaking = false;
          this.updateConnectionState({ isAudioPlaying: false });
          // Remove from tracked elements
          this.agentAudioElements = this.agentAudioElements.filter((el) => el !== audioElement);
        };
        audioElement.onpause = () => {
          this.isAgentSpeaking = false;
          this.updateConnectionState({ isAudioPlaying: false });
        };
        // Track the audio element
        this.agentAudioElements.push(audioElement);
        document.body.appendChild(audioElement);
      }
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === "audio") {
        this.isAgentSpeaking = false;
        this.updateConnectionState({ isAudioPlaying: false });
        const detached = track.detach();
        detached.forEach((element) => {
          this.agentAudioElements = this.agentAudioElements.filter((el) => el !== element);
          element.remove();
        });
      }
    });

    this.room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      this.handleActiveSpeakersChanged(speakers);
    });

    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      this.onDataReceived?.(payload, participant);

      // Handle data messages (PPT slide metadata)
      try {
        const jsonString = new TextDecoder().decode(payload);
        const data = JSON.parse(jsonString);

        console.log("product_image:", data);

        if (data.type === "agent_state" && data.state) {
          // Don't let a late "listening" packet override "thinking"
          if (!(data.state === "listening" && this.agentState === "thinking")) {
            this.agentState = data.state;
            this.onAgentStateChanged?.(data.state);
          }
          return;
        }

        if (data.type === "slide_redirect" && data.slide_number) {
          const slideNumbers = Array.isArray(data.slide_number) ? data.slide_number : [data.slide_number];
          console.log("🎯 Slide redirect:", slideNumbers);
          this.onSlideMetadataReceived?.(data, slideNumbers, null);
        } else if (data.type === "product_recommendations" && data.recommendations) {
          console.log("🛍️ Product recommendations received:", data.recommendations);
          this.onSlideMetadataReceived?.(data, [], data.recommendations);
        } else if (data.slide_number) {
          const slideNumbers = Array.isArray(data.slide_number) ? data.slide_number : [data.slide_number];
          console.log("🎯 Referenced slides:", slideNumbers);
          this.onSlideMetadataReceived?.(data.data, slideNumbers, null);
        }
      } catch (error) {
        console.log("Failed to parse data message:", error);
      }
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
      console.log("Error disconnecting:", error);
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

    let newState = "speaking";

    if (isAgentSpeaking) {
      newState = "speaking";
      this.lastSpeaker = "agent";
    } else if (isUserSpeaking) {
      newState = "listening";
      this.lastSpeaker = "user";
    } else {
      // Silence - determine if thinking or idle
      if (this.lastSpeaker === "user") {
        newState = "thinking";
      } else {
        clearTimeout(this.idleTimeout);
        this.idleTimeout = setTimeout(() => {
          // After 1 second of silence, go to idle
          this.agentState = "listening";
          this.onAgentStateChanged?.("listening");
        }, 1000);
        return;
      }
    }

    clearTimeout(this.idleTimeout);
    if (this.agentState !== newState) {
      this.agentState = newState;
      this.onAgentStateChanged?.(newState);
    }
  }

  getAgentState() {
    return this.agentState;
  }

  /**
   * Mute the agent's voice output. Audio tracks stay subscribed but are silenced.
   * Text responses still arrive normally via data channel.
   */
  muteAgentVoice() {
    this.isAgentMuted = true;
    this.agentAudioElements.forEach((el) => {
      el.muted = true;
    });
  }

  /**
   * Unmute the agent's voice output so the user hears the AI speak.
   */
  unmuteAgentVoice() {
    this.isAgentMuted = false;
    this.agentAudioElements.forEach((el) => {
      el.muted = false;
    });
  }

  /**
   * Check whether agent voice output is currently muted.
   */
  isAgentVoiceMuted() {
    return this.isAgentMuted;
  }

  setOnAgentStateChanged(callback) {
    this.onAgentStateChanged = callback;
  }

  setOnDataReceived(callback) {
    this.onDataReceived = callback;
  }

  setOnSlideMetadataReceived(callback) {
    this.onSlideMetadataReceived = callback;
  }
}

export const liveKitService = new LiveKitService();
