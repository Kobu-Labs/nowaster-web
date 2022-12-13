import React from "react";
import searchIcon from "../assets/search.svg";

const SearchBar = () => {
  return (
    <form className="flex items-center w-5/12 m-5">
      <label htmlFor="search" className="sr-only">
        Search Group
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
          placeholder="Search Group"
          required
        />
      </div>
      <button
        type="button"
        className="p-2.5 ml-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-950 focus:ring-4 focus:outline-none focus:gray-900"
      >
        <img src={searchIcon} alt="Search Icon" className="w-5 h-5" />
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
};

export default SearchBar;
