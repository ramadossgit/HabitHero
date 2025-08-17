import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  MessageSquare
} from "lucide-react";

interface Child {
  id: string;
  name: string;
  pendingCount?: number;
}

interface HabitApprovalProps {
  children: Child[];
}

export default function HabitApproval({ children }: HabitApprovalProps) {
  const { toast } = useToast();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState("");

  // Get pending habits count for each child
  const { data: pendingCounts } = useQuery({
    queryKey: ["/api/pending-habits/all"],
    select: (data: any[]) => {
      const counts: Record<string, number> = {};
      data.forEach(item => {
        const childId = item.child.id;
        counts[childId] = (counts[childId] || 0) + 1;
      });
      return counts;
    }
  });

  // Get detailed pending habits for selected child
  const { data: pendingHabits = [] } = useQuery<any[]>({
    queryKey: ["/api/children", selectedChild, "pending-habits"],
    enabled: !!selectedChild,
  });

  const approveHabitMutation = useMutation({
    mutationFn: async ({ completionId, message }: { completionId: string; message?: string }) => {
      return apiRequest("POST", `/api/habit-completions/${completionId}/approve`, {
        approvedBy: 'parent', // You might want to pass actual parent ID
        message
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "pending-habits"] });
      toast({
        title: "Habit Approved! ✅",
        description: "Great job! Reward points have been awarded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve habit",
        variant: "destructive"
      });
    }
  });

  const rejectHabitMutation = useMutation({
    mutationFn: async ({ completionId, message }: { completionId: string; message: string }) => {
      return apiRequest("POST", `/api/habit-completions/${completionId}/reject`, {
        rejectedBy: 'parent', // You might want to pass actual parent ID
        message
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pending-habits/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/children", selectedChild, "pending-habits"] });
      setRejectingId(null);
      setRejectMessage("");
      toast({
        title: "Feedback Sent",
        description: "Your child can try completing this habit again.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject habit",
        variant: "destructive"
      });
    }
  });

  const handleApprove = (completionId: string, message?: string) => {
    approveHabitMutation.mutate({ completionId, message });
  };

  const handleReject = (completionId: string) => {
    if (!rejectMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide feedback to help your child improve.",
        variant: "destructive"
      });
      return;
    }
    rejectHabitMutation.mutate({ completionId, message: rejectMessage });
  };

  const childrenWithCounts = children.map(child => ({
    ...child,
    pendingCount: pendingCounts?.[child.id] || 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Habit Approvals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Child Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold">Select a child to review their habits:</h3>
          <div className="grid gap-3">
            {childrenWithCounts.map((child) => (
              <div
                key={child.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedChild === child.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedChild(child.id)}
                data-testid={`select-child-${child.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{child.name}</span>
                  </div>
                  {child.pendingCount > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {child.pendingCount} pending
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Habits for Selected Child */}
          {selectedChild && pendingHabits && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold">Pending Habits:</h3>
              {pendingHabits.length === 0 ? (
                <p className="text-gray-500">No pending habits for this child.</p>
              ) : (
                <div className="space-y-3">
                  {pendingHabits.map((item: any) => (
                    <Card key={item.completion.id} className="border-orange-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{item.habit.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                +{item.completion.xpEarned} XP
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.habit.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(item.completion.completedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(item.completion.completedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rejection form */}
                        {rejectingId === item.completion.id ? (
                          <div className="mt-4 space-y-3 border-t pt-3">
                            <div>
                              <label className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Feedback for your child:
                              </label>
                              <Textarea
                                value={rejectMessage}
                                onChange={(e) => setRejectMessage(e.target.value)}
                                placeholder="Explain what needs to be improved..."
                                className="mt-1"
                                data-testid={`reject-message-${item.completion.id}`}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(item.completion.id)}
                                disabled={rejectHabitMutation.isPending}
                                data-testid={`confirm-reject-${item.completion.id}`}
                              >
                                {rejectHabitMutation.isPending ? "Sending..." : "Send Feedback"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectMessage("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(item.completion.id, "Great job!")}
                              disabled={approveHabitMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`approve-habit-${item.completion.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {approveHabitMutation.isPending ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectingId(item.completion.id)}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                              data-testid={`reject-habit-${item.completion.id}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Needs Work
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}