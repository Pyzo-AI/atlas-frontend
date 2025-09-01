// Updated QuestionPanel.jsx with Speech-to-Text
import React, { useState, useRef, useEffect } from "react";
import AnswerSection from "./AnswerSection";
import { useDispatch, useSelector } from "react-redux";
import {
  setQuestion,
  setQuestionPanelPptSlide,
  setAnswerPptIndex,
} from "@/store/features/videoSlice";
import { useSubmitQuestionMutation } from "@/store/api/questionsApi";
import mic from "@/assets/svg/mic.svg";
import micActive from "@/assets/svg/mic-active.svg";
import submit from "@/assets/svg/submit.svg";
import submitActive from "@/assets/svg/submit-active.svg";
import noConversation from "@/assets/svg/noConversation.svg";

const QuestionPanel = ({ onPauseVideo, videos = [] }) => {
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [startingText, setStartingText] = useState("");
  const startingTextRef = useRef("");
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const dispatch = useDispatch();
  const { question, isPlaying } = useSelector((state) => state.video);
  const [submitQuestion] = useSubmitQuestionMutation();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        setSpeechSupported(true);
        recognitionRef.current = new SpeechRecognition();

        // Configure speech recognition
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        // Handle speech recognition results
        recognitionRef.current.onresult = (event) => {
          // Get the latest result (the most recent speech)
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript;

          console.log(
            "Speech result - startingTextRef:",
            startingTextRef.current,
            "transcript:",
            transcript,
            "isFinal:",
            lastResult.isFinal
          );

          // Always combine with the starting text that was captured when speech began
          const combinedText =
            startingTextRef.current +
            (startingTextRef.current && transcript ? " " : "") +
            transcript;
          console.log("Combined text:", combinedText);
          dispatch(setQuestion(combinedText));

          // If this is a final result, update startingText for the next speech session
          if (lastResult.isFinal) {
            console.log(
              "Final result - updating startingText to:",
              combinedText
            );
            setStartingText(combinedText);
            startingTextRef.current = combinedText;
            setIsListening(false);
          }
        };

        // Handle speech recognition end
        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Don't update startingText here - it should retain the final result
        };

        // Handle speech recognition errors
        recognitionRef.current.onerror = (event) => {
          console.log("Speech recognition error:", event.error);
          setIsListening(false);

          // Show user-friendly error message
          let errorMessage = "Speech recognition failed. ";
          switch (event.error) {
            case "no-speech":
              errorMessage += "No speech was detected.";
              break;
            case "audio-capture":
              errorMessage += "No microphone was found.";
              break;
            case "not-allowed":
              errorMessage += "Microphone permission denied.";
              break;
            case "network":
              errorMessage += "Network error occurred.";
              break;
            default:
              errorMessage += "Please try again.";
          }

          // You could show this error in a toast or alert
          console.warn(errorMessage);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [dispatch]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({
        top: messagesEndRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    // Pause video when submitting question
    if (onPauseVideo) {
      onPauseVideo();
    }

    const userQuestion = question.trim();
    dispatch(setQuestion(""));
    setStartingText(""); // Reset starting text when question is submitted
    startingTextRef.current = "";
    setIsLoading(true);

    // Add user question to conversation
    setConversation((prev) => [
      ...prev,
      { type: "question", content: userQuestion },
    ]);

    try {
      const response = await submitQuestion({
        question: userQuestion,
      }).unwrap();

      // Handle primary_jump_target if present
      if (response?.primary_jump_target !== undefined) {
        // dispatch(setQuestionPanelPptSlide(response.primary_jump_target));
        dispatch(setAnswerPptIndex(response.primary_jump_target));
      }

      setConversation((prev) => [
        ...prev,
        {
          type: "answer",
          content: response?.answer || "No answer received",
          audioLink: response?.audio_url || "",
        },
      ]);
    } catch (error) {
      console.log("Error submitting question:", error);
      setConversation((prev) => [
        ...prev,
        {
          type: "error",
          content: "Failed to load answer. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      // Stop listening
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Pause video when starting speech recognition
      if (onPauseVideo) {
        onPauseVideo();
      }

      // Store the current question text as starting point for speech recognition
      console.log("Starting speech recognition. Current question:", question);
      setStartingText(question);
      startingTextRef.current = question;
      console.log("Set startingText to:", question);

      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.log("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="flex flex-col w-[100%] h-full mt-4">
      <div className="bg-white rounded-xl h-[calc(100vh-385px)] flex flex-col">
        <div
          className="flex-1 overflow-y-auto mb-4"
          style={{ minHeight: "200px" }}
        >
          {conversation.length > 0 ? (
            conversation.map((item, index) => (
              <div key={index} className="mb-4">
                {item.type === "question" && (
                  <div className="mb-2 p-3 bg-blue-100 rounded-lg">
                    <p className="font-medium text-blue-800">Question:</p>
                    <p>{item.content}</p>
                  </div>
                )}
                {item.type === "answer" && (
                  <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                    {/* {item.jumpTarget && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center text-sm text-blue-700">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Jumped to Video {item.jumpTarget} (end section)
                        </div>
                      </div>
                    )} */}
                    <AnswerSection
                      answer={item.content}
                      audioLink={item.audioLink}
                      onPauseVideo={onPauseVideo}
                    />
                  </div>
                )}
                {item.type === "error" && (
                  <div className="text-red-500 p-2 bg-red-50 rounded">
                    {item.content}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <img className="w-12 h-12" src={noConversation.src} alt="" />
              <p className="font-lato font-bold text-base leading-none tracking-[0.02em] text-center align-middle text-gray-500 mt-3">
                Ask Anything
              </p>
              <p className="text-gray-500 mt-1 w-[276px] text-center text-[12px] leading-[16px] font-normal font-lato">
                our presentation is ready. Just type a question to get quick,
                accurate answers.
              </p>
            </div>
          )}
          {isLoading && (
            <div className="animate-pulse p-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-auto">
          {/* Question Input Section */}
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => {
                const newValue = e.target.value;
                dispatch(setQuestion(newValue));
                // Update startingText only when not listening (manual typing)
                if (!isListening) {
                  setStartingText(newValue);
                  startingTextRef.current = newValue;
                }
              }}
              className="w-full px-4 py-3 pr-20 text-gray-700 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[52px] max-h-32"
              placeholder={isListening ? "Listening..." : "Ask Trainboost..."}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isPlaying && question.trim()) {
                    handleSubmit();
                  }
                } else if (e.key === "Enter" && e.shiftKey) {
                  // Allow new line with Shift+Enter
                }
              }}
              // onInput={(e) => {
              //   // Auto-resize textarea
              //   e.target.style.height = "auto";
              //   e.target.style.height =
              //     Math.min(e.target.scrollHeight, 128) + "px";
              // }}
              disabled={isListening}
            />

            {/* Speech Recognition Button */}
            {speechSupported && (
              <button
                onClick={toggleSpeechRecognition}
                disabled={isLoading || isPlaying}
                className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${
                  isLoading || isPlaying || isListening
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? (
                  <img
                    src={micActive.src}
                    alt="Mic Active"
                    className="w-[30px] h-[30px]"
                  />
                ) : (
                  <img src={mic.src} alt="Mic" className="w-[30px] h-[30px]" />
                )}
              </button>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || isLoading || isPlaying}
              className={`absolute right-2 top-12 p-2 rounded-full transition-colors ${
                !question.trim() || isLoading || isPlaying
                  ? "cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              title="Submit question"
            >
              {isLoading || isPlaying || question.trim() === "" ? (
                <img
                  src={submit.src}
                  alt="Submit Active"
                  className="w-[30px] h-[30px]"
                />
              ) : (
                <img
                  src={submitActive.src}
                  alt="Submit"
                  className="w-[30px] h-[30px]"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPanel;
