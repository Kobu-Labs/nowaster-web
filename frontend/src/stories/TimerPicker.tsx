import React, { useState, useCallback } from "react";

function formatTime(secondsInput: number) {
  const hours = Math.floor(secondsInput / 3600);
  const minutes = Math.floor((secondsInput - hours * 3600) / 60);
  const seconds = secondsInput - hours * 3600 - minutes * 60;

  let hours_str = hours.toString();
  let minutes_str = minutes.toString();
  let seconds_str = seconds.toString();

  if (hours < 10) {
    hours_str = "0" + hours_str;
  }
  if (minutes < 10) {
    minutes_str = "0" + minutes_str;
  }
  if (seconds < 10) {
    seconds_str = "0" + seconds_str;
  }
  if (hours > 0) {
    return hours_str + ":" + minutes_str + ":" + seconds_str;
  }
  return minutes_str + ":" + seconds_str;
}

export const TimerScheduled: React.FC = () => {
  const [fromHours, setFromHours] = useState(0);
  const [fromMinutes, setFromMinutes] = useState(0);
  const [toHours, setToHours] = useState(0);
  const [toMinutes, setToMinutes] = useState(0);
  const [subjectInput, setSubjectInput] = useState<string>("");
  const [savedSubject, setSavedSubject] = useState<string>("");

  const handleFromHoursChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFromHours(parseInt(event.target.value));
  };

  const handleFromMinutesChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setFromMinutes(parseInt(event.target.value));
  };

  const handleToHoursChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setToHours(parseInt(event.target.value));
  };

  const handleToMinutesChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setToMinutes(parseInt(event.target.value));
  };

  const handleSubjectInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSubjectInput(event.target.value);
    },
    []
  );

  const saveSubject = useCallback(() => {
    setSavedSubject(subjectInput);
    setSubjectInput("");
  }, [subjectInput]);

  const handleButtonClick = () => {
    alert(
      `Subject: ${savedSubject}, From time: ${formatTime(
        fromHours * 60 + fromMinutes
      )}, To time: ${formatTime(toHours * 60 + toMinutes)}`
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div>
        <label>
          Pick subject:
          <input
            type="text"
            onChange={handleSubjectInputChange}
            value={subjectInput}
            className="ml-4 bg-gray-900 rounded-lg h-8 text-center"
          />
        </label>
        <button onClick={saveSubject} className="ml-4 bg-gray-900 h-8 py-0">
          Save
        </button>
      </div>
      <h2 className="text-xl m-2 mb-4">Subject: {savedSubject}</h2>
      <span className="text-xl m-2 mb-4">From:</span>
      <select
        value={fromHours}
        onChange={handleFromHoursChange}
        className="m-2 bg-gray-900 h-8 px-2 rounded-lg"
      >
        {Array.from({ length: 24 }, (_, i) => i).map((value) => (
          <option key={value} value={value}>
            {value.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      :
      <select
        value={fromMinutes}
        onChange={handleFromMinutesChange}
        className="m-2 bg-gray-900 h-8 px-2 rounded-lg"
      >
        {Array.from({ length: 60 }, (_, i) => i).map((value) => (
          <option key={value} value={value}>
            {value.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      <span className="text-xl m-2 mb-4">To:</span>
      <select
        value={toHours}
        onChange={handleToHoursChange}
        className="m-2 bg-gray-900 h-8 px-2 rounded-lg"
      >
        {Array.from({ length: 24 }, (_, i) => i).map((value) => (
          <option key={value} value={value}>
            {value.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      :
      <select
        value={toMinutes}
        onChange={handleToMinutesChange}
        className="m-2 bg-gray-900 h-8 px-2 rounded-lg"
      >
        {Array.from({ length: 60 }, (_, i) => i).map((value) => (
          <option key={value} value={value}>
            {value.toString().padStart(2, "0")}
          </option>
        ))}
      </select>
      <br className="mb-4"></br>
      <button onClick={handleButtonClick} className="ml-4 bg-gray-900 h-8 py-0">
        Submit Time
      </button>
    </div>
  );
};
