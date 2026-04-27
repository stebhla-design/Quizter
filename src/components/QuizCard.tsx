import { useState } from 'react';
import { QUIZ_DATA as DEFAULT_DATA, type Question } from '../data/questions';

interface QuizCardProps {
  questions?: Question[];
}

export default function QuizCard({ questions = DEFAULT_DATA }: QuizCardProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const currentQuestion = questions[currentStep];
  const isAnswered = selectedAnswers[currentStep] !== null;

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentStep] = index;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateScore();
      setIsFinished(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    const finalScore = selectedAnswers.reduce((acc: number, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    setScore(finalScore);
  };

  const restartQuiz = () => {
    setCurrentStep(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setIsFinished(false);
    setScore(0);
  };

  if (isFinished) {
    const percentage = (score / questions.length) * 100;
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="glass-card w-full max-w-lg p-10 flex flex-col items-center text-center animate-fade-in">
        <h2 className="text-3xl font-bold mb-6">Quiz Completed!</h2>
        
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/10"
            />
            <circle
              cx="64"
              cy="64"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-primary transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
          </div>
        </div>

        <p className="text-xl mb-8">
          You scored <span className="text-primary font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>

        <button onClick={restartQuiz} className="glass-button-primary w-full">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card w-full max-w-2xl p-6 md:p-10 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
      
      <div className="flex justify-between items-center mb-8 relative">
        <span className="px-3 py-1 bg-primary/20 text-primary-light rounded-full text-sm font-semibold tracking-wider uppercase">
          {currentQuestion.category}
        </span>
        <span className="text-white/40 font-mono">
          {currentStep + 1} / {questions.length}
        </span>
      </div>

      <h3 className="text-2xl md:text-3xl font-bold mb-10 leading-tight relative">
        {currentQuestion.question}
      </h3>

      <div className="space-y-4 mb-10 relative">
        {currentQuestion.options.map((option, index) => {
          const isSelected = selectedAnswers[currentStep] === index;
          const isCorrect = isAnswered && index === currentQuestion.correctAnswer;
          const isIncorrect = isAnswered && isSelected && index !== currentQuestion.correctAnswer;

          let cardClass = "option-card";
          if (isCorrect) cardClass += " correct";
          else if (isIncorrect) cardClass += " incorrect";
          else if (isSelected) cardClass += " selected";

          return (
            <button
              key={index}
              onClick={() => handleSelectOption(index)}
              className={cardClass}
              disabled={isAnswered}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${
                isSelected || isCorrect || isIncorrect ? 'border-transparent bg-white/20' : 'border-white/10 bg-white/5'
              }`}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="mb-10 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
          <p className="text-emerald-400 text-sm font-bold mb-1 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Pro-tip
          </p>
          <p className="text-white/80 text-sm">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      <div className="flex gap-4 relative">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="glass-button-secondary flex-1"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!isAnswered}
          className="glass-button-primary flex-1"
        >
          {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
