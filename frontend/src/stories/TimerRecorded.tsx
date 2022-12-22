import { useState, useEffect } from "react";
import { RecordedEntityApi, ScheduledEntityApi } from "../services";
import useAuth from "../hooks/useAuth";
import { differenceInMilliseconds } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TimerRecordedFormSubmit, timerRecordedFormSchema } from "../validation/timerRecordedSubmit";

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

type UserMessage = { error?: string, success?: string }

export const TimerRecorded = () => {
  const { auth } = useAuth();
  const [secondsMeasured, setSecondsMeasured] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [userMessage, setUserMessage] = useState<UserMessage>({});

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TimerRecordedFormSubmit>({
    resolver: zodResolver(timerRecordedFormSchema),
  });


  // keeps the timer ticking
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSecondsMeasured((count) => count + 1);
      }, 1000);
    } else if (!isActive && secondsMeasured !== 0) {
      clearInterval(interval!);
    }

    return () => clearInterval(interval!);
  }, [isActive, secondsMeasured]);

  // checks if there are any recorded entities active
  useEffect(() => {
    const fetchData = async () => {
      return await RecordedEntityApi.getByUserId({ userId: auth!.data.id })
    }
    fetchData().catch().then((entity) => {
      if (entity.status === "success" && entity.data !== null) {
        const seconds = Math.ceil(differenceInMilliseconds(new Date(), entity.data.startTime) / 1000)
        setSecondsMeasured(seconds)
        setIsActive(true)
        setValue("description", entity.data.description)
        setValue("category", entity.data.category)
      }
    })
  }, [])

  const startTimer = async () => {
    setIsActive(true);

    const data = {
      userId: auth!.data.id,
      category: getValues("category"),
      description: getValues("description"),
      startTime: new Date(),
    };
    const result = await RecordedEntityApi.create(data);
    if (result.status === "error") {
      setUserMessage({ error: result.message })
    } else {
      setUserMessage({ success: "Timer started!" })
    }
  };

  const resetTimer = async () => {
    setIsActive(false);
    const activeEntity = await RecordedEntityApi.getByUserId({ userId: auth!.data.id })
    if (activeEntity.status === "error" || activeEntity.data === null) {
      return
    }
    await RecordedEntityApi.deleteSingle({ id: activeEntity.data.id })
    setSecondsMeasured(0);
  };

  const finishTimer = async () => {
    const result = await RecordedEntityApi.finishCurrent({ userId: auth!.data.id })
    if (result.status === "error" || result.data === null) {
      setUserMessage({ error: result.message })
      return
    }

    if (result.data?.description !== getValues("description")) {
      const updateResult = await ScheduledEntityApi.update({ id: result.data.id, description: getValues("description") })
      if (updateResult.status === "error") {
        setUserMessage({ error: updateResult.message })
        return
      }
    }
    setUserMessage({ success: "Study session was submitted!" })
    resetTimer();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
      <form
        onSubmit={handleSubmit(startTimer)}>
        <div className="my-8">
          <input
            type="text"
            {...register("category")}
            className="bg-gray-900 rounded-lg h-8 text-center px-9"
            placeholder="Category"
          />
        </div>
        <span className="text-red-500">
          {errors.category && <>{errors.category.message}</>}
        </span>

        <h2 className="text-8xl">{formatTime(secondsMeasured)}</h2>

        <textarea
          className="bg-gray-900 rounded-lg h-16 w-80 my-2 px-2"
          placeholder="Enter description..."
          {...register("description")}
        ></textarea>
        <span className="text-red-500">
          {errors.description && <>{errors.description.message}</>}
        </span>


        <div className="flex flex-col">
          <div>
            {isActive ? (
              <>
                <button
                  className=" bg-gray-900 h-8 py-0 mb-4 mt-2"
                  type="button"
                  onClick={finishTimer}
                >
                                    Finish
                </button>
                <button
                  onClick={resetTimer}
                  type="button"
                  className="mx-2 bg-gray-900 h-8 py-0 mb-4 mt-2"
                >
                                    Reset
                </button>
              </>)
              :
              (<button
                type="submit"
                /* onClick={startTimer} */
                className="mx-36 bg-gray-900 h-8 px-12 py-0 mb-4 mt-2"
              >
                                Start
              </button>)
            }
          </div>
        </div>
        <span className={userMessage.success
          ? "text-green-400"
          : "text-red-500"}>
          {userMessage.success || userMessage.error || ""}
        </span>
      </form>
    </div>
  );
};
