import { useState, useEffect, useCallback } from "react";
import { RecordedEntityApi, ScheduledEntityApi } from "../services";
import {
    CreateRecordedEntity,
    GetByUserIdRecordedEntity,
} from "../models/recordedEntity";
import useAuth from "../hooks/useAuth";
import CategoryPicker from "../components/CategoryPicker";
import { CreateScheduledEntity } from "../models/scheduledEntity";
import { TimerSubmit, timerSchema } from "../validation/timerSubmit";
import { auth } from "../services/authApi";
import { differenceInMilliseconds } from "date-fns";
import { useForm } from "react-hook-form";
import { UserRegistrationSubmit } from "../validation/registrationSubmit";
import { zodResolver } from "@hookform/resolvers/zod";

//get this to utils
export function formatTime(secondsInput: number) {
  const seconds = Math.floor(secondsInput % 60);
  const minutes = Math.floor((secondsInput / 60) % 60);
  const hours = Math.floor((secondsInput / (60 * 60)) % 24);
  const days = Math.floor(secondsInput / (60 * 60 * 24));

  const days_str = days.toString() + "days ";
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

  if (days > 0) {
    return days_str + hours_str + ":" + minutes_str + ":" + seconds_str;
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
    const [descriptionInput, setDescriptionInput] = useState<string | undefined>(undefined);
    const [frontendError, setFrontendError] = useState<string | undefined>(
        undefined
    );
    const [fromDate, setfromDate] = useState<Date>(new Date());
    const [submitedRecordedEntityId, setSubmitedRecordedEntityId] =
        useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TimerSubmit>({
        resolver: zodResolver(timerSchema),
    });


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

    useEffect(() => {
        const fetchData = async () => {
            return await RecordedEntityApi.getByUserId({ userId: auth!.data.id })
        }


        fetchData().catch().then((entity) => {
            if (entity.status === "success" && entity.data !== null) {
                const seconds = Math.ceil(differenceInMilliseconds(new Date(), entity.data.startTime) / 1000)
                setCount(seconds)
                setIsActive(true)
                setCategoryInput(entity.data.category)
                setDescriptionInput(entity.data.description)
                setSubmitedRecordedEntityId(entity.data.id)
            }
        })

    }, [])


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

    const handleSubmitMy = async () => {
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
            setFrontendError(validationResult.error.errors.at(0)?.message);
        }
    };

    const submitRecordedTimer = async (data: CreateRecordedEntity) => {
        //bad start time for some reason
        const result = await RecordedEntityApi.create(data);
        setSubmitedRecordedEntityId(result.data.id);
    };

    const submitScheduledTimer = async (data: CreateScheduledEntity) => {
        const deletedEntity = await RecordedEntityApi.deleteSingle({
            id: submitedRecordedEntityId,
        });
        const result = await ScheduledEntityApi.create(data);
    };

    const handleCategoryInputChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setCategoryInput(event.target.value);
        },
        []
    );

    return (
        <form
            onSubmit={handleSubmit(handleSubmitMy)}>
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
                <div className="my-8">
                    <input
                        type="text"
                        onChange={handleCategoryInputChange}
                        value={categoryInput}
                        className="bg-gray-900 rounded-lg h-8 text-center px-9"
                        placeholder="Category"
                    />
                </div>

                <h2 className="text-8xl">{formatTime(count)}</h2>

                <textarea
                    className="bg-gray-900 rounded-lg h-16 w-80 my-2 px-2"
                    placeholder={descriptionInput || "Enter description..."}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                ></textarea>

                <div className="flex flex-col">
                    <div>
                        {isActive ? (
                            <>
                                <button
                                    type="submit"
                                    className=" bg-gray-900 h-8 py-0 mb-4 mt-2"
                                >
                                    Submit Time
                                </button>
                                <button
                                    onClick={resetTimer}
                                    className="mx-2 bg-gray-900 h-8 py-0 mb-4 mt-2"
                                >
                                    Reset
                                </button>
                            </>)
                            :
                            (<button
                                onClick={handleStart}
                                className="mx-36 bg-gray-900 h-8 px-12 py-0 mb-4 mt-2"
                            >
                                Start
                            </button>)
                        }

                    </div>
                    <span
                        className={`${frontendError === successfulSubmitMessage
                            ? "text-green-400"
                            : "text-red-500"
                            }`}
                    >
                        {frontendError && <>{frontendError}</>}
                    </span>
                </div>
            </div>
        </form>
    );
};
