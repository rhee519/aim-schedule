import React, {
  // useState, useRef,
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
  // Badge,
} from "@mui/material";
// import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import HomeIcon from "@mui/icons-material/Home";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CropFreeIcon from "@mui/icons-material/CropFree";
// import NotificationsIcon from "@mui/icons-material/Notifications";

import NotificationContainer from "./NotificationContainer";
// import "../css/Navigator.scss";

const Navigator = ({ location }) => {
  const userData = useContext(UserContext);

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
              sx={{ mr: 2 }} // mr: margin-right
            >
              {/* {location.pathname === "/" ? <MenuIcon /> : <HomeIcon />} */}
              <Link
                to="/"
                style={{
                  display: "flex",
                }}
              >
                <HomeIcon />
              </Link>
            </IconButton>

            {/* Page Name */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Home
            </Typography>

            {/* QR Reader */}
            {userData && userData.isAdmin && (
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="qr-reader"
              >
                <Link
                  className="nav--menu nav--qr-reader"
                  to="/qr-reader"
                  style={{
                    displey: "flex",
                    width: 24,
                    height: 24,
                  }}
                >
                  <CropFreeIcon />
                </Link>
              </IconButton>
            )}

            {/* QR Code */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="qr-code"
            >
              <Link
                className="nav--menu nav--qr-code"
                to="/qr-code"
                style={{
                  displey: "flex",
                  width: 24,
                  height: 24,
                }}
              >
                <QrCode2Icon />
              </Link>
            </IconButton>

            {/* To-do list */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="todo-list"
            >
              <Link
                className="nav--menu nav--todo-list"
                to="/todo-list"
                style={{
                  displey: "flex",
                  width: 24,
                  height: 24,
                }}
              >
                <StickyNote2Icon />
              </Link>
            </IconButton>

            {/* Notification */}
            <NotificationContainer />

            {/* Profile */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="profile"
            >
              {userData ? (
                <Link
                  className="nav--menu nav--profile"
                  to="/profile"
                  style={{
                    display: "flex",
                  }}
                >
                  <img
                    src={userData.profileImageURL}
                    alt="profile"
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 100,
                    }}
                  />
                </Link>
              ) : (
                <AccountCircle />
              )}
            </IconButton>
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
