"use client";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setQuestion, setAnswerPptIndex } from "@/store/features/videoSlice";
import { useSubmitQuestionMutation } from "@/store/api/questionsApi";
import AnswerSection from "@/components/sections/AnswerSection";

// Custom SVG Icons
const MessageCircleIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CloseIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinusIcon = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MicIcon = ({ size = 24, className = "", isActive = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path
      d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z"
      fill={isActive ? "currentColor" : "none"}
    />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SendIcon = ({ size = 24, className = "", isActive = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon
      points="22,2 15,22 11,13 2,9"
      fill={isActive ? "currentColor" : "none"}
    />
  </svg>
);

const FloatingChatbot = ({ onPauseVideo, videos = [], presentationId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [startingText, setStartingText] = useState("");
  const startingTextRef = useRef("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const recognitionRef = useRef(null);
  const lastAnswerRef = useRef(null);
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

        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event) => {
          const lastResult = event.results[event.results.length - 1];
          const transcript = lastResult[0].transcript;

          const combinedText =
            startingTextRef.current +
            (startingTextRef.current && transcript ? " " : "") +
            transcript;
          dispatch(setQuestion(combinedText));

          if (lastResult.isFinal) {
            setStartingText(combinedText);
            startingTextRef.current = combinedText;
            setIsListening(false);
          }
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.log("Speech recognition error:", event.error);
          setIsListening(false);

          // Handle specific error cases
          if (event.error === "aborted") {
            // Recognition was aborted, this is normal
            return;
          }

          if (event.error === "not-allowed") {
            alert(
              "Microphone access denied. Please allow microphone access and try again."
            );
          }
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
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesEndRef.current.offsetTop,
        behavior: "smooth",
      });
    }
  };

  const scrollToLatestAnswer = () => {
    if (lastAnswerRef.current && messagesContainerRef.current) {
      // Scroll to show the top of the latest answer message
      const answerElement = lastAnswerRef.current;
      const container = messagesContainerRef.current;

      // Calculate the position to scroll to show the answer at the top
      const containerRect = container.getBoundingClientRect();
      const answerRect = answerElement.getBoundingClientRect();
      const scrollTop =
        container.scrollTop + (answerRect.top - containerRect.top) - 20; // 20px padding from top

      container.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];

      // If the last message is an answer, scroll to show it at the top
      if (lastMessage.type === "answer") {
        // Use setTimeout to ensure the DOM is updated
        setTimeout(() => {
          scrollToLatestAnswer();
        }, 100);
      } else {
        // For questions and other messages, scroll to bottom as usual
        scrollToBottom();
      }
    }
  }, [conversation]);

  // Auto-scroll to bottom when chat is opened
  useEffect(() => {
    if (isOpen && conversation.length > 0) {
      // Use setTimeout to ensure the DOM is rendered before scrolling
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    // Stop speech recognition if it's currently listening
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (error) {
        console.log("Error stopping speech recognition on submit:", error);
        setIsListening(false);
      }
    }

    if (onPauseVideo) {
      onPauseVideo();
    }

    const userQuestion = question.trim();
    dispatch(setQuestion(""));
    setStartingText("");
    startingTextRef.current = "";
    setIsLoading(true);

    setConversation((prev) => [
      ...prev,
      { type: "question", content: userQuestion },
    ]);

    // Map conversation for API - convert internal format to API format and get latest 5
    const mappedConversation = conversation
      .slice(-10) // Get only the latest 10 conversations
      .map((item) => ({
        type: item.type === "question" ? "user" : "AI",
        content: item.content,
      }));

    try {
      const response = await fetch(`https://cf.be.trainboost.esmagico.com/api/qa/${presentationId}?stream_audio=true`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          conversation: mappedConversation,
          knowledge_source_ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        }),
      });

      if (response.ok) {
        // Get answer text from response header
        const answerText = response.headers.get('x-answer') || 'No answer received';
            console.log([...response.headers.entries()], "test");      
        // Get primary jump target if available
        const jumpTarget = response.headers.get('x-jump-target');
        if (jumpTarget !== null && jumpTarget !== undefined) {
          dispatch(setAnswerPptIndex(parseInt(jumpTarget)));
        }

        // Create audio blob from response stream
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        setConversation((prev) => [
          ...prev,
          {
            type: "answer",
            content: answerText,
            audioLink: audioUrl,
          },
        ]);
      } else {
        throw new Error('Failed to get response');
      }
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
    if (!speechSupported || !recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Error stopping speech recognition:", error);
      }
      setIsListening(false);
    } else {
      if (onPauseVideo) {
        onPauseVideo();
      }

      setStartingText(question);
      startingTextRef.current = question;

      try {
        // Ensure recognition is not already running
        if (recognitionRef.current.state === "listening") {
          recognitionRef.current.stop();
          // Wait a bit before starting again
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (error) {
              console.log(
                "Error starting speech recognition after stop:",
                error
              );
              setIsListening(false);
            }
          }, 100);
        } else {
          recognitionRef.current.start();
          setIsListening(true);
        }
      } catch (error) {
        console.log("Error starting speech recognition:", error);
        setIsListening(false);

        // If it fails because it's already started, try to stop and restart
        if (error.message && error.message.includes("already started")) {
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch (retryError) {
                console.log("Error on retry:", retryError);
                setIsListening(false);
              }
            }, 100);
          } catch (stopError) {
            console.log("Error stopping recognition:", stopError);
            setIsListening(false);
          }
        }
      }
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const clearConversation = () => {
    setConversation([]);
    dispatch(setQuestion(""));
    setStartingText("");
    startingTextRef.current = "";
  };

  console.log(conversation, "co");

  return (
    <>
      {/* Floating Chat Icon */}
      <div className="fixed bottom-6 right-6 z-50 ">
        {!isOpen && (
          <button
            onClick={toggleChat}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer"
            title="Open Chat"
          >
            <MessageCircleIcon size={24} />
          </button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircleIcon size={20} />
              <h3 className="font-semibold">TrainBoost Assistant</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearConversation}
                className="text-white hover:text-gray-200 p-1 cursor-pointer"
                title="Clear conversation"
              >
                <MinusIcon size={16} />
              </button>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 p-1 cursor-pointer"
                title="Close chat"
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {conversation.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircleIcon
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p className="font-medium">Welcome to TrainBoost Assistant!</p>
                <p className="text-sm mt-2">
                  Ask me anything about the presentation and I'll help you find
                  the answers.
                </p>
              </div>
            )}

            {conversation.map((item, index) => (
              <div key={index}>
                {item.type === "question" && (
                  <div className="flex justify-end mb-2">
                    <div className="bg-blue-600 text-white p-3 rounded-lg max-w-[80%]">
                      <p className="text-sm">{item.content}</p>
                    </div>
                  </div>
                )}
                {item.type === "answer" && (
                  <div
                    ref={
                      index === conversation.length - 1 ? lastAnswerRef : null
                    }
                    className="flex justify-start mb-2"
                  >
                    <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                      <AnswerSection
                        answer={item.content}
                        audioLink={item.audioLink}
                        onPauseVideo={onPauseVideo}
                      />
                    </div>
                  </div>
                )}
                {item.type === "error" && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg max-w-[80%]">
                      <p className="text-sm">{item.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start mb-2">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => {
                  const newValue = e.target.value;
                  dispatch(setQuestion(newValue));
                  if (!isListening) {
                    setStartingText(newValue);
                    startingTextRef.current = newValue;
                  }
                }}
                className="w-full px-2 py-1.5 pr-20 text-gray-700 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[52px] max-h-32"
                placeholder={isListening ? "Listening..." : "Ask TrainBoost..."}
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isPlaying && question.trim()) {
                      // Stop speech recognition if listening before submitting
                      if (isListening && recognitionRef.current) {
                        try {
                          recognitionRef.current.stop();
                          setIsListening(false);
                        } catch (error) {
                          console.log(
                            "Error stopping speech recognition on Enter:",
                            error
                          );
                          setIsListening(false);
                        }
                      }
                      handleSubmit();
                    }
                  }
                }}
                disabled={isListening}
              />

              {/* Speech Recognition Button */}
              {speechSupported && (
                <button
                  onClick={toggleSpeechRecognition}
                  disabled={isLoading || isPlaying}
                  className={`absolute right-2 top-1.5 p-2 rounded-full transition-colors ${
                    isLoading || isPlaying || isListening
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  <MicIcon
                    size={18}
                    isActive={isListening}
                    className={
                      isListening
                        ? "text-red-500"
                        : "text-gray-600 hover:text-blue-600"
                    }
                  />
                </button>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!question.trim() || isLoading || isPlaying}
                className={`absolute right-2 top-10 p-2 rounded-full transition-colors ${
                  !question.trim() || isLoading || isPlaying
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                title="Submit question"
              >
                <SendIcon
                  size={18}
                  isActive={!isLoading && !isPlaying && question.trim() !== ""}
                  className={
                    !question.trim() || isLoading || isPlaying
                      ? "text-gray-400"
                      : "text-blue-600 hover:text-blue-700"
                  }
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
