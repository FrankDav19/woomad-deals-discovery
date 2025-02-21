
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useSession } from "./providers/SessionProvider";
import { AuthModal } from "./auth/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, LogOut, Star, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

export const Header = () => {
  const { t } = useTranslation();
  const { session } = useSession();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="bg-gradient-to-r from-purple-500/80 to-blue-500/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-white font-bold text-xl">
              WooMap
            </Link>

            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 text-white hover:text-white/90 transition-colors">
                    <User className="h-4 w-4" />
                    <span>{session.user.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>
                      <Star className="mr-2 h-4 w-4" />
                      <span>Promotions</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <AuthModal />
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

