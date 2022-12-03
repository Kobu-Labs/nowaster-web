import { SetStateAction, useState } from "react";

export const ChangeColor = () => {
  const [color, setColor] = useState("#234252");
  const [subject, setSubject] = useState("");

  const handleColorChange = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    setColor(e.target.value);
  };

  const handleSubjectChange = (e: {
    target: { value: SetStateAction<string> };
  }) => {
    setSubject(e.target.value);
  };

  return (
    <div className="flex items-center">
      <p className="text-xl"> Choose wanted color </p>
      <input
        type="color"
        value={color}
        onChange={handleColorChange}
        className="ml-4 h-8 w-16"
      />
      <input
        type="text"
        value={subject}
        onChange={handleSubjectChange}
        className="ml-4"
      />
      <button className="ml-4"> Change </button>
    </div>
  );
};
