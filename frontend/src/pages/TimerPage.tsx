import { FC } from "react";
import Navbar from "../components/Navbar";
import { TimerComponent } from "../stories/Timer";

export const TimerPage: FC = () => {
  return (
    <div className="flex">
      <div className="fixed top-0 left-0 h-screen overflow-y-auto">
        <Navbar />
      </div>
      <div className="flex-grow overflow-y-auto">
        <div className="ml-48">
          <p>TimerPage</p>
          <TimerComponent></TimerComponent>
        </div>
      </div>
    </div>
  );
};
