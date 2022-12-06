import { useState } from "react";

interface User {
  id: string;
  name: string;
}

interface GroupDetailsProps {
  groupId: string;
  groupName: string;
}

const GroupDetails = (props: GroupDetailsProps) => {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "User 1" },
    { id: "2", name: "User 2" },
    { id: "3", name: "User 3" },
    { id: "4", name: "User 4" },
    { id: "5", name: "User 5" },
    { id: "6", name: "User 6" },
    { id: "7", name: "User 7" },
    { id: "8", name: "User 8" },
    { id: "9", name: "User 9" },
    { id: "10", name: "User 10" },
    { id: "11", name: "User 11" },
    { id: "12", name: "User 12" },
  ]);

  const kickUser = (userId: string) => {
    // Implement kicking functionality here
  };

  const deleteGroup = (groupId: string) => {
    // Implement delete group functionality here
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h1 className="m-4">{props.groupName}</h1>
      <div className="overflow-y-auto max-h-96 bg-gray-900 rounded-lg p-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between px-4 py-2 w-64"
          >
            <span>{user.name}</span>
            <button
              onClick={() => kickUser(user.id)}
              className="px-2 py-1 text-sm font-medium text-red-500 hover:text-red-700 bg-gray-950 rounded-lg"
            >
              Kick
            </button>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 rounded-lg mt-4 p-4">
        <h2 className="text-xl m-2">Manage Group Settings</h2>
        <div className="px-4 py-2 flex flex-col">
          <div>
            <label htmlFor="invite-only" className="m-4">
              Invite Only
            </label>
            <input type="checkbox" id="invite-only"></input>
          </div>

          <button
            onClick={() => deleteGroup(props.groupId)}
            className="py-1 text-sm font-medium text-red-500 hover:text-red-700 mt-2 bg-gray-950 rounded-lg"
          >
            Delete group
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
