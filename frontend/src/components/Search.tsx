import { useEffect, useState } from "react";
import searchIcon from "../assets/search.svg";

interface SearchProps<T> {
  onSearchExecuted: (args: T[] | null) => void;
  executeSearch: (term: string) => T[] | null;
  placeholder: string;
}

const Search = <T,>(props: SearchProps<T>) => {
  const [searchTerm, setSearchTerm] = useState<string>();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    if (searchTerm !== undefined) {
      const data = props.executeSearch(searchTerm);
      props.onSearchExecuted(data);
    }
  }, [searchTerm]);

  return (
    <form className="flex items-center w-5/12 m-5" onSubmit={handleFormSubmit}>
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <img
            src={searchIcon}
            alt="Search Icon"
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
          />
        </div>
        <input
          type="text"
          id="search"
          className="bg-gray-900 text-white text-sm rounded-lg block w-full pl-10 p-2.5"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={props.placeholder}
        />
      </div>
    </form>
  );
};

export default Search;
