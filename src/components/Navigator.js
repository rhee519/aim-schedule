import React, {
  useState,
  //  useRef,
  useContext,
} from "react";
import { Link } from "react-router-dom";
// import useOutsideClick from "../useOutsideClick";
import { UserContext } from "../contexts/Context";

import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
  // Drawer,
  // Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import HomeIcon from "@mui/icons-material/Home";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CropFreeIcon from "@mui/icons-material/CropFree";
// import NotificationsIcon from "@mui/icons-material/Notifications";

import NotificationContainer from "./NotificationContainer";
import Sidebar from "./Sidebar";
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
            {userData ? (
              <Link
                className="nav--menu nav--profile"
                to="/profile"
                // style={{
                //   display: "flex",
                // }}
              >
                <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="profile"
                >
                  <Avatar
                    src={userData.profileImageURL}
                    alt={userData.userName}
                    sx={{
                      width: 25,
                      height: 25,
                      // borderRadius: 100,
                    }}
                  />
                </IconButton>
              </Link>
            ) : (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="profile"
              >
                <AccountCircle />
              </IconButton>
            )}
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
    // <>
    //   <div className="nav--container">
    //     <Link className="nav--home" to="/" id="home">
    //       <i className="material-icons">home</i>
    //     </Link>

    //     {userData && (
    //       <div className="nav--side--menu">
    //         <Link className="nav--qr-code" to="/qr-code">
    //           <i className="material-icons">qr_code</i>
    //         </Link>
    //         {userData.isAdmin && (
    //           <>
    //             <Link className="nav--qr-reader" to="/qr-reader">
    //               <i className="material-icons">qr_code_scanner</i>
    //             </Link>
    //             <Link className="nav--admin" to="/admin">
    //               <i className="material-icons">admin_panel_settings</i>
    //             </Link>
    //           </>
    //         )}
    //         <Link className="nav--todo-list" to="/todo-list">
    //           <i className="material-icons">format_list_bulleted</i>
    //         </Link>
    //         <Link className="nav--calendar" to="/calendar">
    //           <i className="material-icons">event_available</i>{" "}
    //         </Link>
    //         <button className={classNames} onClick={onNotifyClick}>
    //           <i className="material-icons">notifications</i>
    //         </button>
    //         <Link className="nav--profile" to="/profile">
    //           {userData ? (
    //             <img src={userData.profileImageURL} alt="profile" />
    //           ) : (
    //             <i className="material-icons">account_circle</i>
    //           )}
    //         </Link>
    //       </div>
    //     )}

    //     {showNotify && <Notifications reference={notifyRef} />}
    //   </div>
    // </>
  );
};

export default Navigator;
