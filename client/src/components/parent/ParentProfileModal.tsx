import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Save,
  Camera
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
}

export default function ParentProfileModal({ isOpen, onClose, user }: ParentProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");


  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserType>) => {
      return await apiRequest("PATCH", "/api/profile", updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated! ✨",
        description: "Your parent profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      email,
      firstName,
      lastName,
      phoneNumber,
    });
  };

  if (!isOpen) return null;

  const inputCls = "h-12 rounded-xl border-2 border-gray-200 focus:border-coral text-base mt-1";

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" data-testid="parent-profile-sheet">
      {/* Gradient header with the parent avatar — matches the detail screens */}
      <div className="hero-gradient text-white px-3 pt-[calc(var(--safe-top)+0.5rem)] pb-6 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center" aria-label="Close" data-testid="button-close-profile">
            <X className="w-5 h-5" />
          </button>
          <span className="font-fredoka text-lg">My Profile</span>
          <div className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center -mb-2 mt-1">
          <div className="relative">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center text-white font-fredoka text-4xl">
                {(firstName?.[0] || lastName?.[0] || email?.[0] || 'P').toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow">
              <Camera className="w-4 h-4 text-coral" />
            </span>
          </div>
          <h2 className="font-fredoka text-2xl mt-2">{[firstName, lastName].filter(Boolean).join(" ") || "Parent"}</h2>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 -mt-3">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName" className="font-bold text-gray-700">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <Label htmlFor="lastName" className="font-bold text-gray-700">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputCls} />
            </div>
          </div>
          <div>
            <Label htmlFor="email" className="font-bold text-gray-700">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 mt-0.5" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${inputCls} pl-10`} />
            </div>
          </div>
          <div>
            <Label htmlFor="phone" className="font-bold text-gray-700">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 mt-0.5" />
              <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="(555) 123-4567" className={`${inputCls} pl-10`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky save */}
      <div className="px-5 pb-[calc(1rem+var(--safe-bottom))] pt-3 flex-shrink-0">
        <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="w-full bg-coral hover:bg-coral/80 text-white font-bold rounded-full text-base py-6">
          <Save className="w-4 h-4 mr-2" />
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}