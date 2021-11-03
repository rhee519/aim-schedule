import {
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";
import { Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";

import React from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ open, onClose }) => {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
      }}
    >
      <Drawer
        anchor="left"
        open={open}
        sx={{
          width: 200,
        }}
        onClose={onClose}
      >
        <List>
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
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              onClick={onClose}
            >
              <HomeIcon />
            </IconButton>
          </Link>
          <ListItem>
            <Link to="/schedule">
              <ListItemButton onClick={onClose}>My Schedule</ListItemButton>
            </Link>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default Sidebar;
