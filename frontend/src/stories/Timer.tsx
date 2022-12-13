import { useState, useEffect, useCallback } from "react";
import { RecordedEntityApi, ScheduledEntityApi } from "../services";
import {
  CreateRecordedEntity,
  GetByUserIdRecordedEntity,
} from "../models/recordedEntity";
import useAuth from "../hooks/useAuth";
import CategoryPicker from "../components/CategoryPicker";
import { CreateScheduledEntity } from "../models/scheduledEntity";
import { timerSchema } from "../validation/timerSubmit";

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

function calculateToDate(fromDate: Date, secondsCount: number) {
  const toDate = new Date(fromDate.getTime());
  toDate.setSeconds(fromDate.getSeconds() + secondsCount);
  return toDate;
}

const successfulSubmitMessage = "Time submited successfuly";

export const TimerRecorded = () => {
  const { auth } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [frontendError, setFrontendError] = useState<string | undefined>(
    undefined
  );
  const [fromDate, setfromDate] = useState<Date>(new Date());
  const [submitedRecordedEntityId, setSubmitedRecordedEntityId] =
    useState<string>("");

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

  const handleDescriptionInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescriptionInput(event.target.value);
  };

  const handleStart = async () => {
    const currentDate = new Date();
    setfromDate(currentDate);
    setIsActive(true);
    setFrontendError(undefined);

    const data = {
      userId: auth!.data.id,
      category: categoryInput,
      description: descriptionInput,
      startTime: currentDate,
    };
    submitRecordedTimer(data);
  };

  const resetTimer = async () => {
    setIsActive(false);
    setCount(0);
  };

  const handleSubmit = async () => {
    const data = {
      userId: auth!.data.id,
      category: categoryInput,
      description: descriptionInput,
      startTime: fromDate,
      endTime: calculateToDate(fromDate, count),
    };

    const validationResult = timerSchema.safeParse(data);

    if (validationResult.success) {
      submitScheduledTimer(data);
      setFrontendError(successfulSubmitMessage);
      resetTimer();
    } else {
      console.log(validationResult.error.errors.at(0)?.message);
      setFrontendError(validationResult.error.errors.at(0)?.message);
    }
  };

  const handleStop = useCallback(() => setIsActive(false), []);

  const submitRecordedTimer = async (data: CreateRecordedEntity) => {
    //bad start time for some reason
    const result = await RecordedEntityApi.create(data);
    setSubmitedRecordedEntityId(result.data.value.id);
    console.log(result);
  };

  const submitScheduledTimer = async (data: CreateScheduledEntity) => {
    const deletedEntity = await RecordedEntityApi.deleteSingle({
      id: submitedRecordedEntityId,
    });
    const result = await ScheduledEntityApi.create(data);
    console.log(result);
  };

  const handleCategoryInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCategoryInput(event.target.value);
    },
    []
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
      <CategoryPicker
        handleCategoryInputChange={handleCategoryInputChange}
        categoryInput={categoryInput}
      />

      <h2 className="text-8xl">{formatTime(count)}</h2>

      <textarea
        className="bg-gray-900 rounded-lg h-16 w-80 my-2 px-2"
        placeholder="Enter description..."
        onChange={handleDescriptionInputChange}
      ></textarea>

      <div className="flex flex-col">
        <div>
          {count > 0 && (
            <button
              onClick={handleSubmit}
              className=" bg-gray-900 h-8 py-0 mb-4 mt-2"
            >
              Submit Time
            </button>
          )}
          {isActive ? (
            <button
              onClick={handleStop}
              className="mx-2 bg-gray-900 h-8 py-0 mb-4 mt-2"
            >
              Stop
            </button>
          ) : count === 0 ? (
            <button
              onClick={handleStart}
              className="mx-36 bg-gray-900 h-8 px-12 py-0 mb-4 mt-2"
            >
              Start
            </button>
          ) : (
            <></>
          )}
          {count > 0 && (
            <button
              onClick={resetTimer}
              className="mx-2 bg-gray-900 h-8 py-0 mb-4 mt-2"
            >
              Reset
            </button>
          )}
        </div>
        <span
          className={`${
            frontendError === successfulSubmitMessage
              ? "text-green-400"
              : "text-red-500"
          }`}
        >
          {frontendError && <>{frontendError}</>}
        </span>
      </div>
    </div>
  );
};
