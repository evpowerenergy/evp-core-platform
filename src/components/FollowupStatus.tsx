
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { MAX_FOLLOWUP_ROUNDS } from "@/hooks/useFollowupStats";

interface FollowupStatusProps {
  followupCount: number;
}

const FollowupStatus = ({ followupCount }: FollowupStatusProps) => {
  const isCompleted = followupCount >= MAX_FOLLOWUP_ROUNDS;
  const hasStarted = followupCount > 0;

  if (isCompleted) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
        <CheckCircle className="h-3 w-3" />
        โทรติดตามครบ {followupCount}/{MAX_FOLLOWUP_ROUNDS} รอบ
      </Badge>
    );
  }

  if (hasStarted) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1 w-fit">
        <Clock className="h-3 w-3" />
        โทรติดตามแล้ว {followupCount}/{MAX_FOLLOWUP_ROUNDS} รอบ
      </Badge>
    );
  }

  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit">
      <AlertCircle className="h-3 w-3" />
      ยังไม่โทรติดตาม
    </Badge>
  );
};

export default FollowupStatus;
