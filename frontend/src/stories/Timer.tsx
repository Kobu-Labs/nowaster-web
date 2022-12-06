import { useState, useEffect, useCallback } from "react";

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

const SubjectInput = ({ onSave }: any) => {
  const [subjectInput, setSubjectInput] = useState<string>("");

  const handleSubjectInputChange = useCallback((event: any) => {
    setSubjectInput(event.target.value);
  }, []);

  const saveSubject = useCallback(() => {
    onSave(subjectInput);
    setSubjectInput("");
  }, [subjectInput, onSave]);

  return (
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
  );
};

export const TimerRecorded = () => {
  const [count, setCount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [savedSubject, setSavedSubject] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setCount((count) => count + 1);
      }, 1000);
    } else if (!isActive && count !== 0) {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [isActive, count]);

  const handleStart = useCallback(() => setIsActive(true), []);
  const handlePause = useCallback(() => setIsActive(false), []);
  const ResetTimer = useCallback(() => {
    setIsActive(false);
    setCount(0);
  }, []);

  const handleSubmit = useCallback(
    (event: any) => {
      alert("You have spent " + formatTime(count) + " on " + savedSubject);
      ResetTimer();
      event.preventDefault();
    },
    [count, savedSubject]
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <SubjectInput onSave={setSavedSubject} />
      <h2 className="text-xl m-2 mb-4">Subject: {savedSubject}</h2>
      <h2 className="text-3xl m-2 mb-4">{formatTime(count)}</h2>
      {isActive ? (
        <button onClick={handlePause} className="ml-4 bg-gray-900 h-8 py-0">
          Pause
        </button>
      ) : count === 0 ? (
        <button onClick={handleStart} className="ml-4 bg-gray-900 h-8 py-0">
          Start
        </button>
      ) : (
        <button onClick={handleStart} className="ml-4 bg-gray-900 h-8 py-0">
          Unpause
        </button>
      )}
      {count > 0 && !isActive && (
        <button onClick={ResetTimer} className="ml-4 bg-gray-900 h-8 py-0">
          Reset
        </button>
      )}
      <button
        className="ml-4 bg-gray-900 h-8 py-0"
        type="button"
        onClick={handleSubmit}
      >
        Submit Time
      </button>
    </div>
  );
};
