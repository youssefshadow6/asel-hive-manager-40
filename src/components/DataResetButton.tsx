
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDataReset } from "@/hooks/useDataReset";

interface DataResetButtonProps {
  language: 'en' | 'ar';
}

export const DataResetButton = ({ language }: DataResetButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { resetAllData, loading } = useDataReset();

  const translations = {
    en: {
      resetAllData: "Reset All Data",
      adminAccess: "Admin Access Required",
      enterPassword: "Enter admin password to confirm reset:",
      password: "Password",
      cancel: "Cancel",
      reset: "Reset All Data",
      warning: "⚠️ WARNING: This will permanently delete ALL data including products, materials, sales, customers, and suppliers. This action cannot be undone!",
      finalConfirmation: "Are you absolutely sure you want to delete everything?",
      confirmReset: "Yes, Reset Everything"
    },
    ar: {
      resetAllData: "إعادة تعيين جميع البيانات",
      adminAccess: "مطلوب وصول المشرف",
      enterPassword: "أدخل كلمة مرور المشرف لتأكيد إعادة التعيين:",
      password: "كلمة المرور",
      cancel: "إلغاء",
      reset: "إعادة تعيين جميع البيانات",
      warning: "⚠️ تحذير: سيؤدي هذا إلى حذف جميع البيانات نهائياً بما في ذلك المنتجات والمواد والمبيعات والعملاء والموردين. لا يمكن التراجع عن هذا الإجراء!",
      finalConfirmation: "هل أنت متأكد تماماً من رغبتك في حذف كل شيء؟",
      confirmReset: "نعم، احذف كل شيء"
    }
  };

  const t = translations[language];

  const handleReset = async () => {
    if (!password.trim()) return;

    const result = await resetAllData(password);
    if (result.success) {
      setPassword('');
      setShowDialog(false);
      setShowConfirmation(false);
      // Refresh the page to show empty data
      window.location.reload();
    }
  };

  const handlePasswordSubmit = () => {
    if (password.trim()) {
      setShowConfirmation(true);
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {t.resetAllData}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t.adminAccess}
          </DialogTitle>
        </DialogHeader>
        
        {!showConfirmation ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{t.warning}</p>
            </div>
            
            <div>
              <Label htmlFor="admin-password">{t.enterPassword}</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.password}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDialog(false);
                  setPassword('');
                }}
              >
                {t.cancel}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handlePasswordSubmit}
                disabled={!password.trim()}
              >
                {t.reset}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800 font-medium">{t.finalConfirmation}</p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowConfirmation(false);
                  setPassword('');
                }}
              >
                {t.cancel}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReset}
                disabled={loading}
              >
                {loading ? "..." : t.confirmReset}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
