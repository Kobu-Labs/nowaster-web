import { FC, useState } from "react";
import Navbar from "../components/Navbar";
import { TimerRecorded } from "../stories/Timer";
import { TimerScheduled } from "../stories/TimerPicker";

export const TimerPage: FC = () => {
  const scheduledDisplayString = "Scheduled";
  const recordedDisplayString = "Recorded";
  const [activeTimer, setActiveTimer] = useState(scheduledDisplayString);

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen overflow-y-auto">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto flex items-center justify-center flex-col h-screen">
        <div className="ml-48 mb-10">
          <div className="text-sm font-medium text-center border-b text-gray-200 border-gray-700">
            <ul className="flex flex-wrap -mb-px mx-28">
              <li className="mr-2">
                <button
                  onClick={() => setActiveTimer(scheduledDisplayString)}
                  className={`inline-block p-4 border-b-2 ${
                    activeTimer === scheduledDisplayString
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-blue-600"
                  } rounded-t-lg hover:border-0 transition-none border-0`}
                >
                  Scheduled Timer
                </button>
              </li>
              <li className="mr-2">
                <button
                  onClick={() => setActiveTimer(recordedDisplayString)}
                  className={`inline-block p-4 border-b-2 ${
                    activeTimer === recordedDisplayString
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-blue-600"
                  } rounded-t-lg hover:border-0 transition-none border-le border-0`}
                >
                  Recorded Timer
                </button>
              </li>
            </ul>
          </div>
          <div className="h-72 bg-gray-800 rounded-lg">
            {activeTimer === recordedDisplayString ? (
              <TimerRecorded></TimerRecorded>
            ) : (
              <TimerScheduled></TimerScheduled>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
