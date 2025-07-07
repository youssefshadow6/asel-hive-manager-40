
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  language: 'en' | 'ar';
  loading?: boolean;
}

export const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  language,
  loading = false
}: DeleteConfirmDialogProps) => {
  const translations = {
    en: {
      cancel: "Cancel",
      delete: "Delete",
      confirmDelete: "Confirm Delete"
    },
    ar: {
      cancel: "إلغاء",
      delete: "حذف",
      confirmDelete: "تأكيد الحذف"
    }
  };

  const t = translations[language];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            {t.confirmDelete}
          </DialogTitle>
          <DialogDescription>
            <strong>{title}</strong>
            <br />
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t.cancel}
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "..." : t.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
