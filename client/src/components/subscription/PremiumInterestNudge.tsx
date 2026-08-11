// Parent-facing conversion nudge. When a child taps "Ask a grown-up ⭐" in any
// module (games / avatars / gear), it's recorded on the child; this card shows
// the parent WHICH child wants WHAT, lists the Premium benefits, and gives a
// one-tap Upgrade. Hidden once the family already has premium access.
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown, Check } from "lucide-react";
import { getSubscriptionStatus } from "@/lib/subscriptionUtils";
import { PREMIUM_BENEFITS, PREMIUM_MODULE_LABELS, PREMIUM_MODULE_EMOJI, type PremiumModule } from "@shared/premium";
import type { User, Child } from "@shared/schema";

type ChildWithInterest = Child & {
  premiumInterestCount?: number;
  premiumInterestModules?: Record<string, number>;
};

export default function PremiumInterestNudge() {
  const [, setLocation] = useLocation();
  const { data: user } = useQuery<User>({ queryKey: ["/api/auth/user"] });
  const { data: children } = useQuery<ChildWithInterest[]>({ queryKey: ["/api/children"] });

  // Don't nag families who already have premium.
  if (getSubscriptionStatus(user).canAccessPremiumFeatures) return null;

  const interested = (children || []).filter((c) => (c.premiumInterestCount || 0) > 0);
  if (interested.length === 0) return null;

  const totalAsks = interested.reduce((n, c) => n + (c.premiumInterestCount || 0), 0);

  return (
    <Card className="border-4 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100 overflow-hidden" data-testid="premium-interest-nudge">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-fredoka text-lg text-amber-900 leading-tight">
              Your {interested.length === 1 ? "child" : "kids"} asked to unlock Premium
            </h3>
            <p className="text-amber-800 text-sm">
              {totalAsks} request{totalAsks === 1 ? "" : "s"} — here's what they're excited about:
            </p>
          </div>
        </div>

        {/* Which child, which module */}
        <div className="space-y-1.5 mb-3">
          {interested.map((c) => {
            const mods = Object.entries(c.premiumInterestModules || {})
              .filter(([, n]) => (n as number) > 0) as [PremiumModule, number][];
            return (
              <div key={c.id} className="bg-white/70 rounded-xl px-3 py-2 text-sm">
                <span className="font-bold text-gray-800">{c.name}</span>{" "}
                <span className="text-gray-600">wants </span>
                {mods.length > 0 ? (
                  mods.map(([m, n], i) => (
                    <span key={m} className="text-gray-800 font-semibold">
                      {i > 0 ? ", " : ""}{PREMIUM_MODULE_EMOJI[m] ?? "⭐"} {PREMIUM_MODULE_LABELS[m] ?? m}
                      {n > 1 ? ` (${n}×)` : ""}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-800 font-semibold">⭐ more content</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Benefits */}
        <div className="bg-white/70 rounded-xl p-3 mb-3">
          <div className="font-bold text-amber-900 text-sm mb-1.5 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> With Habit Hero Premium
          </div>
          <ul className="space-y-1">
            {PREMIUM_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-1.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /> {b}
              </li>
            ))}
          </ul>
        </div>

        <Button
          onClick={() => setLocation("/subscription")}
          className="w-full super-button font-bold py-5 rounded-full text-base"
          data-testid="nudge-upgrade-cta"
        >
          <Crown className="w-5 h-5 mr-2" />
          Unlock Premium for your {interested.length === 1 ? "child" : "kids"}
        </Button>
      </CardContent>
    </Card>
  );
}
