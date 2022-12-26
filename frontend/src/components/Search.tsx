import { useState } from "react";
import searchIcon from "../assets/search.svg";
import useDebounce from "../hooks/useDebounce";


const debounceDelay = 500;

interface SearchProps<T> {
    onSearchExecuted: (args: T[] | null) => void
    executeSearch: (term: string) => T[] | null
}

const Search = <T,>(props: SearchProps<T>) => {
    const [searchTerm, setSearchTerm] = useState<string>()
    const debouncedValue = useDebounce(searchTerm, debounceDelay)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const data = props.executeSearch(debouncedValue);
        props.onSearchExecuted(data)
    }

    return (
            <form className="flex items-center w-5/12 m-5" onSubmit={(e) => handleSubmit(e)}>
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
                        onChange={(e) => setSearchTerm(e.target.value)}
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
}

export default Search
