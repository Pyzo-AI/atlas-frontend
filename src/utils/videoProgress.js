// Video progress tracking utility
const VIDEO_PROGRESS_KEY = 'video_progress';

export const updateVideoProgress = (presentationId, slideId, durationSeconds) => {
  try {
    const stored = localStorage.getItem(VIDEO_PROGRESS_KEY);
    let progressData = stored ? JSON.parse(stored) : {};
    
    // Find or create presentation entry
    let presentation = progressData[presentationId];
    if (!presentation) {
      presentation = {
        presentation_id: presentationId,
        slide_data: []
      };
      progressData[presentationId] = presentation;
    }
    
    // Find existing entry for this slide or create new one
    let slideEntry = presentation.slide_data.find(entry => 
      entry.slide_id === slideId && 
      Date.now() - entry.timestamp < 60000 // Within last minute
    );
    
    if (!slideEntry) {
      slideEntry = {
        slide_id: slideId,
        duration_seconds: 0,
        timestamp: Date.now()
      };
      presentation.slide_data.push(slideEntry);
    }
    
    // Update duration only if new value is higher
    slideEntry.duration_seconds = Math.max(slideEntry.duration_seconds, durationSeconds);
    
    localStorage.setItem(VIDEO_PROGRESS_KEY, JSON.stringify(progressData));
  } catch (error) {
    console.error('Error updating video progress:', error);
  }
};

export const startVideoSession = (presentationId, slideId) => {
  try {
    const stored = localStorage.getItem(VIDEO_PROGRESS_KEY);
    let progressData = stored ? JSON.parse(stored) : {};
    
    let presentation = progressData[presentationId];
    if (!presentation) {
      presentation = {
        presentation_id: presentationId,
        slide_data: []
      };
      progressData[presentationId] = presentation;
    }
    
    // Add new session entry
    presentation.slide_data.push({
      slide_id: slideId,
      duration_seconds: 0,
      timestamp: Date.now()
    });
    
    localStorage.setItem(VIDEO_PROGRESS_KEY, JSON.stringify(progressData));
  } catch (error) {
    console.error('Error starting video session:', error);
  }
};

export const saveVideoProgress = (presentationId, slideId, durationSeconds) => {
  updateVideoProgress(presentationId, slideId, durationSeconds);
};

export const getVideoProgress = (presentationId) => {
  try {
    const stored = localStorage.getItem(VIDEO_PROGRESS_KEY);
    if (!stored) return null;
    
    const progressData = JSON.parse(stored);
    return progressData[presentationId] || null;
  } catch (error) {
    console.error('Error getting video progress:', error);
    return null;
  }
};

export const clearVideoProgress = (presentationId) => {
  try {
    const stored = localStorage.getItem(VIDEO_PROGRESS_KEY);
    if (!stored) return;
    
    const progressData = JSON.parse(stored);
    delete progressData[presentationId];
    
    if (Object.keys(progressData).length === 0) {
      localStorage.removeItem(VIDEO_PROGRESS_KEY);
    } else {
      localStorage.setItem(VIDEO_PROGRESS_KEY, JSON.stringify(progressData));
    }
  } catch (error) {
    console.error('Error clearing video progress:', error);
  }
};