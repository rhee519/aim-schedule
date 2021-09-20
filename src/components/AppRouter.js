import React from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";
import { auth } from "../myFirebase";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Navigator from "./Navigator";

const AppRouter = ({ userData }) => {
  return (
    <BrowserRouter>
      {auth.currentUser && <Navigator />}
      <Switch>
        {auth.currentUser ? (
          <>
            <Route exact path="/">
              <Home userData={userData} />
            </Route>
            <Route path="/profile">
              <Profile userData={userData} />
            </Route>
            <Redirect path="/login" to="/" />
          </>
        ) : (
          <>
            <Route path="/">
              <Login />
            </Route>
            <Redirect path="*" to="/" />
          </>
        )}
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </BrowserRouter>
  );
};

export default AppRouter;
