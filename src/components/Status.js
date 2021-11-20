import React from "react";
import { Box, Avatar, Paper, Typography, ListItemButton } from "@mui/material";
import { StyledBadge } from "./Styles";
// import "../css/Status.scss";

const Status = ({ user }) => {
  // const className = user.isWorking ? " status-working" : "";
  return (
    <Paper
      sx={{
        // display: "flex",
        // alignItems: "center",
        // height: 40,
        mb: 1,
      }}
    >
      <ListItemButton
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          textTransform: "none",
          borderRadius: 1,
          p: 1,
          height: 40,
        }}
      >
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          badgeContent={!user.isWorking && 0}
          sx={{
            mr: 1,
          }}
        >
          <Avatar
            alt={user.userName}
            src={user.profileImageURL}
            sx={{
              width: 30,
              height: 30,
            }}
          />
        </StyledBadge>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <Typography variant="body1">
            {user.userName}{" "}
            <Typography variant="caption">{user.position}</Typography>
          </Typography>
          <Typography variant="caption">{user.email}</Typography>
        </Box>
        {/* <div className={`status--led${className}`}></div> */}
      </ListItemButton>
    </Paper>
  );
};

export default Status;
