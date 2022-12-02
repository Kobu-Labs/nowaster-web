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
import { RegisterPage } from "./pages/RegisterPage";
import { Navigate } from "react-router-dom";
import { FC } from "react";
import Loading from "./pages/Loading";
import useAuth from "./hooks/useAuth";

function App() {
  return (
    <>
      <main className="">
        <Routes>
          <Route index element={<Navigate to="/auth/home" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/*" Component={PrivateRoute} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </>
  );
}

const PrivateRoute: FC = () => {
  const { auth, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;
  if (!auth || isError) {
    console.log("error");
    return <Navigate to="/login" />;
  }

  return (
    <Routes>
      <Route index element={<Navigate to="home" />} />
      <Route path="home" element={<HomePage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="stats" element={<StatsPage />} />
      <Route path="timer" element={<TimerPage />} />
    </Routes>
  );
};

export default App;
