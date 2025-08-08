import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, X, CheckCircle, AlertCircle } from "lucide-react";

interface ParentVerificationProps {
  onVerified: () => void;
  onCancel: () => void;
}

const verificationQuestions = [
  {
    question: "What is 15 + 27?",
    answer: "42",
    type: "math"
  },
  {
    question: "In what year did World War II end?",
    answer: "1945",
    type: "history"
  },
  {
    question: "What is the capital of France?",
    answer: "paris",
    type: "geography"
  },
  {
    question: "How many days are in a leap year?",
    answer: "366",
    type: "general"
  },
  {
    question: "What is 8 × 7?",
    answer: "56",
    type: "math"
  }
];

export default function ParentVerification({ onVerified, onCancel }: ParentVerificationProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const selectedQuestion = verificationQuestions[currentQuestion];
  const maxAttempts = 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedCorrectAnswer = selectedQuestion.answer.toLowerCase();

    if (normalizedUserAnswer === normalizedCorrectAnswer) {
      setIsVerified(true);
      setTimeout(() => {
        onVerified();
      }, 1500);
    } else {
      setAttempts(attempts + 1);
      setShowError(true);
      setUserAnswer("");
      
      if (attempts + 1 >= maxAttempts) {
        setTimeout(() => {
          onCancel();
        }, 2000);
      } else {
        // Show a different question on wrong answer
        setCurrentQuestion((prev) => (prev + 1) % verificationQuestions.length);
        setTimeout(() => {
          setShowError(false);
        }, 2000);
      }
    }
  };

  if (isVerified) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 shadow-2xl border-2 border-mint">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-mint mx-auto mb-4" />
            <h2 className="font-fredoka text-2xl text-gray-800 mb-2">Verified!</h2>
            <p className="text-gray-600">Accessing parent dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2 border-coral">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-coral" />
              <h2 className="font-fredoka text-2xl text-gray-800">Parent Verification</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              To access the parent dashboard, please answer this question:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="font-nunito text-lg text-gray-800 text-center">
                {selectedQuestion.question}
              </p>
            </div>

            {showError && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-600 text-sm">
                  {attempts >= maxAttempts - 1 
                    ? "Too many incorrect attempts. Returning to kids view..." 
                    : `Incorrect answer. ${maxAttempts - attempts - 1} attempts remaining.`}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter your answer..."
                className="text-center text-lg font-semibold"
                autoFocus
                disabled={showError && attempts >= maxAttempts}
              />
              
              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 bg-coral hover:bg-coral/80 text-white font-bold py-3"
                  disabled={!userAnswer.trim() || (showError && attempts >= maxAttempts)}
                >
                  Submit Answer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 py-3"
                >
                  Back to Kids View
                </Button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Attempt {attempts + 1} of {maxAttempts}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}