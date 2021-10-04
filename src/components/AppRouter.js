import React from "react";
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

import "./AppRouter.scss";
import Admin from "../pages/Admin";

const AppRouter = ({ userData, isAdmin }) => {
  return (
    <>
      <Navigator userData={userData} isAdmin={isAdmin} />
      {userData && <WorkTimeForm userData={userData} />}
      <div className="router--container">
        {userData ? (
          <Switch>
            <Route exact path="/">
              <Home userData={userData} />
            </Route>
            <Route path="/profile">
              <Profile userData={userData} />
            </Route>
            <Route path="/calendar">
              <MyCalendar userData={userData} />
            </Route>
            <Route path="/todo-list">
              <TodoList userData={userData} />
            </Route>
            <Route path="/admin">
              {isAdmin ? <Admin userData={userData} /> : <NotAdmin />}
            </Route>
            <Route path="*">
              <NotFound />
            </Route>
            <Redirect path="/login" to="/" />
          </Switch>
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
