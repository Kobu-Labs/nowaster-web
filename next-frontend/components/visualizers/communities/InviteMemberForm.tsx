"use client";

import { Button } from "@/components/shadcn/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/shadcn/form";
import { Input } from "@/components/shadcn/input";
import { useSendDirectInvite } from "@/components/hooks/community/useSendDirectInvite";
import { cn } from "@/lib/utils";
import type { InviteMemberFormValues } from "@/validation/invite-member";
import { inviteMemberSchema } from "@/validation/invite-member";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import type { FC } from "react";
import { useForm } from "react-hook-form";

type InviteMemberFormProps = {
  communityId: string;
};

export const InviteMemberForm: FC<InviteMemberFormProps> = ({ communityId }) => {
  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
  });
  const sendInvite = useSendDirectInvite(communityId);

  const onSubmit = async (data: InviteMemberFormValues) => {
    await sendInvite.mutateAsync(data.username);
    form.reset();
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col sm:flex-row gap-2 w-full"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input
                  {...field}
                  className={cn(
                    "h-9",
                    sendInvite.isError
                    && "border-destructive focus-visible:ring-destructive",
                  )}
                  placeholder="Enter username"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="h-9" loading={sendInvite.isPending} size="sm" type="submit">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite member
        </Button>
      </form>
    </Form>
  );
};
