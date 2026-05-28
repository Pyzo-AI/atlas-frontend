import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentVideoIndex: 0, // Video panel's current video
  pptVideoIndex: 0, // PPT section's current video (can be different)
  currentSlide: 1,
  isQuestionMode: false,
  questionPanelPptSlide: 1,
  question: "",
  isPlaying: false,
  currentPlayingAudioId: null,
  currentVideoTime: 0,
  isVideoPlaying: false,
  answerPptIndex: null,
  selectedAssessmentId: null,
  autoPlayEnabled: false,
  showChat: false,
  slideNumbers: [],
  productRecommendations: [],
  isUserMuted: true,
};

const videoSlice = createSlice({
  name: "video",
  initialState,
  reducers: {
    setCurrentVideoIndex: (state, action) => {
      state.currentVideoIndex = action.payload;
    },
    setCurrentSlide: (state, action) => {
      state.currentSlide = action.payload;
    },
    setIsQuestionMode: (state, action) => {
      state.isQuestionMode = action.payload;
    },
    setQuestionPanelPptSlide: (state, action) => {
      state.questionPanelPptSlide = action.payload;
    },
    setQuestion: (state, action) => {
      state.question = action.payload;
    },
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload.playing;
      state.currentPlayingAudioId = action.payload.audioId || null;
    },
    setCurrentVideoTime: (state, action) => {
      state.currentVideoTime = action.payload;
    },
    setIsVideoPlaying: (state, action) => {
      state.isVideoPlaying = action.payload;
    },
    setPptVideoIndex: (state, action) => {
      state.pptVideoIndex = action.payload;
    },
    setAnswerPptIndex: (state, action) => {
      state.answerPptIndex = action.payload;
    },
    setSelectedAssessmentId: (state, action) => {
      state.selectedAssessmentId = action.payload;
    },
    syncPptToVideoPanel: (state) => {
      state.pptVideoIndex = state.currentVideoIndex;
    },
    setAutoPlayEnabled: (state, action) => {
      state.autoPlayEnabled = action.payload;
    },
    setShowChat: (state, action) => {
      state.showChat = action.payload;
    },
    setSlideNumbers: (state, action) => {
      state.slideNumbers = action.payload;
    },
    setProductRecommendations: (state, action) => {
      console.log("action.payload", action.payload);
      state.productRecommendations = action.payload;
    },
    setIsUserMuted: (state, action) => {
      state.isUserMuted = action.payload;
    },
  },
});

export const {
  setCurrentVideoIndex,
  setPptVideoIndex,
  setCurrentSlide,
  setIsQuestionMode,
  setQuestionPanelPptSlide,
  setQuestion,
  setIsPlaying,
  setCurrentVideoTime,
  setIsVideoPlaying,
  setAnswerPptIndex,
  setSelectedAssessmentId,
  syncPptToVideoPanel,
  setAutoPlayEnabled,
  setShowChat,
  setSlideNumbers,
  setProductRecommendations,
  setIsUserMuted,
} = videoSlice.actions;
export default videoSlice.reducer;
