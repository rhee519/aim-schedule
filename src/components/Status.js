import React, { useState } from "react";
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  TextField,
  Modal,
  Paper,
  ListSubheader,
  Button,
  Stack,
  ListItem,
  ListItemText,
} from "@mui/material";
import { StyledBadge } from "./Styles";
import EditIcon from "@mui/icons-material/Edit";
import { doc, updateDoc } from "@firebase/firestore";
import { db } from "../myFirebase";

const Status = ({ user, editable }) => {
  const [edit, setEdit] = useState(false);
  const [userdata, setUserdata] = useState(user);

  const updateUserdata = async (data) => {
    const docRef = doc(db, "userlist", user.uid);
    await updateDoc(docRef, data);
  };

  const handleSaveClick = (data) => {
    updateUserdata(data);
    setEdit(false);
  };

  const handleCancelClick = () => {
    setUserdata(user);
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
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Typography variant="body1" component="div">
          {user.userName}
          <Typography variant="caption">{userdata.position}</Typography>
          {editable && (
            <IconButton onClick={() => setEdit(true)}>
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}
        </Typography>
        <Typography variant="caption">{user.email}</Typography>
      </Box>
      <Modal
        open={edit}
        onClose={() => {
          setEdit(false);
          updateUserdata(userdata);
        }}
      >
        <Paper
          sx={{
            width: 500,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <ListSubheader
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {userdata.userName}님의 정보 수정
            <Stack direction="row">
              <Button
                variant="text"
                size="small"
                onClick={() => handleSaveClick(userdata)}
              >
                save
              </Button>
              <Button variant="text" size="small" onClick={handleCancelClick}>
                cancel
              </Button>
            </Stack>
          </ListSubheader>
          <ListItem>
            <ListItemText primary="직급" />
            <TextField
              size="small"
              value={userdata.position}
              onChange={(event) =>
                setUserdata({ ...userdata, position: event.target.value })
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText primary="입사일" />
            <TextField placeholder="준비중" disabled size="small" />
          </ListItem>
          <ListItem>
            <ListItemText primary="급여(월)" />
            <TextField placeholder="준비중" disabled size="small" />
          </ListItem>
        </Paper>
      </Modal>
    </>
  );
};

export default Status;
