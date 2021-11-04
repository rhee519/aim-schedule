import React, {
  useState,
  //  useRef,
  useContext,
} from "react";
import { Link } from "react-router-dom";
// import useOutsideClick from "../useOutsideClick";
import { UserContext } from "../contexts/Context";

import { AppBar, Box, Toolbar, IconButton, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import HomeIcon from "@mui/icons-material/Home";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CropFreeIcon from "@mui/icons-material/CropFree";
// import NotificationsIcon from "@mui/icons-material/Notifications";

import NotificationContainer from "./NotificationContainer";
import Sidebar from "./Sidebar";
import { ProfileAvatar } from "../pages/Profile";
// import "../css/Navigator.scss";

const Navigator = ({ location }) => {
  const userData = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const toggleDrawer = () => setOpen((open) => !open);

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="fixed">
          <Toolbar>
            {/* Home / Menu (Hamburger) */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer}
              // sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Link to="/">
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }} // mr: margin-right
              >
                {/* {location.pathname === "/" ? <MenuIcon /> : <HomeIcon />} */}
                <HomeIcon />
              </IconButton>
            </Link>

            {/* Page Name */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Home
            </Typography>

            {/* QR Reader */}
            {userData && userData.isAdmin && (
              <Link
                className="nav--menu nav--qr-reader"
                to="/qr-reader"
                // style={{
                //   displey: "flex",
                //   width: 24,
                //   height: 24,
                // }}
              >
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="qr-reader"
                >
                  <CropFreeIcon />
                </IconButton>
              </Link>
            )}

            {/* QR Code */}
            <Link
              className="nav--menu nav--qr-code"
              to="/qr-code"
              // style={{
              //   displey: "flex",
              //   width: 24,
              //   height: 24,
              // }}
            >
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="qr-code"
              >
                <QrCode2Icon />
              </IconButton>
            </Link>

            {/* To-do list */}
            <Link
              className="nav--menu nav--todo-list"
              to="/todo-list"
              // style={{
              //   displey: "flex",
              //   width: 24,
              //   height: 24,
              // }}
            >
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="todo-list"
              >
                <StickyNote2Icon />
              </IconButton>
            </Link>

            {/* Notification */}
            <NotificationContainer />

            {/* Profile */}
            <ProfileAvatar />
            {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
          >
            <AccountCircle />
          </IconButton> */}
          </Toolbar>
        </AppBar>
        <Sidebar open={open} onClose={toggleDrawer} />
      </Box>
    </>
  );
};

export default Navigator;
