import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Users,
  Target,
  Gift,
  BarChart3,
  Shield,
  Crown,
  Sparkles,
  CheckCircle,
  Star,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation: string;
  highlights: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Habit Heroes!",
    description:
      "Transform your children's daily routines into exciting adventures. Let's explore how to make habit building fun and engaging for your family.",
    icon: <Crown className="w-12 h-12 text-sunshine" />,
    animation: "bounce-in",
    highlights: [
      "Gamified habit tracking",
      "Parent oversight tools",
      "Real-time progress monitoring",
    ],
  },
  {
    id: "heroes",
    title: "Create Your Heroes",
    description:
      "Start by adding your children as heroes. Each child gets their own customizable avatar, XP system, and personal journey through the app.",
    icon: <Users className="w-12 h-12 text-coral" />,
    animation: "slide-in-right",
    highlights: [
      "Custom avatars (robot, princess, ninja, animal)",
      "Individual XP and level systems",
      "Personal progress tracking",
    ],
  },
  {
    id: "habits",
    title: "Build Powerful Habits",
    description:
      "Create daily habits for your heroes. From brushing teeth to homework, turn every task into an exciting quest with XP rewards and visual progress.",
    icon: <Target className="w-12 h-12 text-mint" />,
    animation: "slide-in-left",
    highlights: [
      "Custom habit creation",
      "XP point rewards",
      "Streak tracking",
      "Visual progress indicators",
    ],
  },
  {
    id: "approval",
    title: "Habit Approval System",
    description:
      "Maintain quality control with our approval system. Review your children's habit completions, provide feedback, and approve rewards before they're earned.",
    icon: <CheckCircle className="w-12 h-12 text-green-500" />,
    animation: "fade-in-up",
    highlights: [
      "Parent approval required",
      "Constructive feedback system",
      "Quality assurance for habits",
    ],
  },
  {
    id: "rewards",
    title: "Reward System",
    description:
      "Set up meaningful rewards that motivate your heroes. From extra screen time to special treats, create a reward catalog that drives engagement.",
    icon: <Gift className="w-12 h-12 text-purple-500" />,
    animation: "slide-in-right",
    highlights: [
      "Customizable reward catalog",
      "XP-based pricing",
      "Parent approval process",
      "Real reward redemption",
    ],
  },
  {
    id: "analytics",
    title: "Progress Analytics",
    description:
      "Track your family's success with detailed analytics. Monitor completion rates, streaks, XP growth, and identify areas for improvement.",
    icon: <BarChart3 className="w-12 h-12 text-sky" />,
    animation: "slide-in-left",
    highlights: [
      "Weekly progress reports",
      "Habit performance metrics",
      "Family-wide statistics",
      "Trend analysis",
    ],
  },
  {
    id: "controls",
    title: "Parental Controls",
    description:
      "Maintain control with comprehensive parental controls. Set screen time limits, bedtime restrictions, emergency modes, and feature access per child.",
    icon: <Shield className="w-12 h-12 text-red-500" />,
    animation: "fade-in-up",
    highlights: [
      "Per-child screen time limits",
      "Bedtime mode controls",
      "Emergency lock features",
      "App feature restrictions",
    ],
  },
  {
    id: "ready",
    title: "You're Ready to Start!",
    description:
      "Your journey as a Habit Heroes parent begins now. Create meaningful habits, celebrate victories, and watch your children develop life-changing routines.",
    icon: <Sparkles className="w-12 h-12 text-sunshine" />,
    animation: "bounce-in",
    highlights: [
      "Start with simple habits",
      "Celebrate small wins",
      "Adjust rewards as needed",
      "Be consistent with approval",
    ],
  },
];

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTutorial({
  isOpen,
  onClose,
  onComplete,
}: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const skipTutorial = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-coral to-sunshine relative">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-gray-800" />
            </div>
            <div>
              <h2 className="font-fredoka text-xl hero-title text-gray-800 font-bold drop-shadow-lg">
                Parent Tutorial
              </h2>
              <p className="text-gray-700 text-sm font-semibold drop-shadow-lg">
                Step {currentStep + 1} of {onboardingSteps.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={skipTutorial}
            className="text-gray-800 hover:bg-white/20 p-2 rounded-full transition-all duration-200 hover:scale-105 border-2 border-white/30 hover:border-white/50"
            title="Close Tutorial"
          >
            <X className="w-5 h-5 drop-shadow-lg" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600 font-medium">Welcome</span>
            <span className="text-xs text-gray-600 font-medium">Complete</span>
          </div>
        </div>

        {/* Content */}
        <div
          className={`p-8 transition-all duration-300 ${isAnimating ? "opacity-50 transform scale-95" : "opacity-100 transform scale-100"}`}
        >
          <div className="text-center mb-8">
            <div
              className={`mx-auto mb-4 ${step.animation}`}
              style={{ animationDelay: isAnimating ? "0ms" : "300ms" }}
            >
              {step.icon}
            </div>
            <h3 className="font-fredoka text-2xl text-gray-800 mb-3 hero-title">
              {step.title}
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {step.description}
            </p>
          </div>

          {/* Key Highlights */}
          <div className="bg-gradient-to-r from-mint/10 to-sky/10 rounded-lg p-6 mb-8 border border-mint/20">
            <h4 className="font-fredoka text-lg text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-mint" />
              Key Features:
            </h4>
            <div className="space-y-2">
              {step.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 fade-in-up`}
                  style={{ animationDelay: `${(index + 1) * 100}ms` }}
                >
                  <div className="w-2 h-2 bg-mint rounded-full"></div>
                  <span className="text-gray-700">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tutorial Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-coral"
                      : index < currentStep
                        ? "bg-mint"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextStep}
              className={`flex items-center gap-2 ${
                currentStep === onboardingSteps.length - 1
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "super-button"
              }`}
            >
              {currentStep === onboardingSteps.length - 1 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Get Started!
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="px-6 py-4 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: You can always access this tutorial again from the Help
            section
          </p>
        </div>
      </Card>
    </div>
  );
}
