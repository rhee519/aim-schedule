import React, { useEffect, useState } from "react";
import { Box, Avatar, Typography, IconButton, TextField } from "@mui/material";
import { StyledBadge } from "./Styles";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { doc, updateDoc } from "@firebase/firestore";
import { db } from "../myFirebase";

const Status = ({ user, editable }) => {
  const [edit, setEdit] = useState(false);
  const [position, setPosition] = useState();

  useEffect(() => {
    setPosition(user.position);
  }, [user]);

  const updatePosition = async () => {
    const docRef = doc(db, "userlist", user.uid);
    await updateDoc(docRef, { position });
  };

  const handleOKClick = () => {
    updatePosition();
    setEdit(false);
  };

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
          // position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Typography variant="body1" component="div">
          {user.userName}
          {edit ? (
            <Typography
              component="div"
              variant="caption"
              sx={{ display: "inline-block" }}
            >
              <TextField
                variant="standard"
                size="small"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                sx={{ width: 100, height: 10, fontSize: 10 }}
              />
              <IconButton onClick={handleOKClick} size="small">
                <CheckIcon sx={{ fontSize: 14, color: "success.main" }} />
              </IconButton>
            </Typography>
          ) : (
            <>
              <Typography variant="caption">{position}</Typography>
              {editable && (
                <IconButton onClick={() => setEdit(true)}>
                  <EditIcon sx={{ fontSize: 12 }} />
                </IconButton>
              )}
            </>
          )}
        </Typography>
        <Typography variant="caption">{user.email}</Typography>
      </Box>
    </>
  );
};

export default Status;
