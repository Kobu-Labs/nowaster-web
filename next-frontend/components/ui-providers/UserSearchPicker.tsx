"use client";

import type { User } from "@/api/definitions/models/user";
import { useSearchUsers } from "@/components/hooks/useSearchUsers";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { Button } from "@/components/shadcn/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/shadcn/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { ChevronsUpDown, X } from "lucide-react";
import { type FC, useState } from "react";

export type UserSearchPickerProps = {
  className?: string;
  disabled?: boolean;
  onClear: () => void;
  onSelectUser: (user: User) => void;
  placeholder?: string;
  selectedUser: null | User;
};

export const UserSearchPicker: FC<UserSearchPickerProps> = ({
  className,
  disabled,
  onClear,
  onSelectUser,
  placeholder = "Search by username or user ID...",
  selectedUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, searchQuery, setSearchQuery, users } = useSearchUsers();

  if (selectedUser) {
    return (
      <div
        className={`flex max-w-xs items-center gap-2 rounded-md border px-2 py-1.5 ${className ?? ""}`}
      >
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={selectedUser.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xs">
            {selectedUser.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">
          {selectedUser.username}
        </span>
        <Button
          className="ml-auto h-5 w-5 shrink-0"
          disabled={disabled}
          onClick={onClear}
          size="icon"
          variant="ghost"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Popover
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) {
          setSearchQuery("");
        }
        setIsOpen(shouldOpen);
      }}
      open={isOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={isOpen}
          className={`max-w-xs justify-start font-normal text-muted-foreground ${className ?? ""}`}
          disabled={disabled}
          role="combobox"
          variant="outline"
        >
          <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            onValueChange={setSearchQuery}
            placeholder={placeholder}
            value={searchQuery}
          />
          {isLoading && (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}
          {!isLoading
            && searchQuery.trim().length > 0
            && users.length === 0 && <CommandEmpty>No users found.</CommandEmpty>}
          {!isLoading && users.length > 0 && (
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => {
                    onSelectUser(user);
                    setIsOpen(false);
                  }}
                  value={user.id}
                >
                  <Avatar className="mr-2 h-5 w-5 shrink-0">
                    <AvatarImage src={user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{user.username}</span>
                  <span className="ml-auto shrink-0 truncate text-xs text-muted-foreground">
                    {user.id.slice(0, 8)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};
