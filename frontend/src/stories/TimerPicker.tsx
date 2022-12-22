import React, { useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ScheduledEntityApi } from "../services";
import { CreateScheduledEntity } from "../models/scheduledEntity";
import useAuth from "../hooks/useAuth";
import { timerScheduledSchema } from "../validation/timerScheduledSubmit";

function calculateDate(
  date: Date,
  hours: number,
  minutes: number,
  seconds: number
) {
  const newDate = date;

  newDate.setHours(hours);
  newDate.setMinutes(minutes);
  newDate.setSeconds(seconds);

  return newDate;
}

const successfulSubmitMessage = "Time submited successfuly";

export const TimerScheduled: React.FC = () => {
  const { auth } = useAuth();
  const [fromDate, setfromDate] = useState<Date>(new Date());
  const [fromHours, setFromHours] = useState(0);
  const [fromMinutes, setFromMinutes] = useState(0);
  const [toDate, settoDate] = useState<Date>(new Date());
  const [toHours, setToHours] = useState(0);
  const [toMinutes, setToMinutes] = useState(0);
  const [subjectInput, setSubjectInput] = useState<string>("");
  const [descriptionInput, setDescriptionInput] = useState<string>("");
  const [frontendError, setFrontendError] = useState<string | undefined>(
    undefined
  );

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

  const handleDescriptionInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setDescriptionInput(event.target.value);
  };

  const handleButtonClick = async () => {
    const userId = auth!.data.id;
    const description = descriptionInput;
    const startTime = calculateDate(fromDate, fromHours, fromMinutes, 0);
    const endTime = calculateDate(toDate, toHours, toMinutes, 0);

    const formData = {
      startTime,
      endTime,
      category: subjectInput,
      description,
      userId,
    };

    const validationResult = timerScheduledSchema.safeParse(formData);

    if (validationResult.success) {
      submitScheduledTimer(formData);
      setFrontendError(successfulSubmitMessage);
    } else {
      console.log("WRONG DATA");
      console.log(validationResult.error.errors.at(0)?.message);
      setFrontendError(validationResult.error.errors.at(0)?.message);
    }
  };

  const submitScheduledTimer = async (data: CreateScheduledEntity) => {
    const result = await ScheduledEntityApi.create(data);
    console.log(result);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
      <div className="my-8">
        <input
          type="text"
          onChange={handleSubjectInputChange}
          value={subjectInput}
          className="bg-gray-900 rounded-lg h-8 text-center px-9"
          placeholder="Category"
        />
      </div>
      <div className="flex items-center">
        <span className="m-2">From:</span>
        <DatePicker
          selected={fromDate}
          onChange={(date) => setfromDate(date ? date : new Date())}
          className="ml-4 bg-gray-900 rounded-lg h-8 text-center"
        />
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
      </div>
      <div className="flex items-center">
        <span className="m-2 ml-7">To:</span>
        <DatePicker
          selected={toDate}
          onChange={(date) => settoDate(date ? date : new Date())}
          className="ml-4 bg-gray-900 rounded-lg h-8 text-center"
        />
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
      </div>
      <textarea
        className="bg-gray-900 rounded-lg h-16 w-80 my-2 px-2"
        placeholder="Enter description..."
        onChange={handleDescriptionInputChange}
      ></textarea>

      <div className="flex flex-col">
        <button
          onClick={handleButtonClick}
          className="mx-36 bg-gray-900 h-8 py-0 mb-4 mt-2"
        >
          Submit Time
        </button>
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
