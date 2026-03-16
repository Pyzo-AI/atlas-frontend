// Assessment progress management utility
const ASSESSMENT_PROGRESS_KEY = "assessmentProgress";

export const getAssessmentProgress = (presentationId) => {
  try {
    const stored = localStorage.getItem(ASSESSMENT_PROGRESS_KEY);
    if (!stored) return null;
    
    const allProgress = JSON.parse(stored);
    return allProgress[presentationId] || null;
  } catch (error) {
    console.log("Error getting assessment progress:", error);
    return null;
  }
};

export const setAssessmentCompleted = (presentationId, assessmentId) => {
  try {
    const stored = localStorage.getItem(ASSESSMENT_PROGRESS_KEY);
    const allProgress = stored ? JSON.parse(stored) : {};
    
    if (!allProgress[presentationId]) {
      allProgress[presentationId] = {};
    }
    
    allProgress[presentationId][assessmentId] = true;
    localStorage.setItem(ASSESSMENT_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.log("Error setting assessment completed:", error);
  }
};

export const isAssessmentCompletedLocally = (presentationId, assessmentId) => {
  if (!assessmentId || !presentationId) return false;
  
  const progress = getAssessmentProgress(presentationId);
  return progress && progress[assessmentId] === true;
};

export const clearAssessmentProgress = (presentationId) => {
  try {
    const stored = localStorage.getItem(ASSESSMENT_PROGRESS_KEY);
    if (!stored) return;
    
    const allProgress = JSON.parse(stored);
    if (allProgress[presentationId]) {
      delete allProgress[presentationId];
      localStorage.setItem(ASSESSMENT_PROGRESS_KEY, JSON.stringify(allProgress));
    }
  } catch (error) {
    console.log("Error clearing assessment progress:", error);
  }
};