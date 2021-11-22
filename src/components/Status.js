import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import { StyledBadge } from "./Styles";
// import "../css/Status.scss";

const Status = ({ user }) => {
  return (
    <>
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
    </>
  );
};

export default Status;
