import React, { useContext } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Navigator from "./Navigator";
import MyCalendar from "../pages/MyCalendar";
import TodoList from "../pages/TodoList";
import NotAdmin from "../pages/NotAdmin";
import WorkTimeForm from "./WorkTimeForm";
import QRpage from "../pages/QRpage";
import Admin from "../pages/Admin";

import "./AppRouter.scss";
import { UserContext } from "../contexts/Context";
import WaitingForGrant from "../pages/WaitingForGrant";
import QRReader from "./QRReader";

const AppRouter = () => {
  const userData = useContext(UserContext);
  return (
    <>
      <Navigator />
      <div className="router--container">
        {userData ? (
          userData.isGranted ? (
            <>
              <WorkTimeForm />
              <Switch>
                <Route exact path="/">
                  <Home />
                </Route>
                <Route path="/profile">
                  <Profile />
                </Route>
                <Route path="/calendar">
                  <MyCalendar />
                </Route>
                <Route path="/todo-list">
                  <TodoList />
                </Route>
                <Route path="/admin">
                  {userData && userData.isAdmin ? <Admin /> : <NotAdmin />}
                </Route>
                <Route path="/qr-code">
                  <QRpage />
                </Route>
                <Route path="/qr-reader">
                  <QRReader />
                </Route>
                <Redirect path="/login" to="/" />
                <Route path="*">
                  <NotFound />
                </Route>
              </Switch>
            </>
          ) : (
            <>
              <Route path="/">
                <WaitingForGrant />
              </Route>
              <Redirect path="*" to="/" />
            </>
          )
        ) : (
          <Switch>
            <Route path="/">
              <Login />
            </Route>
            <Redirect path="*" to="/" />
          </Switch>
        )}
      </div>
    </>
  );
};

export default AppRouter;
