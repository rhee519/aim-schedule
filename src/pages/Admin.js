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
  annualEmoji,
  halfEmoji,
  koreanWeekDays,
  PickersDayWithMarker,
  sickEmoji,
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
    // && 근로 on/off 모니터링
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
      <ListSubheader sx={{ zIndex: 2 }}>근로자 목록</ListSubheader>
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
    fetchSchedule();
  }, [fetchSchedule]);

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
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <ListItemText
                  primary={annualEmoji}
                  secondary="연차"
                  sx={{ textAlign: "center" }}
                />
                <ListItemText
                  primary={halfEmoji}
                  secondary="반차"
                  sx={{ textAlign: "center" }}
                />
                <ListItemText
                  primary={sickEmoji}
                  secondary="병가"
                  sx={{ textAlign: "center" }}
                />
              </Stack>
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
                    <PickersDayWithMarker
                      {...props}
                      type={monthData[key] ? monthData[key].type : undefined}
                    />
                  );
                }}
                onMonthChange={(date) => {
                  setLastSelectedDate(date);
                  refetchMonthData(date);
                }}
              />
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
                        primary="최근 근로 신청"
                        secondary={moment(schedule.createdAt.toDate()).format(
                          "M월 D일 HH:mm 신청함"
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
                        <>승인됨</>
                      ) : schedule.status === "rejected" ? (
                        <>반려됨</>
                      ) : (
                        <></>
                      )}
                    </Stack>
                    <Stack
                      // direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      {schedule.workOnHoliday && (
                        <Typography variant="h6">
                          🚨 휴일 근로 신청이 있습니다!
                        </Typography>
                      )}
                      <Typography>
                        신청기간:{" "}
                        {moment(schedule.from.toDate()).format("M월 D일")} -{" "}
                        {moment(schedule.to.toDate()).format("M월 D일")}
                      </Typography>
                    </Stack>
                  </>
                ) : (
                  <Typography>아직 근로 신청을 하지 않았습니다.</Typography>
                ))}
              <ListSubheader>
                {moment(lastSelectedDate).format("M월")}
              </ListSubheader>
              {Object.keys(monthData).map((key, index) => {
                const dailyData =
                  (monthData && monthData[key]) ||
                  initialDailyData(moment(key), calendar);
                const { type } = dailyData;
                const htype = holidayType(moment(key), calendar);
                const notice =
                  htype !== "default" && type !== "offday" ? "🚨" : undefined;

                let secondaryText = notice || koreanWeekDays[moment(key).day()];
                if (htype === "vacation" || htype === "holiday")
                  secondaryText += `, ${calendar[htype][key]}`;
                const hideTimePrimary =
                  htype !== "default" && type === "offday";
                const startPrimary = hideTimePrimary
                  ? ""
                  : moment(dailyData.start.toDate()).format("HH:mm");
                const finishPrimary = hideTimePrimary
                  ? ""
                  : moment(dailyData.finish.toDate()).format("HH:mm");
                const startedSecondary = dailyData.started
                  ? `${moment(dailyData.started.toDate()).format("HH:mm")} 출근`
                  : !hideTimePrimary
                  ? "-"
                  : "";
                const finishedSecondary = dailyData.finished
                  ? `${moment(dailyData.finished.toDate()).format(
                      "HH:mm"
                    )} 퇴근`
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
                      {worktypeEmoji(type)}
                    </Box>
                    <Box width={100} mr={1}>
                      <ListItemText
                        primary={moment(key).format("D일")}
                        secondary={`${secondaryText}`}
                        sx={{
                          textAlign: "center",
                          "& .MuiListItemText-primary": {
                            fontSize: 14,
                          },
                          "& .MuiListItemText-secondary": {
                            fontSize: 12,
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ display: "flex", width: "100%" }}>
                      {type === "annual" ? (
                        <ListItemText
                          primary="연차"
                          sx={{
                            textAlign: "center",
                          }}
                        />
                      ) : type === "sick" ? (
                        <ListItemText
                          primary="병가"
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
    ? `${moment(data.started.toDate()).format("HH:mm")} 출근`
    : "-";
  const finishedText = data.finished
    ? `${moment(data.finished.toDate()).format("HH:mm")} 퇴근`
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
            primary={`${date.format("M월 D일")} ${
              type !== "work" ? worktypeEmoji(type) : ""
            }`}
            secondary={calendar[htype] ? calendar[htype][dateKey] : ""}
            primaryTypographyProps={{ variant: "h6" }}
          />
          <Button
            onClick={handleEditClick}
            disabled={user.uid === selectedUser.uid}
          >
            수정
          </Button>
        </Stack>

        <>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {type === "annual" ? (
              <ListItemText primary="연차" sx={{ textAlign: "center" }} />
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
                // width: "80%",
                // height: "80%",
                // overflowY: "scroll",
              }}
            >
              <List sx={{ p: 0 }}>
                <ListSubheader sx={{ p: 0 }}>
                  {moment(date).format("M월 D일")}
                </ListSubheader>
                <ListItemText primary="⚠️ SAVE를 클릭하지 않으면 데이터가 날아갑니다!" />
                <ListItemText
                  primary="💡 연차, 반차, 병가가 아닌 경우에는 근로를 선택해주세요."
                  secondary="(주말, 공휴일 상관 없이)"
                />
                <Divider orientation="horizontal" />
                <FormControl variant="standard">
                  <InputLabel>근로 형태</InputLabel>
                  <Select value={editData.type} onChange={handleChangeType}>
                    <MenuItem value="work">근로</MenuItem>
                    <MenuItem value="annual">연차</MenuItem>
                    <MenuItem value="half">반차</MenuItem>
                    <MenuItem value="sick">병가</MenuItem>
                  </Select>
                </FormControl>
                <Stack direction="row" sx={{ mt: 1 }}>
                  {/* <TimePicker
                    label="신청한 출근시각"
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
                    label="신청한 퇴근시각"
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
                    label="실제 출근시각"
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
                    label="실제 퇴근시각"
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
                    출퇴근시각 지우기
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
        >
          <Tab
            label="회원가입 신청"
            value="sign-in-request"
            sx={{ mr: 0, p: 0 }}
          />
          <Tab label="사내 일정" value="event" sx={{ mr: 0, p: 0 }} />
          <Tab label="휴무일" value="vacation" sx={{ mr: 0, p: 0 }} />
          <Tab label="정산일" value="payday" sx={{ mr: 0, p: 0 }} />
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
                올해 사내 일정만 표기됩니다.
              </Divider>
            </ListSubheader>

            {/* {Object.keys(calendar.event)
              .filter((key) => moment(key).year() === moment().year())
              .map((key) => (
                <Stack key={key} direction="row" justifyContent="flex-start">
                  <ListItemText secondary={moment(key).format("M/D")} />
                  <ListItemText primary={calendar.event[key]} />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteFromCalendar("event", key)}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))} */}
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
                올해 사내 휴무일만 표기됩니다.
              </Divider>
            </ListSubheader>
            <CalendarList
              htype="vacation"
              onDeleteClick={handleDeleteFromCalendar}
            />
            {/* {Object.keys(calendar.vacation)
              .filter((key) => moment(key).year() === moment().year())
              .map((key) => (
                <Typography key={key}>
                  {moment(key).format("M/D")} {calendar.vacation[key]}
                </Typography>
              ))} */}
          </List>
        </TabPanel>
        <TabPanel value="payday" sx={{ p: 0 }}>
          정산일
        </TabPanel>
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
          placeholder="내용을 입력하세요"
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
        <ListItemText primary="거절됨" />
      ) : status === "approved" ? (
        <ListItemText primary="승인됨" />
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
//     <Typography>아직 근로 신청을 하지 않았습니다.</Typography>
//   );
// };

export default Admin;
