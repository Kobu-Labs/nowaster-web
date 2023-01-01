import Search from "./Search";
import { useState } from "react";

interface User {
  id: number;
  name: string;
}

const data: User[] = [
  { id: 1, name: "John 123456" },
  { id: 2, name: "Jane" },
  { id: 3, name: "Alice" },
  { id: 4, name: "Bob" },
  { id: 5, name: "John" },
  { id: 6, name: "Jane" },
  { id: 7, name: "Alice" },
  { id: 8, name: "Bob" },
];

const kickUser = (userId: number) => {
  console.log(`Kicking user ${userId}`);
  // Implement kick logic here
};

const banUser = (userId: number, duration: string) => {
  console.log(`Banning user ${userId} for ${duration}`);
  // Implement ban logic here
};

const permabanUser = (userId: number) => {
  console.log(`Permanently banning user ${userId}`);
  // Implement permaban logic here
};

const UserManager = () => {
  const [searchResults, setSearchResults] = useState<User[]>(data);

  const executeSearch = (term: string): User[] | null => {
    if (!term || term == "") {
      return data;
    }

    const filteredData = data.filter((item) =>
      item.name.toLowerCase().includes(term.toLowerCase())
    );
    return filteredData;
  };

  const onSearchExecuted = (data: User[] | null): void => {
    setSearchResults(data || []);
  };

  return (
    <>
      <Search<User>
        executeSearch={executeSearch}
        onSearchExecuted={onSearchExecuted}
        placeholder="Search User"
      />
      <div className="max-h-64 overflow-y-auto">
        <ul className="space-y-2">
          {searchResults.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between p-2 px-4 rounded-lg"
            >
              <span className="w-64 text-left">{user.name}</span>
              <div>
                <button
                  className="px-2 py-1 mr-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                  onClick={() => kickUser(user.id)}
                >
                  Kick
                </button>
                <button
                  className="px-2 py-1 mr-2 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600"
                  onClick={() => banUser(user.id, "1 day")}
                >
                  Ban (1 day)
                </button>
                <button
                  className="px-2 py-1 text-sm text-white bg-red-800 rounded hover:bg-red-900"
                  onClick={() => permabanUser(user.id)}
                >
                  Permaban
                </button>
              </div>
            </li>
          ))}
          <li className="w-96 mx-20"></li>
        </ul>
      </div>
    </>
  );
};

export default UserManager;
