import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTasks } from "@/hooks/use-tasks";

interface KPIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  day: number;
}

export function KPIDialog({ open, onOpenChange, day }: KPIDialogProps) {
  const { submitKpiMutation, completeDayMutation } = useTasks();
  const [data, setData] = useState({
    conversationsCount: 0,
    dmSent: 0,
    interestedContacts: 0,
    salesCount: 0,
    notes: "",
  });

//  const handleSubmit = async () => {
  const handleCompleteDay = async () => {
    try {
/*      await submitKpiMutation.mutateAsync({
        day,
        data: {
          conversationsCount: Number(data.conversationsCount),
          dmSent: Number(data.dmSent),
          interestedContacts: Number(data.interestedContacts),
          salesCount: Number(data.salesCount),
          notes: data.notes,
        },
      });

      // After KPI submit, complete the day
      await completeDayMutation.mutateAsync();
      onOpenChange(false);*/
//      const res = await completeDayMutation.mutateAsync(payload); 
      const res = await completeDayMutation.mutateAsync(); 
//      setCheckInOpen(false); // ✅ chiudi modale
      onOpenChange(false); // ✅ chiudi modale
      queryClient.invalidateQueries({ queryKey: [api.tasks.today.path] }); // ✅ ricarica giorno
    } catch (e) {
      // Error handled by hook
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily Check-in: Day {day}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Track your progress before completing the day. Be honest—data drives
            growth!
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dms">DMs Sent</Label>
              <Input
                id="dms"
                type="number"
                value={data.dmSent}
                onChange={(e) =>
                  setData({ ...data, dmSent: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convos">Conversations</Label>
              <Input
                id="convos"
                type="number"
                value={data.conversationsCount}
                onChange={(e) =>
                  setData({
                    ...data,
                    conversationsCount: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leads">Interested Leads</Label>
              <Input
                id="leads"
                type="number"
                value={data.interestedContacts}
                onChange={(e) =>
                  setData({
                    ...data,
                    interestedContacts: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales">Sales Closed</Label>
              <Input
                id="sales"
                type="number"
                value={data.salesCount}
                onChange={(e) =>
                  setData({ ...data, salesCount: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Reflections / Notes</Label>
            <Textarea
              id="notes"
              placeholder="What worked? What didn't?"
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCompleteDay}
            disabled={
              submitKpiMutation.isPending || completeDayMutation.isPending
            }
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {submitKpiMutation.isPending
              ? "Saving..."
              : "Complete Day & Progress"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
