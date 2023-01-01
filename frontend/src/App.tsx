import { Route, Routes } from "react-router";
import {
  AdminPage,
  GroupsPage,
  HomePage,
  LoginPage,
  LogoutPage,
  RegisterPage,
  StatsPage,
  TimerPage,
} from "./pages";
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
          <Route path="/admin" Component={WithAuthorization(AdminPage)} />
          <Route path="*" Component={LoginPage} />
        </Routes>
      </main>
    </>
  );
}

export default App;
