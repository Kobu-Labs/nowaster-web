"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { ScheduledSessionCreationForm } from "./form/ScheduledSessionCreationForm";
import type { FC } from "react";

type LogSessionDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  precursor?: {
    project?: { id: string; } | null;
    task?: { id: string; } | null;
  };
  title?: string;
};

export const LogSessionDialog: FC<LogSessionDialogProps> = ({
  onOpenChange,
  open,
  precursor,
  title = "Log Session",
}) => {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[90vw] px-0 pb-0 max-w-[90vw] overflow-y-auto md:w-fit md:max-w-fit md:h-auto md:max-h-none md:overflow-visible md:p-6 gradient-card-solid rounded-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScheduledSessionCreationForm
          onClose={() => onOpenChange(false)}
          onCreateAndClose={() => onOpenChange(false)}
          precursor={precursor}
        />
      </DialogContent>
    </Dialog>
  );
};
