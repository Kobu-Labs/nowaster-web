import { useQuery } from "@tanstack/react-query";
import { User } from "../models/user";
import { BanApi, UserApi } from "../services";
import Search from "./Search";
import { useState } from "react";
import useAuth from "../hooks/useAuth";

const getTommorow = () => {
  const tomorrow = new Date();
  // Set date to current date plus 1 day
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
};

const UserManager = () => {
  const { auth } = useAuth();
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const { data: values} = useQuery({
    queryKey: ["users"],
    retry: false,
    queryFn: async () => {
      const result = await UserApi.getAll();
      if (result.status === "error") {
        return [];
      }
      return result.data.filter((user) => auth!.data.id != user.id);
    },
    onSuccess:(data) =>  setSearchResults(data),
  });


  const executeSearch = (term: string): User[] | null => {
    if (values === undefined) {
      return [];
    }

    if (!term || term == "") {
      return values;
    }

    const filteredusers = values.filter((user) =>
      user.username.toLowerCase().includes(term.toLowerCase())
    );
    return filteredusers;
  };

  const onSearchExecuted = (users: User[] | null): void => {
    setSearchResults(users || []);
  };

  const banUser = async (userId: string, endTime: Date | null) => {
    console.log(`Banning user ${userId} for ${endTime?.getTime()}`);
    await BanApi.create({ userId, endTime });
  };

  console.log(searchResults);
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
              <span className="w-64 text-left">{user.username}</span>
              <div>
                <button
                  className="px-2 py-1 mr-2 text-sm text-white bg-yellow-500 rounded hover:bg-yellow-600"
                  onClick={() => banUser(user.id, getTommorow())}
                >
                  Ban (1 day)
                </button>
                <button
                  className="px-2 py-1 text-sm text-white bg-red-800 rounded hover:bg-red-900"
                  onClick={() => banUser(user.id, null)}
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
