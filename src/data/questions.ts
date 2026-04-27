export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const QUIZ_DATA: Question[] = [
  {
    id: "1",
    category: "Science",
    question: "Which chemical element has the symbol 'Au' on the periodic table?",
    options: ["Silver", "Gold", "Aluminium", "Argon"],
    correctAnswer: 1,
    explanation: "Au comes from the Latin word 'Aurum', which means gold. It's one of the most stable and least reactive metals."
  },
  {
    id: "2",
    category: "Tech",
    question: "What does 'API' stand for in software development?",
    options: [
      "Advanced Program Integration",
      "Application Process Interface",
      "Application Programming Interface",
      "Automated Protocol Interaction"
    ],
    correctAnswer: 2,
    explanation: "An Application Programming Interface (API) is a set of rules that allow different software applications to communicate with each other."
  },
  {
    id: "3",
    category: "Tech",
    question: "Which company developed the React.js library?",
    options: ["Google", "Microsoft", "Meta (Facebook)", "Amazon"],
    correctAnswer: 2,
    explanation: "React was created by Jordan Walke, a software engineer at Facebook, and was first deployed on Facebook's News Feed in 2011."
  }
];
