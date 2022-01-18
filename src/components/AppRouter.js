import React, { useContext } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { UserContext } from "../contexts/Context";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Profile from "../pages/Profile";
import Navigator from "./Navigator";
// import MyCalendar from "../pages/MyCalendar";
import TodoList from "../pages/TodoList";
import NotAdmin from "../pages/NotAdmin";
import Admin from "../pages/Admin";
import Schedule from "./Schedule";
// import { QRreader } from "./QR";

// import "../css/AppRouter.scss";
import { Box } from "@mui/material";

const drawerWidth = 200;

const AppRouter = () => {
  const userData = useContext(UserContext);
  return (
    <Box>
      {userData ? (
        <Box>
          <Navigator drawerWidth={drawerWidth}>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route path="/profile" component={Profile} />
              <Route path="/schedule" component={Schedule} />
              <Route path="/todo-list" component={TodoList} />
              <Route
                path="/admin"
                component={userData && userData.isAdmin ? Admin : NotAdmin}
              />
              {/* <Route path="/qr-code" component={QRpage} /> */}
              <Route path="/schedule" component={Schedule} />
              <Redirect path="/login" to="/" />
              <Route path="*" component={NotFound} />
            </Switch>
          </Navigator>
        </Box>
      ) : (
        <Switch>
          <Route path="/" component={Login} />
          <Redirect path="*" to="/" />
        </Switch>
      )}
    </Box>
  );
};

export default AppRouter;
