import { useState } from "react";
import { useNavigate } from "react-router";
import { BrainLogo } from "../components/brain-logo";
import { Sparkles } from "lucide-react";

export function Main() {
  const [topic, setTopic] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      // Store the topic in sessionStorage to access it in quiz pages
      sessionStorage.setItem("quizTopic", topic);
    }
  };

  const handleTryIt = (mode: "text" | "audio") => {
    if (topic.trim()) {
      sessionStorage.setItem("quizTopic", topic);
      navigate(`/${mode}-quiz`);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--beige)" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <BrainLogo size={120} />
          </div>
          <h1 className="mb-4" style={{ color: "var(--brown)" }}>
            Recall - Fun Learning Quiz
          </h1>
          <p className="text-lg" style={{ color: "var(--brown)" }}>
            Test your knowledge in a fun and interactive way!
          </p>
        </div>

        {/* Main Form Card */}
        <div
          className="rounded-3xl shadow-xl p-8 md:p-12"
          style={{ backgroundColor: "#ffffff" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="topic"
                className="block mb-3"
                style={{ color: "var(--brown)" }}
              >
                What topic would you like to be quizzed on?
              </label>
              <textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your topic or question here... (e.g., 'World War 2', 'Photosynthesis', 'Spanish vocabulary')"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "var(--carolina-blue)",
                  backgroundColor: "#ffffff",
                  color: "var(--brown)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--peach)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(255, 176, 136, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--carolina-blue)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => handleTryIt("text")}
                disabled={!topic.trim()}
                className="flex-1 py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: "var(--carolina-blue)",
                  color: "#ffffff",
                }}
              >
                <Sparkles size={20} />
                Try It - Text Mode
              </button>

              <button
                type="button"
                onClick={() => handleTryIt("audio")}
                disabled={!topic.trim()}
                className="flex-1 py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: "var(--peach)",
                  color: "#ffffff",
                }}
              >
                <Sparkles size={20} />
                Try It - Audio Mode
              </button>
            </div>
          </form>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--beige)" }}
            >
              <h3 style={{ color: "var(--carolina-blue)" }} className="mb-2">
                📝 Text Mode
              </h3>
              <p className="text-sm" style={{ color: "var(--brown)" }}>
                Read questions and type your answers. Perfect for detailed responses.
              </p>
            </div>
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "var(--beige)" }}
            >
              <h3 style={{ color: "var(--peach)" }} className="mb-2">
                🎤 Audio Mode
              </h3>
              <p className="text-sm" style={{ color: "var(--brown)" }}>
                Listen to questions and speak your answers. Great for on-the-go learning!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm" style={{ color: "var(--brown)" }}>
            Make learning fun and memorable! 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
