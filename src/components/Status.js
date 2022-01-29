import React, { useContext, useState } from "react";
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
import { DatePicker } from "@mui/lab";
import { UserHandler } from "../contexts/Context";
import moment from "moment";

const TEXTFIELD_WIDTH = 200;

const Status = ({ user, editable }) => {
  const [edit, setEdit] = useState(false);
  const [typedPosition, setTypedPosition] = useState();
  const [selectedDate, setSelectedtDate] = useState(
    user.startDate ? moment(user.startDate.toDate()) : null
  );
  const [salary, setSalary] = useState(user.salary || 0);
  const setUser = useContext(UserHandler);

  const handleSaveClick = async (event) => {
    const docRef = doc(db, `userlist/${user.uid}`);
    const startDate = selectedDate.toDate();
    const position = typedPosition;
    const newUserData = {
      ...user,
      position,
      startDate,
      salary,
    };
    setUser(newUserData);
    await updateDoc(docRef, newUserData);

    handleClose();
  };

  const handleEditClick = () => {
    setTypedPosition(user.position);
    setEdit(true);
  };

  const handleClose = () => setEdit(false);

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
          <Typography variant="caption">{user.position}</Typography>
          {editable && (
            <IconButton onClick={handleEditClick}>
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
          )}
        </Typography>
        <Typography variant="caption">{user.email}</Typography>
      </Box>
      <Modal open={edit} onClose={handleClose}>
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
            {user.userName}님의 정보 수정
            <Stack direction="row">
              <Button variant="text" size="small" onClick={handleSaveClick}>
                save
              </Button>
              <Button variant="text" size="small" onClick={handleClose}>
                cancel
              </Button>
            </Stack>
          </ListSubheader>
          <ListItem>
            <ListItemText primary="직급" />
            <TextField
              size="small"
              value={typedPosition}
              onChange={(event) => setTypedPosition(event.target.value)}
              sx={{ width: TEXTFIELD_WIDTH }}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="입사일"
              secondary={
                user.startDate
                  ? moment(user.startDate.toDate()).format("Y년 M월 D일 입사")
                  : "입사일 정보 없음"
              }
            />
            <DatePicker
              value={selectedDate}
              onChange={(newDate) => setSelectedtDate(newDate)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  sx={{ width: TEXTFIELD_WIDTH }}
                />
              )}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="급여 (월)"
              secondary={
                user.salary
                  ? `${user.salary.toLocaleString()}원`
                  : "급여 정보 없음"
              }
            />
            <TextField
              size="small"
              type="number"
              value={salary}
              onChange={(event) => {
                if (event.target.value.length > 8) return;
                const newSalary = parseInt(event.target.value);
                setSalary(newSalary);
              }}
              sx={{ width: TEXTFIELD_WIDTH }}
            />
          </ListItem>
        </Paper>
      </Modal>
    </>
  );
};

export default Status;
