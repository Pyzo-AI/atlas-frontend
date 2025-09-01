import React, { useState, useRef, useEffect } from "react";
import chat_history from "@/assets/svg/chat_history.svg";
import back_to_session from "@/assets/svg/back_to_session.svg";
import Image from "next/image";
import tap_to_speak from "@/assets/svg/tap-to-speak.svg";
import Lottie from "lottie-react";
import userWaveAnimation from "@/assets/json/user_wave.json";
import { useDispatch, useSelector } from "react-redux";
import { setIsQuestionMode, setQuestion, setAnswerPptIndex } from "@/store/features/videoSlice";


const QuestionModeUser = ({ onPauseVideo, onQuestionSubmit, setShowChat, onPauseAnswerAudio, isAudioPlaying, isAudioLoading}) => {
  const dispatch = useDispatch();
  const { question } = useSelector((state) => state.video);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [startingText, setStartingText] = useState("");
  const startingTextRef = useRef("");
  const recognitionRef = useRef(null);

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
            if (onQuestionSubmit) {
              onQuestionSubmit(combinedText);
            }
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



  const handleTapToSpeak = () => {
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

      // Stop any playing answer audio when mic starts
      if (onPauseAnswerAudio) {
        onPauseAnswerAudio();
      }

      setStartingText("");
      startingTextRef.current = "";
      dispatch(setQuestion(""));

      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.log("Error starting speech recognition:", error);
        setIsListening(false);
      }
    }
  };

  const handleBackToSession = () => {
    // Stop speech recognition if active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Error stopping speech recognition:", error);
      }
      setIsListening(false);
    }
    
    // Clear state
    dispatch(setQuestion(""));
    dispatch(setIsQuestionMode(false));
  };

  const handleChatHistory = () => {
    setShowChat(true);
    dispatch(setIsQuestionMode(false));
  };

  return (
    <div className="flex-1 border border-[#E5E7EB] rounded-[10px] p-3 pb-6 flex flex-col">
      {/* Main Content Frame */}
      <div className="flex-1 bg-[#F7F7F7] rounded-xl flex items-center justify-center p-6">
        {/* Center Content */}
        <div className="flex flex-col items-center gap-[30px] max-w-[275px]">
          {/* Avatar/Tap to Speak */}
          <div className="w-[120px] h-[120px] flex items-center justify-center cursor-pointer" onClick={handleTapToSpeak}>
            {isListening ? (
              <Lottie
                animationData={userWaveAnimation}
                style={{ width: 120, height: 120 }}
                loop={true}
              />
            ) : (
              <Image
                src={tap_to_speak}
                alt="tap to speak"
                width={72}
                height={72}
              />
            )}
          </div>

          {/* Question/Answer Text */}
          {(question && (isAudioPlaying || isAudioLoading)) || isListening? (
            <p className="font-lato font-normal text-sm leading-[18px] text-center text-[#1A1C29]">
              {question}
            </p>
          ) : (
            <p className="font-lato font-normal text-sm leading-[18px] text-center text-[#1A1C29]">
              { "Tap to ask a question"}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Input Section */}
      <div className="mt-6 flex items-center justify-center px-3 gap-4 mx-auto">
        {/* <button onClick={handleChatHistory} className="cursor-pointer flex items-center gap-1 px-3 py-[7px] bg-[rgba(110,96,223,0.1)] rounded-[73.75px]">
          <Image
            className="w-[18px] h-[18px]"
            src={chat_history}
            alt="chat_history"
          />
       
        </button> */}
        <button onClick={handleBackToSession} className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-[#6E60DF] rounded-[73.75px]">
          <Image
            className="w-5 h-5"
            src={back_to_session}
            alt="back_to_session"
          />
          <span className="font-lato font-medium text-xs text-white">
            Continue Lesson
          </span>
        </button>
      </div>
    </div>
  );
};

export default QuestionModeUser;