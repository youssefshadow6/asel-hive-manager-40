
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface UserButtonProps {
  language: 'en' | 'ar';
}

export const UserButton = ({ language }: UserButtonProps) => {
  const { user, signOut } = useAuth();

  const translations = {
    en: {
      signOut: "Sign Out",
      profile: "Profile"
    },
    ar: {
      signOut: "تسجيل الخروج",
      profile: "الملف الشخصي"
    }
  };

  const t = translations[language];

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
