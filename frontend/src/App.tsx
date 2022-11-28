import "./App.css";
import { Route, Routes } from "react-router";
import {
  GroupsPage,
  HomePage,
  LoginPage,
  LogoutPage,
  StatsPage,
  TimerPage,
} from "./pages";

function App() {
  return (
    <>
      <main className="">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
