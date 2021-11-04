import React, { useContext } from "react";
import { Switch, Route, Redirect, useLocation } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Navigator from "./Navigator";
import MyCalendar from "../pages/MyCalendar";
import TodoList from "../pages/TodoList";
import NotAdmin from "../pages/NotAdmin";
import QRpage from "../pages/QRpage";
import Admin from "../pages/Admin";
import Schedule from "./Schedule";

import "../css/AppRouter.scss";
import { UserContext } from "../contexts/Context";
// import WaitingForGrant from "../pages/WaitingForGrant";
import QRReader from "./QRReader";

const AppRouter = () => {
  const userData = useContext(UserContext);
  const location = useLocation();
  return (
    <>
      <div className="router--container">
        {userData ? (
          <>
            <Navigator location={location} />
            {/* <WorkIndicator /> */}
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/profile" component={Profile} />
              <Route path="/calendar" component={MyCalendar} />
              <Route path="/todo-list" component={TodoList} />
              <Route
                path="/admin"
                component={userData && userData.isAdmin ? Admin : NotAdmin}
              />
              <Route path="/qr-code" component={QRpage} />
              <Route path="/qr-reader" component={QRReader} />
              <Route path="/schedule" component={Schedule} />
              <Redirect path="/login" to="/" />
              <Route path="*" component={NotFound} />
            </Switch>
          </>
        ) : (
          <Switch>
            <Route path="/" component={Login} />
            <Redirect path="*" to="/" />
          </Switch>
        )}
      </div>
    </>
  );
};

export default AppRouter;
