import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAvatarImage } from "@/lib/avatars";
import { ArrowLeft, Eye, EyeOff, Home, KeyRound, User, Sparkles } from "lucide-react";

// Mobile-first hero login: a big friendly card floating over the app
// gradient, real mascots, and thumb-sized fields. All login logic, the
// emergency / feature-disabled handling, and the "ask a parent" flow are
// preserved exactly, with the same data-testids.
export default function KidsLogin() {
  const [, setLocation] = useLocation();
  const [familyCode, setFamilyCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showParentRequest, setShowParentRequest] = useState(false);
  const [parentEmail, setParentEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const { toast } = useToast();

  const handleParentRequest = () => {
    const email = parentEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Hmm, that email looks off", description: "Please type your parent's full email address.", variant: "destructive" });
      return;
    }
    const signupUrl = `${window.location.origin}/parent/auth?mode=register`;
    const subject = encodeURIComponent("Please create my Habit Heroes account! 🦸");
    const body = encodeURIComponent(
      `Hi!\n\nI want to join Habit Heroes so I can turn my daily habits into adventures.\n\n` +
      `Please create a free parent account here:\n${signupUrl}\n\n` +
      `Then add me as a hero and give me a username and PIN so I can log in.\n\nThank you! 💛`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setRequestSent(true);
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: { familyCode: string; username: string; pin: string }) => {
      const res = await apiRequest("POST", "/api/auth/child-login", credentials);
      return res.json();
    },
    onSuccess: (childData) => {
      queryClient.setQueryData(["/api/auth/child"], childData);
      setLocation("/kids");
    },
    onError: (rawError: any) => {
      let error: any = { message: rawError?.message };
      const match = /^\d{3}:\s*([\s\S]*)$/.exec(rawError?.message || "");
      if (match) {
        try { error = JSON.parse(match[1]); } catch { error = { message: match[1] }; }
      }
      if (error.emergencyMode) {
        toast({ title: "🚨 Emergency Mode Active", description: "Your parent has temporarily restricted access to the app. Please contact your parent for assistance.", className: "bg-gray-100 border-gray-300 text-red-700", duration: 6000 });
      } else if (error.featureDisabled) {
        toast({ title: "🔒 Feature Disabled", description: "Access to daily habits has been disabled by your parent. Please contact your parent for assistance.", className: "bg-gray-100 border-gray-300 text-orange-700", duration: 6000 });
      } else {
        toast({ title: "Login Failed", description: error.message || "Invalid family code, username, or PIN", className: "bg-gray-100 border-gray-300 text-gray-800" });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyCode.trim() || !username.trim() || !pin.trim()) {
      toast({ title: "Missing Information", description: "Please enter family code, username and PIN", className: "bg-gray-100 border-gray-300 text-gray-800" });
      return;
    }
    loginMutation.mutate({ familyCode: familyCode.trim().toUpperCase(), username: username.trim(), pin: pin.trim() });
  };

  return (
    <div className="relative min-h-[100dvh] hero-gradient overflow-hidden">
      {/* Depth blobs */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-sunshine/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-16 w-64 h-64 rounded-full bg-mint/30 blur-3xl" />

      {/* Home button */}
      <button
        onClick={() => setLocation("/")}
        aria-label="Go to home"
        className="absolute top-[calc(var(--safe-top)+0.75rem)] left-4 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white"
      >
        <Home className="w-5 h-5" />
      </button>

      <div className="relative z-10 mx-auto w-full max-w-md px-5 pt-[calc(var(--safe-top)+3.5rem)] pb-[calc(var(--safe-bottom)+2rem)] flex flex-col min-h-[100dvh]">
        {/* Mascots + title */}
        <div className="text-center bounce-in">
          <div className="relative inline-block">
            <img src={getAvatarImage("robot")} alt="Hero" className="w-24 h-24 rounded-full border-4 border-white shadow-2xl object-cover mx-auto float" />
            <span className="absolute -top-1 -right-2 text-2xl float" style={{ animationDelay: "0.5s" }}>✨</span>
          </div>
          <h1 className="font-fredoka text-3xl text-white drop-shadow-lg mt-3">🦸 Hero Login</h1>
          <p className="text-white/90 font-nunito font-semibold mt-1">Enter your hero details to start!</p>
        </div>

        {/* Login card */}
        <div className="mt-6 bg-white rounded-3xl shadow-2xl p-5 bounce-in" style={{ animationDelay: "0.15s" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Family code */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">🏠 Family Code</label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coral" />
                <Input
                  type="text"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  placeholder="ABC123"
                  className="pl-10 h-12 rounded-2xl border-2 border-gray-200 focus:border-coral text-base font-bold tracking-widest uppercase"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">🦸 Hero Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sky" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="superhero123"
                  className="pl-10 h-12 rounded-2xl border-2 border-gray-200 focus:border-sky text-base"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">🔐 Secret PIN</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mint" />
                <Input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="••••"
                  className="pl-10 pr-11 h-12 rounded-2xl border-2 border-gray-200 focus:border-mint text-base tracking-[0.5em] font-bold"
                />
                <button type="button" onClick={() => setShowPin(!showPin)} aria-label={showPin ? "Hide PIN" : "Show PIN"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loginMutation.isPending} className="w-full super-button font-bold text-lg py-6 rounded-full">
              {loginMutation.isPending ? "Logging in..." : "🚀 Start My Adventure!"}
            </Button>
          </form>

          {/* Help hint */}
          <div className="mt-4 bg-sky/5 border border-sky/20 rounded-2xl p-3 text-center">
            <p className="text-xs text-gray-600 font-semibold">🆘 Ask your parent for the family code, your username and PIN.</p>
          </div>
        </div>

        {/* Don't have an account */}
        <div className="mt-4 bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center bounce-in" style={{ animationDelay: "0.25s" }}>
          {!showParentRequest ? (
            <button type="button" className="text-white text-sm w-full font-semibold" onClick={() => setShowParentRequest(true)} data-testid="button-no-account">
              <strong className="underline">Don't have an account?</strong> Ask your parent to make one! 💌
            </button>
          ) : requestSent ? (
            <div className="space-y-2" data-testid="parent-request-sent">
              <p className="text-white text-sm font-bold">📨 Request ready!</p>
              <p className="text-white/85 text-xs">We opened your email app with a message for your parent. Once they sign up, they'll give you a username and PIN!</p>
              <Button type="button" variant="outline" className="text-xs rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => { setRequestSent(false); setParentEmail(""); }}>
                Send to a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-white text-xs font-bold">Type your parent's email and we'll ask them to sign you up! 💌</p>
              <Input type="email" inputMode="email" placeholder="parent@example.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className="bg-white rounded-xl h-11" data-testid="input-parent-email" />
              <div className="flex gap-2">
                <Button type="button" className="flex-1 super-button font-bold rounded-full" onClick={handleParentRequest} data-testid="button-send-parent-request">Ask My Parent 💌</Button>
                <Button type="button" variant="outline" className="rounded-full bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => setShowParentRequest(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
