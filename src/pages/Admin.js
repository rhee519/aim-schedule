import {
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  setDoc,
  Timestamp,
} from "@firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Grid,
  Divider,
  ListItem,
  ListItemButton,
  IconButton,
  Paper,
  Stack,
  Skeleton,
  List,
  ListItemText,
  ListSubheader,
  Typography,
  Button,
  Tab,
  Modal,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Fab,
  ThemeProvider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Status from "../components/Status";
import { db } from "../myFirebase";
import {
  CalendarPickerSkeleton,
  DatePicker,
  LocalizationProvider,
  StaticDatePicker,
  TabContext,
  TabList,
  TabPanel,
  TimePicker,
} from "@mui/lab";
import moment from "moment";
import AdapterMoment from "@mui/lab/AdapterMoment";
import {
  dayRef,
  eventDocRef,
  fetchAnnualData,
  fetchDayData,
  fetchMonthData,
  fetchUser,
  fetchWaitingList,
  initialDailyData,
  userDocRef,
  vacationDocRef,
  waitingUserRef,
} from "../docFunctions";
import {
  EMOJI_ALERT,
  koreanWeekDays,
  PickersDayWithMarker,
  RecentScheduleStatusText,
  ScheduleCategory,
  worktypeEmoji,
} from "../components/Schedule";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  CalendarContext,
  CalendarHandler,
  UserContext,
} from "../contexts/Context";
import { holidayType } from "../components/CustomRangeCalendar";
import { badgeTheme } from "../theme";

const DataHandlerContext = createContext();

const Admin = () => {
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserList = useCallback(async () => {
    setLoading(true);
    const collectionRef = collection(db, "userlist");
    const fetchedList = [];
    await getDocs(collectionRef)
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          fetchedList.push({
            ...doc.data(),
          });
        });
        setUserList(fetchedList);
      })
      .then(() => setLoading(false));
  }, []);

  useEffect(() => {
    // userlist fetch
    // && ?????? on/off ????????????
    fetchUserList();
    const unsubscribe = onSnapshot(collection(db, "userlist"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data();
          setUserList((list) => {
            const newList = [...list];
            const index = newList.findIndex((user) => user.uid === data.uid);
            newList[index] = data;
            return newList;
          });
        }
      });
    });
    return () => {
      unsubscribe();
      setLoading(true);
      setUserList([]);
      setSelectedUser();
    };
  }, [fetchUserList]);

  return (
    <>
      <Grid container columns={12} spacing={1}>
        <Grid item xs={12} md={6}>
          <UserListPanel
            users={userList}
            onClick={setSelectedUser}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <AdminControlPanel />
        </Grid>
        <Grid item xs={12}>
          {selectedUser && <UserDisplay user={selectedUser} />}
        </Grid>
      </Grid>
    </>
  );
};

const UserListSkeleton = () => {
  return (
    <Stack>
      <UserStatusSkeleton />
      <Divider variant="middle" sx={{ mb: 1 }} />
      <UserStatusSkeleton />
      <Divider variant="middle" sx={{ mb: 1 }} />
      <UserStatusSkeleton />
    </Stack>
  );
};

const UserStatusSkeleton = () => {
  return (
    <Box sx={{ display: "flex", mb: 1, p: 1 }}>
      <Skeleton variant="circular" width={30} height={30} sx={{ mr: 1 }} />
      <Stack>
        <Skeleton variant="text" width={80} height={15} />
        <Skeleton variant="text" width={160} height={15} />
      </Stack>
    </Box>
  );
};

const UserListPanel = (props) => {
  const { users, onClick, loading } = props;
  return (
    <Paper
      sx={{
        maxHeight: 300,
        overflowY: "scroll",
        p: 1,
        pt: 0,
      }}
    >
      <ListSubheader sx={{ zIndex: 2 }}>????????? ??????</ListSubheader>
      {loading ? (
        <UserListSkeleton />
      ) : (
        users.map((user, index) => (
          <Box key={index}>
            {index !== 0 && <Divider variant="middle" sx={{ mb: 1 }} />}
            <ListItemButton
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                textTransform: "none",
                borderRadius: 1,
                p: 1,
                mb: 1,
                height: 40,
              }}
              onClick={() => onClick(user)}
            >
              <Status user={user} />
            </ListItemButton>
          </Box>
        ))
      )}
    </Paper>
  );
};

const UserDisplay = (props) => {
  const { user } = props;
  const calendar = useContext(CalendarContext);
  const [date, setDate] = useState(moment());
  const [schedule, setSchedule] = useState();
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [lastSelectedDate, setLastSelectedDate] = useState(moment());
  const [annualData, setAnnualData] = useState({}); // ?????? ?????? ?????????
  const annualCount = useMemo(() => {
    let count = 0;
    Object.keys(annualData).forEach((key) => {
      const { type } = annualData[key];
      if (type === "annual") count += 1;
      else if (type === "half") count += 0.5;
    });
    return count;
  }, [annualData]);

  const fetchSchedule = useCallback(async () => {
    setLoadingSchedule(true);
    fetchUser(user.uid)
      .then((docSnap) => {
        if (docSnap.exists()) setSchedule(docSnap.data().schedule);
      })
      .then(() => setLoadingSchedule(false));
  }, [user.uid]);

  const refetchMonthData = useCallback(
    async (date) => {
      setLoading(true);
      fetchMonthData(user.uid, date)
        .then((snapshot) => {
          const data = {};
          for (
            let d = moment(date).startOf("month");
            d.isSame(moment(date), "month");
            d.add(1, "d")
          ) {
            const key = d.format("YYYYMMDD");
            data[key] = undefined;
          }
          snapshot.forEach(
            (doc) =>
              (data[moment(date).date(doc.id).format("YYYYMMDD")] = doc.data())
          );
          setMonthData(data);
        })
        .then(() => setLoading(false));
    },
    [user]
  );

  const handleConfirmClick = async () => {
    const newSchedule = { ...schedule, status: "confirmed" };
    await updateDoc(userDocRef(user.uid), { schedule: newSchedule });
    setSchedule(newSchedule);
  };

  const handleRejectClick = async () => {
    const newSchedule = { ...schedule, status: "rejected" };
    await updateDoc(userDocRef(user.uid), { schedule: newSchedule });
    setSchedule(newSchedule);
  };

  useEffect(() => {
    fetchAnnualData(user.uid, moment()).then((data) => setAnnualData(data));
    fetchSchedule();
  }, [fetchSchedule, user.uid]);

  useEffect(() => {
    refetchMonthData(lastSelectedDate);
    return () => {
      setLoading();
    };
  }, [refetchMonthData, lastSelectedDate]);

  return (
    <DataHandlerContext.Provider
      value={(date, data) => {
        const key = moment(date).format("YYYYMMDD");
        setMonthData((prev) => ({ ...prev, [key]: data }));
      }}
    >
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Paper>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Stack>
              <ListItem>
                <Status user={user} editable={true} />
              </ListItem>
              <ScheduleCategory />
              <ThemeProvider theme={badgeTheme}>
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  value={date}
                  minDate={moment("2021-01-01")}
                  onChange={(date) => setDate(date)}
                  loading={loading}
                  renderLoading={() => <CalendarPickerSkeleton />}
                  renderInput={(params) => null}
                  renderDay={(day, _value, props) => {
                    const key = day.format("YYYYMMDD");
                    return (
                      <PickersDayWithMarker {...props} data={monthData[key]} />
                    );
                  }}
                  onMonthChange={(date) => {
                    setLastSelectedDate(date);
                    refetchMonthData(date);
                  }}
                />
              </ThemeProvider>
              <Box sx={{ height: 200 }}>
                <SelectedDateInfo
                  selectedUser={user}
                  date={date}
                  data={
                    monthData[date.format("YYYYMMDD")] ||
                    initialDailyData(date, calendar)
                  }
                />
              </Box>
            </Stack>
            <Divider orientation="vertical" flexItem />
            <Divider orientation="horizontal" flexItem />
            <List
              sx={{
                width: "100%",
                height: { xs: "auto", md: 700 },
                overflowY: "scroll",
                pt: 0,
              }}
            >
              {!loadingSchedule &&
                (schedule ? (
                  <>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <ListItemText
                        primary="?????? ?????? ??????"
                        secondary={moment(schedule.createdAt.toDate()).format(
                          "M??? D??? HH:mm ?????????"
                        )}
                      />
                      {schedule.status === "waiting" ? (
                        <Box>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleConfirmClick}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={handleRejectClick}
                          >
                            Reject
                          </Button>
                        </Box>
                      ) : schedule.status === "confirmed" ? (
                        <>?????????</>
                      ) : schedule.status === "rejected" ? (
                        <>?????????</>
                      ) : (
                        <></>
                      )}
                    </Stack>
                    <RecentScheduleStatusText
                      schedule={schedule}
                      annualCount={annualCount}
                      sx={{ alignItems: "center" }}
                    />
                  </>
                ) : (
                  <Typography>?????? ?????? ????????? ?????? ???????????????.</Typography>
                ))}
              <ListSubheader>
                {moment(lastSelectedDate).format("M???")}
              </ListSubheader>
              {Object.keys(monthData).map((key, index) => {
                const dailyData =
                  (monthData && monthData[key]) ||
                  initialDailyData(moment(key), calendar);
                const { type } = dailyData;
                const htype = holidayType(moment(key), calendar);
                const showAlert = Boolean(
                  htype !== "default" && type === "work"
                );
                // const notice =
                //   htype !== "default" && type !== "offday" ? "????" : undefined;

                let secondaryText = koreanWeekDays[moment(key).day()];
                if (htype === "vacation" || htype === "holiday")
                  secondaryText += ` | ${calendar[htype][key]}`;
                const secondaryTextColor =
                  htype === "vacation" ||
                  htype === "holiday" ||
                  htype === "sunday"
                    ? "error"
                    : htype === "saturday"
                    ? "primary"
                    : "text.primary";
                const hideTimePrimary =
                  htype !== "default" && type === "offday";
                const startPrimary = hideTimePrimary
                  ? ""
                  : moment(dailyData.start.toDate()).format("HH:mm");
                const finishPrimary = hideTimePrimary
                  ? ""
                  : moment(dailyData.finish.toDate()).format("HH:mm");
                const startedSecondary = dailyData.started
                  ? `${moment(dailyData.started.toDate()).format("HH:mm")} ??????`
                  : !hideTimePrimary
                  ? "-"
                  : "";
                const finishedSecondary = dailyData.finished
                  ? `${moment(dailyData.finished.toDate()).format(
                      "HH:mm"
                    )} ??????`
                  : !hideTimePrimary
                  ? "-"
                  : "";

                return (
                  <ListItemButton
                    key={key}
                    onClick={() => setDate(moment(key))}
                    sx={{ height: 60 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        width: 10,
                        justifyContent: "center",
                      }}
                    >
                      {showAlert ? EMOJI_ALERT : worktypeEmoji(type)}
                    </Box>
                    <Box width={100} mr={1}>
                      <ListItemText
                        primary={moment(key).format("D???")}
                        secondary={`${secondaryText}`}
                        primaryTypographyProps={{ fontSize: 14 }}
                        secondaryTypographyProps={{
                          fontSize: 12,
                          color: secondaryTextColor,
                        }}
                        sx={{ textAlign: "center" }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", width: "100%" }}>
                      {type === "annual" ? (
                        <ListItemText
                          primary="??????"
                          sx={{
                            textAlign: "center",
                          }}
                        />
                      ) : type === "sick" ? (
                        <ListItemText
                          primary="??????"
                          sx={{
                            textAlign: "center",
                          }}
                        />
                      ) : (
                        <>
                          <ListItemText
                            primary={startPrimary}
                            secondary={startedSecondary}
                            sx={{ textAlign: "center" }}
                          />
                          <ListItemText
                            primary={finishPrimary}
                            secondary={finishedSecondary}
                            sx={{ textAlign: "center" }}
                          />
                        </>
                      )}
                    </Box>
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Paper>
      </LocalizationProvider>
    </DataHandlerContext.Provider>
  );
};

const SelectedDateInfo = (props) => {
  const user = useContext(UserContext);
  const setMonthData = useContext(DataHandlerContext);
  const calendar = useContext(CalendarContext);
  const { data, date, selectedUser } = props;
  const { type } = data;
  const htype = holidayType(moment(date), calendar);

  const [edit, setEdit] = useState(false);
  const dateKey = date.format("YYYYMMDD");
  const [editData, setEditData] = useState(data);

  // return (
  //   <>
  //     {type}
  //     <Button
  //       onClick={() => {
  //         const key = date.format("YYYYMMDD");
  //         setMonthData(date, { ...data, type: "work" });
  //       }}
  //     >
  //       click
  //     </Button>
  //   </>
  // );
  // const [loading, setLoading] = useState(true);

  const startText =
    htype === "default" ? moment(data.start.toDate()).format("HH:mm") : "-";
  const finishText =
    htype === "default" ? moment(data.finish.toDate()).format("HH:mm") : "-";
  const startedText = data.started
    ? `${moment(data.started.toDate()).format("HH:mm")} ??????`
    : "-";
  const finishedText = data.finished
    ? `${moment(data.finished.toDate()).format("HH:mm")} ??????`
    : "-";

  const handleEditClick = () => {
    setEditData(data);
    setEdit(true);
  };
  const handleClose = () => {
    setEdit(false);
  };

  const handleChangeType = (event) => {
    setEditData({ ...editData, type: event.target.value });
  };

  const handleSaveClick = async (event) => {
    const d = moment(date);
    const docRef = dayRef(selectedUser.uid, d);
    fetchDayData(selectedUser.uid, d).then(async (docSnap) => {
      if (docSnap.exists()) {
        updateDoc(docRef, editData);
      } else {
        setDoc(docRef, editData);
      }
    });
    setMonthData(date, editData);
    handleClose();
  };

  const handleResetClick = async () => {
    const resetData = { ...data, started: null, finished: null };
    const d = moment(date);
    const docRef = dayRef(selectedUser.uid, d);
    fetchDayData(selectedUser.uid, d).then(async (docSnap) => {
      if (docSnap.exists()) {
        updateDoc(docRef, resetData);
      } else {
        setDoc(docRef, resetData);
      }
    });
    setMonthData(date, resetData);
    setEditData(resetData);
    handleClose();
  };

  // useEffect(() => {
  //   setLoading(true);
  //   fetchDayData(selectedUser.uid, moment(date))
  //     .then(async (docSnap) => {
  //       if (docSnap.exists()) setData(docSnap.data());
  //       else setData(initialDailyData(moment(date)));
  //     })
  //     .then(() => setLoading(false));

  //   return () => {
  //     // setData();
  //     setLoading(true);
  //   };
  // }, [selectedUser, date]);

  // useEffect(() => {
  //   return () => {
  //     setEditData();
  //   };
  // }, []);

  return (
    <>
      <Box sx={{ p: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <ListItemText
            primary={`${date.format("M??? D???")} ${
              (type !== "work" && worktypeEmoji(type)) || ""
            }`}
            secondary={
              calendar.event[dateKey]
                ? calendar.event[dateKey]
                : calendar[htype]
                ? calendar[htype][dateKey]
                : ""
            }
            primaryTypographyProps={{ variant: "h6" }}
            secondaryTypographyProps={{
              color:
                !calendar.event[dateKey] && calendar[htype]
                  ? "error"
                  : "text.secondary",
            }}
          />
          <Button
            onClick={handleEditClick}
            disabled={user.uid === selectedUser.uid}
          >
            ??????
          </Button>
        </Stack>

        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {type === "annual" ? (
              <ListItemText primary="??????" sx={{ textAlign: "center" }} />
            ) : (
              <>
                <ListItemText
                  sx={{ textAlign: "center" }}
                  primary={startText}
                  secondary={startedText}
                />
                <ListItemText
                  sx={{ textAlign: "center" }}
                  primary={finishText}
                  secondary={finishedText}
                />
              </>
            )}
          </Stack>
          <Modal
            sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={edit}
            onClose={handleClose}
          >
            <Paper
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                p: 1,
              }}
            >
              <List sx={{ p: 0 }}>
                <ListSubheader sx={{ p: 0 }}>
                  {moment(date).format("M??? D???")}
                </ListSubheader>
                <ListItemText primary="?????? SAVE??? ???????????? ????????? ???????????? ???????????????!" />
                <ListItemText
                  primary="???? ??????, ??????, ????????? ?????? ???????????? ????????? ??????????????????."
                  secondary="(??????, ????????? ?????? ??????)"
                />
                <Divider orientation="horizontal" />
                <FormControl variant="standard">
                  <InputLabel>?????? ??????</InputLabel>
                  <Select value={editData.type} onChange={handleChangeType}>
                    <MenuItem value="work">??????</MenuItem>
                    <MenuItem value="annual">??????</MenuItem>
                    <MenuItem value="half">??????</MenuItem>
                    <MenuItem value="sick">??????</MenuItem>
                    <MenuItem value="offday" disabled>
                      ??????
                    </MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" sx={{ mt: 1 }}>
                  {/* <TimePicker
                    label="????????? ????????????"
                    value={moment(editData.start.toDate())}
                    onChange={(time) => {
                      // const { start } = editData;
                      const newTime = moment(editData.start.toDate());
                      newTime.hour(time.hour());
                      newTime.minute(time.minute());
                      const start = Timestamp.fromDate(newTime.toDate());
                      setEditData({ ...editData, start });
                    }}
                    renderInput={(params) => (
                      <TextField size="small" {...params} />
                    )}
                    disabled={editData.type === "annual"}
                  />
                  <TimePicker
                    label="????????? ????????????"
                    value={moment(editData.finish.toDate())}
                    onChange={(time) => {
                      const newTime = moment(editData.finish.toDate());
                      newTime.hour(time.hour());
                      newTime.minute(time.minute());
                      const finish = Timestamp.fromDate(newTime.toDate());
                      setEditData({ ...editData, finish });
                    }}
                    renderInput={(params) => (
                      <TextField size="small" {...params} />
                    )}
                    disabled={editData.type === "annual"}
                  /> */}
                  <TimePicker
                    label="?????? ????????????"
                    value={
                      editData.started
                        ? moment(editData.started.toDate())
                        : moment(editData.start.toDate())
                    }
                    onChange={(time) => {
                      const newTime = editData.started
                        ? moment(editData.started.toDate())
                        : moment(editData.start.toDate());
                      newTime.hour(time.hour());
                      newTime.minute(time.minute());
                      const started = Timestamp.fromDate(newTime.toDate());
                      setEditData({ ...editData, started });
                    }}
                    renderInput={(params) => (
                      <TextField size="small" {...params} />
                    )}
                    disabled={editData.type === "annual"}
                  />
                  <TimePicker
                    label="?????? ????????????"
                    value={
                      editData.finished
                        ? moment(editData.finished.toDate())
                        : moment(editData.finish.toDate())
                    }
                    onChange={(time) => {
                      const newTime = editData.finished
                        ? moment(editData.finished.toDate())
                        : moment(editData.finish.toDate());
                      newTime.hour(time.hour());
                      newTime.minute(time.minute());
                      const finished = Timestamp.fromDate(newTime.toDate());
                      setEditData({ ...editData, finished });
                    }}
                    renderInput={(params) => (
                      <TextField size="small" {...params} />
                    )}
                    disabled={editData.type === "annual"}
                  />
                </Stack>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mt: 1 }}
                >
                  <Button variant="contained" onClick={handleSaveClick}>
                    Save
                  </Button>
                  <Button color="error" onClick={handleResetClick}>
                    ??????????????? ?????????
                  </Button>
                  <Button onClick={handleClose}>Cancel</Button>
                </Stack>
              </List>
            </Paper>
          </Modal>
        </>
      </Box>
    </>
  );
};

const AdminControlPanel = (props) => {
  const calendar = useContext(CalendarContext);
  const setCalendar = useContext(CalendarHandler);
  const [index, setIndex] = useState("sign-in-request");
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventDate, setEventDate] = useState(moment());
  const [eventText, setEventText] = useState("");
  const [vacationDate, setVacationDate] = useState(moment());
  const [vacationText, setVacationText] = useState("");

  useEffect(() => {
    fetchWaitingList()
      .then((snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            status: data.status,
            data: JSON.parse(data.json),
          });
        });
        setWaitlist(list);
      })
      .then(() => setLoading(false));

    return () => {
      setWaitlist();
      setLoading();
    };
  }, []);

  const onDeleteClick = async (index) => {
    const list = [...waitlist];
    const doc = list[index];
    list.splice(index, 1);
    setWaitlist(list);
    await deleteDoc(waitingUserRef(doc.id));
  };

  const handleAddEvent = async () => {
    const key = eventDate.format("YYYYMMDD");
    const event = { ...calendar.event, [key]: eventText };
    setCalendar((prev) => ({ ...prev, event }));
    setEventText("");
    await updateDoc(eventDocRef, event);
  };

  const handleAddVacation = async () => {
    const key = vacationDate.format("YYYYMMDD");
    const vacation = { ...calendar.vacation, [key]: vacationText };
    setCalendar((prev) => ({ ...prev, vacation }));
    setVacationText("");
    await updateDoc(vacationDocRef, vacation);
  };

  const handleDeleteFromCalendar = async (calendarType, key) => {
    if (calendarType === "event") {
      const event = { ...calendar.event };
      delete event[key];
      setCalendar((prev) => ({ ...prev, event }));
      await setDoc(eventDocRef, event);
    } else if (calendarType === "vacation") {
      const vacation = { ...calendar.vacation };
      delete vacation[key];
      setCalendar((prev) => ({ ...prev, vacation }));
      await setDoc(vacationDocRef, vacation);
    }
  };

  return (
    <Paper sx={{ height: 300, p: 1, pt: 0, overflowY: "auto" }} {...props}>
      <TabContext value={index}>
        <TabList
          onChange={(event, value) => setIndex(value)}
          variant="scrollable"
          scrollButtons="auto"
          // sx={{
          //   display: "flex",
          //   justifyContent: "center",
          //   alignItems: "center",
          //   bgcolor: "green",
          // }}
        >
          <Tab
            label="???????????? ??????"
            value="sign-in-request"
            sx={{ mr: 0, p: 0 }}
          />
          <Tab label="?????? ??????" value="event" sx={{ mr: 0, p: 0 }} />
          <Tab label="?????????" value="vacation" sx={{ mr: 0, p: 0 }} />
          {/* <Tab label="?????????" value="payday" sx={{ mr: 0, p: 0 }} /> */}
        </TabList>
        <TabPanel value="sign-in-request" sx={{ p: 0 }}>
          {loading ? (
            <>loading...</>
          ) : (
            waitlist && (
              <List sx={{ p: 0 }}>
                {waitlist.map((waitingUser, index) => {
                  return (
                    <WaitingUser
                      key={waitingUser.data.uid}
                      data={waitingUser.data}
                      status={waitingUser.status}
                      onDeleteClick={() => onDeleteClick(index)}
                    />
                  );
                })}
              </List>
            )
          )}
        </TabPanel>
        <TabPanel value="event" sx={{ position: "relative", p: 0 }}>
          <List>
            <InputEvent
              date={eventDate}
              text={eventText}
              onDateChange={setEventDate}
              onTextChange={(event) => setEventText(event.target.value)}
              onClick={handleAddEvent}
            />
            <ListSubheader>
              <Divider light sx={{ m: 0 }}>
                ?????? ?????? ????????? ???????????????.
              </Divider>
            </ListSubheader>
            <CalendarList
              htype="event"
              onDeleteClick={handleDeleteFromCalendar}
            />
          </List>
        </TabPanel>
        <TabPanel value="vacation" sx={{ p: 0 }}>
          <List>
            <InputEvent
              date={vacationDate}
              text={vacationText}
              onDateChange={setVacationDate}
              onTextChange={(event) => setVacationText(event.target.value)}
              onClick={handleAddVacation}
            />
            <ListSubheader>
              <Divider light sx={{ m: 0 }}>
                ?????? ?????? ???????????? ???????????????.
              </Divider>
            </ListSubheader>
            <CalendarList
              htype="vacation"
              onDeleteClick={handleDeleteFromCalendar}
            />
          </List>
        </TabPanel>
        {/* <TabPanel value="payday" sx={{ p: 0 }}>
          ?????????
        </TabPanel> */}
      </TabContext>
    </Paper>
  );
};

const InputEvent = ({ date, text, onDateChange, onTextChange, onClick }) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center">
      <Stack sx={{ mr: 3 }}>
        <DatePicker
          value={date}
          onChange={onDateChange}
          renderInput={(params) => <TextField variant="standard" {...params} />}
        />
        <TextField
          variant="outlined"
          size="small"
          placeholder="????????? ???????????????"
          value={text}
          onChange={onTextChange}
        />
      </Stack>
      <Fab color="primary" size="small" onClick={onClick} disabled={!text}>
        <AddIcon />
      </Fab>
    </Stack>
  );
};

const CalendarList = ({ htype, onDeleteClick }) => {
  const calendar = useContext(CalendarContext);
  return Object.keys(calendar[htype])
    .filter((key) => moment(key).year() === moment().year())
    .map((key) => (
      <Stack key={key} direction="row" justifyContent="flex-start">
        <ListItemText secondary={moment(key).format("M/D")} />
        <ListItemText primary={calendar[htype][key]} />
        <IconButton
          size="small"
          color="error"
          onClick={() => onDeleteClick(htype, key)}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Stack>
    ));
};

const WaitingUser = (props) => {
  const { data, onDeleteClick } = props;
  const [status, setStatus] = useState(props.status);
  const handleApproveClick = async () => {
    const docRef = waitingUserRef(data.uid);
    await updateDoc(docRef, {
      status: "approved",
    });
    setStatus("approved");
  };

  const handleDenyClick = async () => {
    const docRef = waitingUserRef(data.uid);
    await updateDoc(docRef, {
      status: "denied",
    });
    setStatus("denied");
  };

  return (
    <ListItem sx={{ p: 0 }}>
      <ListItemText
        primary={<Typography>{data.displayName}</Typography>}
        secondary={data.email}
      />
      {status === "pending" ? (
        <>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={handleApproveClick}
          >
            <CheckIcon />
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={handleDenyClick}
          >
            <CloseIcon />
          </Button>
        </>
      ) : status === "denied" ? (
        <ListItemText primary="?????????" />
      ) : status === "approved" ? (
        <ListItemText primary="?????????" />
      ) : (
        <></>
      )}
      <IconButton size="small" onClick={onDeleteClick}>
        <CloseIcon size="small" />
      </IconButton>
    </ListItem>
  );
};

// const UserScheduleCheck = (props) => {
//   const [date, setDate] = useState();
//   return (
//     <>
//       <CustomRangeCalendar
//         calendarStart={startDate}
//         calendarEnd={endDate}
//         value={date}
//         onChange={(value) => setDate(value)}
//         dayComponent={ScheduleCheckDayComponent}
//       />
//     </>
//   );
// };

// const ScheduleCheckDayComponent = (props) => {
//   const {
//     value,
//     // today, outOfRange, selected, onClick
//   } = props;

//   return <Box sx={{}}>{value.format("M/D")}</Box>;
// };

// const UserScheduleApplication = (props) => {
//   const { user, loading, monthData } = props;
//   console.log(user);

//   return loading ? (
//     <Loading />
//   ) : monthData && monthData.info && monthData.info.type === "submitted" ? (
//     <Box>
//       <Button variant="contained" size="small">
//         confirm
//       </Button>
//       <Typography>hi</Typography>
//     </Box>
//   ) : (
//     <Typography>?????? ?????? ????????? ?????? ???????????????.</Typography>
//   );
// };

export default Admin;
