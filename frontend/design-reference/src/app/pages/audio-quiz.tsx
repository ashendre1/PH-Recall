import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BrainLogo } from "../components/brain-logo";
import { ArrowLeft, Mic, Volume2, CheckCircle, RefreshCw, StopCircle } from "lucide-react";

// Sample quiz questions generator
const generateQuestions = (topic: string) => {
  return [
    {
      id: 1,
      question: `What is the most important concept in ${topic}?`,
    },
    {
      id: 2,
      question: `Explain a key fact about ${topic}.`,
    },
    {
      id: 3,
      question: `How would you describe ${topic} to a beginner?`,
    },
    {
      id: 4,
      question: `What is a common misconception about ${topic}?`,
    },
    {
      id: 5,
      question: `Why is ${topic} important?`,
    },
  ];
};

export function AudioQuiz() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: number; question: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const storedTopic = sessionStorage.getItem("quizTopic");
    if (storedTopic) {
      setTopic(storedTopic);
      setQuestions(generateQuestions(storedTopic));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const speakQuestion = () => {
    if ('speechSynthesis' in window && questions[currentQuestion]) {
      setIsPlaying(true);
      const utterance = new SpeechSynthesisUtterance(questions[currentQuestion].question);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.start();
      setIsRecording(true);
      
      // Store recognition instance to stop it later
      (window as any).currentRecognition = recognition;
    } else {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
  };

  const stopRecording = () => {
    if ((window as any).currentRecognition) {
      (window as any).currentRecognition.stop();
    }
    setIsRecording(false);
    if (transcript.trim().length > 10) {
      setScore(score + 1);
    }
    setAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTranscript("");
      setAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setTranscript("");
    setAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (showResults) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div
            className="rounded-3xl shadow-xl p-8 md:p-12 text-center"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="flex justify-center mb-6">
              <BrainLogo size={100} />
            </div>
            <h1 className="mb-4" style={{ color: "var(--brown)" }}>
              Quiz Complete! 🎉
            </h1>
            <div className="mb-8">
              <div
                className="text-6xl mb-4"
                style={{ color: "var(--peach)" }}
              >
                {score}/{questions.length}
              </div>
              <p className="text-xl" style={{ color: "var(--brown)" }}>
                {score === questions.length
                  ? "Perfect score! Amazing work!"
                  : score >= questions.length / 2
                  ? "Great job! Keep practicing!"
                  : "Good effort! Try again to improve!"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                }}
              >
                <RefreshCw size={20} />
                Try Again
              </button>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 hover:scale-105"
                style={{
                  backgroundColor: "var(--carolina-blue)",
                  color: "#ffffff",
                }}
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{
              backgroundColor: "var(--peach)",
              color: "#ffffff",
            }}
          >
            <ArrowLeft size={20} />
            Home
          </button>
          <div className="flex items-center gap-3">
            <BrainLogo size={50} />
            <div>
              <div className="text-sm" style={{ color: "var(--brown)" }}>
                Audio Quiz Mode
              </div>
              <div style={{ color: "var(--peach)" }}>
                {topic}
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--brown)" }}>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm" style={{ color: "var(--brown)" }}>
              Score: {score}
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#e0e0e0" }}>
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: "var(--peach)",
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          className="rounded-3xl shadow-xl p-8 md:p-12"
          style={{ backgroundColor: "#ffffff" }}
        >
          <h2 className="mb-6 text-center" style={{ color: "var(--brown)" }}>
            {questions[currentQuestion]?.question}
          </h2>

          {/* Play Question Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={speakQuestion}
              disabled={isPlaying || isRecording}
              className="px-8 py-4 rounded-full transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              style={{
                backgroundColor: "var(--carolina-blue)",
                color: "#ffffff",
              }}
            >
              <Volume2 size={24} className={isPlaying ? "animate-pulse" : ""} />
              {isPlaying ? "Playing..." : "Listen to Question"}
            </button>
          </div>

          {/* Recording Area */}
          <div className="space-y-4">
            <div
              className="p-6 rounded-xl min-h-[150px] flex flex-col items-center justify-center"
              style={{
                backgroundColor: isRecording ? "#ffe0d0" : "var(--beige)",
                border: `2px solid ${isRecording ? "var(--peach)" : "var(--carolina-blue)"}`,
              }}
            >
              {isRecording ? (
                <>
                  <div className="animate-pulse mb-4">
                    <Mic size={48} style={{ color: "var(--peach)" }} />
                  </div>
                  <p style={{ color: "var(--brown)" }}>Recording... Speak your answer</p>
                </>
              ) : transcript ? (
                <>
                  <CheckCircle size={48} style={{ color: "var(--carolina-blue)" }} className="mb-4" />
                  <p className="text-center" style={{ color: "var(--brown)" }}>
                    {transcript}
                  </p>
                </>
              ) : (
                <>
                  <Mic size={48} style={{ color: "var(--carolina-blue)" }} className="mb-4" />
                  <p style={{ color: "var(--brown)" }}>Click the button below to record your answer</p>
                </>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-4">
              {!answered && !isRecording && (
                <button
                  onClick={startRecording}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--peach)",
                    color: "#ffffff",
                  }}
                >
                  <Mic size={24} />
                  Start Recording
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--brown)",
                    color: "#ffffff",
                  }}
                >
                  <StopCircle size={24} />
                  Stop Recording
                </button>
              )}

              {answered && (
                <button
                  onClick={handleNext}
                  className="w-full py-4 px-6 rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--carolina-blue)",
                    color: "#ffffff",
                  }}
                >
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              )}
            </div>
          </div>

          {/* Browser Support Notice */}
          <div className="mt-6 text-center text-sm" style={{ color: "var(--brown)" }}>
            <p>💡 Audio features work best in Chrome, Edge, or Safari</p>
          </div>
        </div>
      </div>
    </div>
  );
}
