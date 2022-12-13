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
import { WithAuthorization } from "./components/WithAuthorization";

function App() {
  return (
    <>
      <main className="">
        <Routes>
          <Route index path="/home" Component={WithAuthorization(HomePage)} />
          <Route path="/login" Component={LoginPage} />
          <Route path="/logout" Component={LogoutPage} />
          <Route path="/register" Component={RegisterPage} />
          <Route path="/groups" Component={WithAuthorization(GroupsPage)} />
          <Route path="/stats" Component={WithAuthorization(StatsPage)} />
          <Route path="/timer" Component={WithAuthorization(TimerPage)} />
          <Route path="*" Component={LoginPage} />
        </Routes>
      </main>
    </>
  );
}

export default App;
