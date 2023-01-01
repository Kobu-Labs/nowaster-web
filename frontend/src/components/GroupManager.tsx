import Search from "./Search";
import { useState } from "react";

interface Group {
  id: number;
  name: string;
}

const groups: Group[] = [
  { id: 1, name: "Group 1" },
  { id: 2, name: "Group 2" },
  { id: 3, name: "Group 3" },
  { id: 4, name: "Group 4" },
  { id: 5, name: "Group 5" },
  { id: 6, name: "Group 6" },
  { id: 7, name: "Group 7" },
  { id: 8, name: "Group 8" },
];

const deleteGroup = (groupId: number) => {
  console.log(`Deleting group ${groupId}`);
  // Implement delete logic here
};

const GroupManager = () => {
  const [searchResults, setSearchResults] = useState<Group[]>(groups);

  const executeSearch = (term: string): Group[] | null => {
    if (!term || term === "") {
      return groups;
    }

    const filteredData = groups.filter((item) =>
      item.name.toLowerCase().includes(term.toLowerCase())
    );
    return filteredData;
  };

  const onSearchExecuted = (data: Group[] | null): void => {
    setSearchResults(data || []);
  };

  return (
    <>
      <Search<Group>
        executeSearch={executeSearch}
        onSearchExecuted={onSearchExecuted}
        placeholder="Search Group"
      />
      <div className="max-h-64 overflow-y-auto">
        <ul className="space-y-2">
          {searchResults.map((group) => (
            <li
              key={group.id}
              className="flex items-center justify-between p-2 px-4 rounded-lg"
            >
              <span className="w-64 text-left">{group.name}</span>
              <div>
                <button
                  className="px-2 py-1 mr-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                  onClick={() => deleteGroup(group.id)}
                >
                  Delete
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

export default GroupManager;
