import React, { useState } from "react";
import { GroupSchema } from "../validation/groupSubmit";
import { GroupApi } from "../services";
import useAuth from "../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const GroupCreator: React.FC = () => {
  const [name, setName] = useState("");
  const [isInviteOnly, setIsInviteOnly] = useState(false);
  const [error, setError] = useState("");
  const { auth } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["groups", auth!.data.id] });

    const validation = GroupSchema.safeParse({ name, isInviteOnly });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }

    // Perform API call
    GroupApi.createGroup({
      creatorId: auth!.data.id,
      groupName: name,
      inviteOnly: isInviteOnly,
    });

    setName("");
    setIsInviteOnly(false);
    setError("");
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-gray-900 p-8 rounded-lg w-96 h-72">
      <h1 className="text-xl font-bold mb-4">Create Group</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1">
            Group Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isInviteOnly"
            checked={isInviteOnly}
            onChange={(e) => setIsInviteOnly(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="isInviteOnly">Invite Only</label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
        >
          Create
        </button>
      </form>
      {error && <p className="text-red-500 mb-2">{error}</p>}
    </div>
  );
};

export default GroupCreator;
