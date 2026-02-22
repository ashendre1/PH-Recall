import { createBrowserRouter } from "react-router";
import { Main } from "./pages/main";
import { TextQuiz } from "./pages/text-quiz";
import { AudioQuiz } from "./pages/audio-quiz";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Main,
  },
  {
    path: "/text-quiz",
    Component: TextQuiz,
  },
  {
    path: "/audio-quiz",
    Component: AudioQuiz,
  },
]);
