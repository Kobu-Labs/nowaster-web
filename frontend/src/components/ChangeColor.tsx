import { SetStateAction, useState } from "react";
import { GraphDataSingle } from "../pages/StatsPage";

export const ChangeColor: React.FC<{
  pieGraphProps: GraphDataSingle[];
  setFilteredData: (data: GraphDataSingle[]) => void;
}> = ({ pieGraphProps, setFilteredData }) => {
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

  const handleSubmit = () => {
    const toChange = pieGraphProps.filter((x) => x.name === subject)[0];
    toChange.fill = color;
    console.log(toChange);
    const result = pieGraphProps.filter((x) => x.name !== subject);
    result.push(toChange);

    setFilteredData(result);
  };

  return (
    <div className="bg-gray-800 rounded-lg">
      <h2 className="text-xl m-2 mb-4 text-center">Manage Colours</h2>
      <form className="flex flex-col items-center">
        <div className="flex items-center">
          {/*<label htmlFor="colorPicker">Change color</label>*/}
          <input
            type="color"
            id="colorPicker"
            value={color}
            onChange={handleColorChange}
            className="ml-2 h-8 w-16 rounded-lg"
          />
          {/*<label htmlFor="subjectInput" className="ml-2"> for subject</label>*/}
          <input
            type="text"
            id="subjectInput"
            value={subject}
            placeholder="Enter subject"
            onChange={handleSubjectChange}
            className="ml-4 bg-gray-900 rounded-lg h-8 text-center"
          />
        </div>
        <button
          onClick={handleSubmit}
          type="button"
          className="m-4 bg-gray-900 h-8 py-0"
        >
          Change Color
        </button>
      </form>
    </div>
  );
};
