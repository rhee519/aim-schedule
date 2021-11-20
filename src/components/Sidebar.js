import {
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Typography,
} from "@mui/material";
import { Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ open, onClose, width }) => {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        width,
      }}
    >
      <Drawer variant="permanent" anchor="left" open={open} onClose={onClose}>
        <List>
          {/* HOME */}
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onClose}
            sx={{
              ml: 1,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Link to="/">
            <Button color="inherit" sx={{ mr: 2 }} onClick={onClose}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                AIM-SCHEDULE
              </Typography>
            </Button>
          </Link>

          {/* DASHBOARD */}
          <ListItem>
            <ListItemButton>Dashboard</ListItemButton>
          </ListItem>

          {/* MY SCHEDULE */}
          <Link to="/schedule">
            <ListItem>
              <ListItemButton onClick={onClose}>My Schedule</ListItemButton>
            </ListItem>
          </Link>

          {/* NOTIFICATION */}
          <ListItem>
            <ListItemButton>Notification</ListItemButton>
          </ListItem>

          {/* ADMIN */}
          <ListItem>
            <ListItemButton>Admin</ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
