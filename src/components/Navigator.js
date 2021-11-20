import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Drawer,
  Backdrop,
  Divider,
  Collapse,
  Icon,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SettingsIcon from "@mui/icons-material/Settings";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CropFreeIcon from "@mui/icons-material/CropFree";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";
import { ProfileAvatar } from "../pages/Profile";
import { QRcode } from "./QR";
import NotificationContainer from "./NotificationContainer";

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <Icon {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? "rotate(0deg)" : "rotate(180deg)",
  marginLeft: "auto",
  transition: theme.transitions.create("transform", {
    duration: theme.transitions.duration.shortest,
  }),
}));

const Navigator = (props) => {
  const { window, drawerWidth, children } = props;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [QROpen, setQROpen] = useState(false);
  const [title, setTitle] = useState();
  const [scheduleExpand, setScheduleExpand] = useState(false);

  const handleExpandClick = () => setScheduleExpand(!scheduleExpand);

  const location = useLocation();
  useEffect(() => {
    const path = location.pathname.split("/");
    switch (path[1]) {
      case "":
        setTitle("Dashboard");
        break;
      case "schedule":
        setTitle("My Schedule");
        break;
      case "profile":
        setTitle("Profile");
        break;
      case "qr-reader":
        setTitle("QR Reader");
        break;
      case "admin":
        setTitle("Admin");
        break;
      default:
        break;
    }
  }, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const handleQRClose = (event) => {
    const {
      target: { id },
    } = event;
    if (id !== "btn--refresh") setQROpen(false);
  };

  const handleQRToggle = () => {
    setQROpen(!QROpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Link to="/">
          <Box>
            <Typography variant="h6">AIM-SCHEDULE</Typography>
          </Box>
        </Link>
      </Toolbar>
      <Divider variant="middle" />
      <List>
        {/* DASHBOARD */}
        <Link to="/" onClick={handleDrawerClose}>
          <ListItem button>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
        </Link>

        {/* SCHEDULE */}
        <ListItem button onClick={handleExpandClick}>
          {/* <Accordion> */}
          <ListItemIcon>
            <EventAvailableIcon />
          </ListItemIcon>
          <ListItemText primary="My Schedule" />
          {/* </Accordion> */}
          <ExpandMore expand={scheduleExpand} onClick={handleExpandClick}>
            <ExpandMoreIcon />
          </ExpandMore>
        </ListItem>
        <Collapse in={scheduleExpand} timeout="auto" unmountOnExit>
          <List>
            <Link to="/schedule/check" onClick={handleDrawerClose}>
              <ListItem button sx={{ justifyContent: "flex-end" }}>
                <Typography variant="caption">Check My Schedule</Typography>
              </ListItem>
            </Link>
            <Link to="/schedule/application" onClick={handleDrawerClose}>
              <ListItem button sx={{ justifyContent: "flex-end" }}>
                <Typography variant="caption">Schedule Application</Typography>
              </ListItem>
            </Link>
          </List>
        </Collapse>

        {/* NOTIFICATION */}
        {/* <ListItem button>
          <ListItemIcon>
            <NotificationsIcon />
          // </ListItemIcon>
          <ListItemText primary="Notification" />
        </ListItem> */}

        {/* QR Code */}
        <ListItem button onClick={handleQRToggle}>
          <ListItemIcon>
            <QrCode2Icon />
          </ListItemIcon>
          <ListItemText primary="QR Code" />
        </ListItem>

        {/* QR Scanner */}
        <Link to="/qr-reader" onClick={handleDrawerClose}>
          <ListItem button>
            <ListItemIcon>
              <CropFreeIcon />
            </ListItemIcon>
            <ListItemText primary="QR Reader" />
          </ListItem>
        </Link>

        {/* SETTING */}
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Setting" />
        </ListItem>

        {/* ADMIN */}
        <Link to="/admin" onClick={handleDrawerClose}>
          <ListItem button>
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItem>
        </Link>
      </List>
      {/* <Divider /> */}
      {/* <List></List> */}
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <Backdrop
        open={QROpen}
        onClick={handleQRClose}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        {/* QR code를 누를 때 새로 render되도록 한다. */}
        {QROpen && <QRcode />}
      </Backdrop>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        {/* MENU */}
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* PAGE TITLE */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
            }}
          >
            {title}
          </Typography>

          {/* NOTIFICATION */}
          <NotificationContainer />

          {/* PROFILE */}
          <ProfileAvatar />
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

Navigator.propTypes = {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window: PropTypes.func,
};

export default Navigator;
// const Navigator = ({ location }) => {
//   const userData = useContext(UserContext);
//   const [open, setOpen] = useState(false);
//   const toggleDrawer = () => setOpen((open) => !open);

//   return (
//     <>
//       <Box sx={{ flexGrow: 1 }}>
//         <AppBar position="fixed">
//           <Toolbar>
//             {/* Home / Menu (Hamburger) */}
//             <IconButton
//               size="large"
//               edge="start"
//               color="inherit"
//               aria-label="menu"
//               onClick={toggleDrawer}
//               // sx={{ mr: 2 }}
//             >
//               <MenuIcon />
//             </IconButton>

//             <Box sx={{ flexGrow: 1 }}>
//               <Link to="/">
//                 <Button>
//                   <Typography
//                     variant="h6"
//                     sx={{
//                       color: "#fff",
//                       fontWeight: 700,
//                     }}
//                   >
//                     AIM-SCHEDULE
//                   </Typography>
//                 </Button>
//               </Link>
//             </Box>

//             {/* Page Name */}
//             {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//               Home
//             </Typography> */}

//             {/* QR Reader */}
//             {userData && userData.isAdmin && (
//               <Link
//                 className="nav--menu nav--qr-reader"
//                 to="/qr-reader"
//                 // style={{
//                 //   displey: "flex",
//                 //   width: 24,
//                 //   height: 24,
//                 // }}
//               >
//                 <IconButton
//                   size="large"
//                   edge="start"
//                   color="inherit"
//                   aria-label="qr-reader"
//                 >
//                   <CropFreeIcon />
//                 </IconButton>
//               </Link>
//             )}

//             {/* QR Code */}
//             <Link
//               className="nav--menu nav--qr-code"
//               to="/qr-code"
//               // style={{
//               //   displey: "flex",
//               //   width: 24,
//               //   height: 24,
//               // }}
//             >
//               <IconButton
//                 size="large"
//                 edge="start"
//                 color="inherit"
//                 aria-label="qr-code"
//               >
//                 <QrCode2Icon />
//               </IconButton>
//             </Link>

//             {/* To-do list */}
//             <Link
//               className="nav--menu nav--todo-list"
//               to="/todo-list"
//               // style={{
//               //   displey: "flex",
//               //   width: 24,
//               //   height: 24,
//               // }}
//             >
//               <IconButton
//                 size="large"
//                 edge="start"
//                 color="inherit"
//                 aria-label="todo-list"
//               >
//                 <StickyNote2Icon />
//               </IconButton>
//             </Link>

//             {/* Notification */}
//             <NotificationContainer />

//             {/* Profile */}
//             <ProfileAvatar />
//             {/* <IconButton
//             size="large"
//             edge="start"
//             color="inherit"
//             aria-label="menu"
//           >
//             <AccountCircle />
//           </IconButton> */}
//           </Toolbar>
//         </AppBar>
//         {/* <Sidebar open={open} onClose={toggleDrawer} width={sidebarWidth} /> */}
//       </Box>
//     </>
//   );
// };

// export default Navigator;
