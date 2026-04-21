import { Button } from "@/components/ui/button";
import { Eye, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface LeadActionsCellProps {
  leadId: number;
  showTimelineButton?: boolean; // เพิ่ม prop ใหม่
}

const LeadActionsCell = ({ leadId, showTimelineButton = true }: LeadActionsCellProps) => {
  return (
    <div className="flex gap-2">
      <Link to={`/leads/${leadId}`}>
        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:border-green-300 hover:text-black">
          <Eye className="h-4 w-4 mr-1" />
          ดูรายละเอียด
        </Button>
      </Link>
      {showTimelineButton && (
        <Link to={`/leads/${leadId}/timeline`}>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Clock className="h-4 w-4 mr-1" />
            การติดตาม
          </Button>
        </Link>
      )}
    </div>
  );
};

export default LeadActionsCell;
