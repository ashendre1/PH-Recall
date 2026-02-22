import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { BrainLogo } from "../components/brain-logo";
import { ArrowLeft, CheckCircle, XCircle, RefreshCw } from "lucide-react";

// Sample quiz questions generator
const generateQuestions = (topic: string) => {
  return [
    {
      id: 1,
      question: `What is the most important concept in ${topic}?`,
      answer: "",
    },
    {
      id: 2,
      question: `Explain a key fact about ${topic}.`,
      answer: "",
    },
    {
      id: 3,
      question: `How would you describe ${topic} to a beginner?`,
      answer: "",
    },
    {
      id: 4,
      question: `What is a common misconception about ${topic}?`,
      answer: "",
    },
    {
      id: 5,
      question: `Why is ${topic} important?`,
      answer: "",
    },
  ];
};

export function TextQuiz() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: number; question: string; answer: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const storedTopic = sessionStorage.getItem("quizTopic");
    if (storedTopic) {
      setTopic(storedTopic);
      setQuestions(generateQuestions(storedTopic));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleSubmit = () => {
    if (userAnswer.trim()) {
      setSubmitted(true);
      // Simple scoring: if user provides an answer, they get a point
      if (userAnswer.trim().length > 10) {
        setScore(score + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer("");
      setSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setUserAnswer("");
    setSubmitted(false);
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
                style={{ color: "var(--carolina-blue)" }}
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
                  backgroundColor: "var(--carolina-blue)",
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
                  backgroundColor: "var(--peach)",
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
              backgroundColor: "var(--carolina-blue)",
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
                Text Quiz Mode
              </div>
              <div style={{ color: "var(--carolina-blue)" }}>
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
                backgroundColor: "var(--carolina-blue)",
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
          <h2 className="mb-6" style={{ color: "var(--brown)" }}>
            {questions[currentQuestion]?.question}
          </h2>

          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              disabled={submitted}
              className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all disabled:opacity-60"
              style={{
                borderColor: "var(--carolina-blue)",
                backgroundColor: "#ffffff",
                color: "var(--brown)",
              }}
              onFocus={(e) => {
                if (!submitted) {
                  e.target.style.borderColor = "var(--peach)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 176, 136, 0.2)";
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--carolina-blue)";
                e.target.style.boxShadow = "none";
              }}
            />

            {submitted && (
              <div
                className="p-4 rounded-xl flex items-center gap-3"
                style={{
                  backgroundColor: userAnswer.trim().length > 10 ? "#d4edda" : "#f8d7da",
                  color: userAnswer.trim().length > 10 ? "#155724" : "#721c24",
                }}
              >
                {userAnswer.trim().length > 10 ? (
                  <>
                    <CheckCircle size={24} />
                    <span>Great answer! You're doing well!</span>
                  </>
                ) : (
                  <>
                    <XCircle size={24} />
                    <span>Try to provide more detail in your answer.</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-4">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={!userAnswer.trim()}
                  className="flex-1 py-3 px-6 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--carolina-blue)",
                    color: "#ffffff",
                  }}
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-3 px-6 rounded-xl transition-all hover:scale-105"
                  style={{
                    backgroundColor: "var(--peach)",
                    color: "#ffffff",
                  }}
                >
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
