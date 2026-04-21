
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserDataAPI as useUserData } from "@/hooks/useUserDataAPI";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/useToast";


const UserProfileDropdown = () => {
  const { user, signOut, signingOut } = useAuth();
  const { data: userData } = useUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check if we're on the backoffice page
  const isBackofficePage = location.pathname === '/backoffice';

  const handleSignOut = async () => {
    // Prevent multiple clicks
    if (signingOut) {
  
      return;
    }

    try {
  
      
      // Call signOut from useAuth hook
      await signOut();
      
      // Show success toast
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "คุณได้ออกจากระบบแล้ว",
      });
      
      // Navigate immediately without setTimeout
      navigate("/auth", { replace: true });
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้ กำลังพาคุณไปหน้าเข้าสู่ระบบ",
        variant: "destructive",
      });
      
      // Force redirect even if signOut fails
      navigate("/auth", { replace: true });
    }
  };

  const getUserInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Simplified styling for professional look
  const getButtonStyles = () => {
    return "hover:bg-gray-50 px-3 py-2 h-auto bg-white border border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 hover:shadow-sm focus:ring-2 focus:ring-blue-500/20";
  };

  const getAvatarStyles = () => {
    return "bg-gradient-to-br from-blue-600 to-blue-700 text-white font-semibold text-sm";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={getButtonStyles()}>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={getAvatarStyles()}>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                {userData?.user?.first_name && userData?.user?.last_name 
                  ? `${userData.user.first_name} ${userData.user.last_name}`
                  : userData?.user?.first_name || userData?.user?.last_name || 'ผู้ใช้'
                }
              </span>
              <span className="text-xs text-gray-500 truncate max-w-32">
                {userData?.user?.email || user?.email || 'ไม่พบข้อมูลอีเมล'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 shadow-lg border border-gray-200">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={getAvatarStyles()}>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 min-w-0">
              <p className="text-sm font-semibold leading-none text-gray-900 truncate">
                {userData?.user?.first_name && userData?.user?.last_name 
                  ? `${userData.user.first_name} ${userData.user.last_name}`
                  : userData?.user?.first_name || userData?.user?.last_name || 'ผู้ใช้'
                }
              </p>
              <p className="text-xs leading-none text-gray-500 truncate">
                {userData?.user?.email || user?.email || "ไม่พบข้อมูลอีเมล"}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-50">
          <User className="mr-3 h-4 w-4 text-gray-500" />
          <span className="text-sm">โปรไฟล์ของฉัน</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="px-4 py-2 cursor-pointer hover:bg-gray-50">
          <Settings className="mr-3 h-4 w-4 text-gray-500" />
          <span className="text-sm">การตั้งค่า</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="px-4 py-2 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700"
          disabled={signingOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="text-sm font-medium">
            {signingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
