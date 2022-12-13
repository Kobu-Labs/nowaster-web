import { useRef, useState } from "react";

interface GroupsNavProps {
  setActiveGroup: (arg0: string) => void;
}

const GroupsNav = (props: GroupsNavProps) => {
  const navbarItems = Array.from(Array(1000).keys()).map(
    (index) => `Group ${index + 1}`
  );
  const [activeItem, setActiveItem] = useState(0);
  const navbarRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (index: number) => {
    setActiveItem(index);
    props.setActiveGroup(navbarItems[index]);
  };

  return (
    <nav className="flex overflow-x-auto w-full" ref={navbarRef}>
      {navbarItems.map((item, index) => (
        <button
          key={index}
          className={`m-1 mb-3 flex-shrink-0 inline-flex items-center px-4 py-2 text-sm font-medium ${
            index === activeItem ? "text-blue-600" : "text-white"
          } hover:text-blue-500 bg-gray-900`}
          onClick={() => handleItemClick(index)}
        >
          {item}
        </button>
      ))}
    </nav>
  );
};

export default GroupsNav;
