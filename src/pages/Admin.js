import {
  collection,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "@firebase/firestore";
import React, {
  // createContext,
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
} from "@mui/material";
import Status from "../components/Status";
import { db } from "../myFirebase";
import {
  CalendarPickerSkeleton,
  LocalizationProvider,
  StaticDatePicker,
  TabContext,
  TabList,
  TabPanel,
} from "@mui/lab";
import moment from "moment";
import AdapterMoment from "@mui/lab/AdapterMoment";
import {
  fetchMonthData,
  fetchUser,
  fetchWaitingList,
  initialDailyData,
  userDocRef,
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
import { EventsContext, UserContext } from "../contexts/Context";
import { holidayType } from "../components/CustomRangeCalendar";

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
  const events = useContext(EventsContext);
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
                  monthData[date.format("YYYYMMDD")] || initialDailyData(date)
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
                  <ListItemText
                    primary="최근 근로 신청"
                    secondary={moment(schedule.createdAt.toDate()).format(
                      "M월 D일 HH:mm 신청함"
                    )}
                  />
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography>
                      {moment(schedule.from.toDate()).format("M월 D일")} -{" "}
                      {moment(schedule.to.toDate()).format("M월 D일")}
                    </Typography>
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
                </>
              ) : (
                <Typography>아직 근로 신청을 하지 않았습니다.</Typography>
              ))}
            <ListSubheader>
              {moment(lastSelectedDate).format("M월")}
            </ListSubheader>
            {Object.keys(monthData).map((key, index) => {
              const dailyData =
                (monthData && monthData[key]) || initialDailyData(moment(key));
              const { type } = dailyData;
              const htype = holidayType(moment(key), events);
              let secondaryText = koreanWeekDays[moment(key).day()];
              if (htype === "vacation" || htype === "holiday")
                secondaryText += `, ${events[htype][key]}`;
              const hideTimePrimary = htype !== "default";
              const startPrimary = hideTimePrimary
                ? ""
                : moment(dailyData.start.toDate()).format("HH:mm");
              const finishPrimary = hideTimePrimary
                ? ""
                : moment(dailyData.finish.toDate()).format("HH:mm");
              const startedSecondary = dailyData.started
                ? `${moment(dailyData.started.toDate()).format("HH:mm")} 출근`
                : htype === "default"
                ? "-"
                : "";
              const finishedSecondary = dailyData.finished
                ? `${moment(dailyData.finished.toDate()).format("HH:mm")} 퇴근`
                : htype === "default"
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
  );
};

const SelectedDateInfo = (props) => {
  const user = useContext(UserContext);
  const { date, data, selectedUser } = props;
  const events = useContext(EventsContext);
  const { type } = data;
  const htype = holidayType(moment(date), events);
  const dateKey = date.format("YYYYMMDD");

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

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <ListItemText
          primary={`${date.format("M월 D일")} ${
            type !== "work" ? worktypeEmoji(type) : ""
          }`}
          secondary={events[htype] ? events[htype][dateKey] : ""}
          primaryTypographyProps={{ variant: "h6" }}
        />
        <Button disabled={user.uid === selectedUser.uid}>수정</Button>
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
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
      {/* <Typography variant="body2">
        {moment(data.start.toDate()).format("HH:mm")} ~{" "}
        {moment(data.finish.toDate()).format("HH:mm")}
      </Typography> */}
    </Box>
  );
};
const AdminControlPanel = (props) => {
  const events = useContext(EventsContext);
  const [index, setIndex] = useState("sign-in-request");
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Paper sx={{ height: "100%", p: 1, pt: 0 }} {...props}>
      <TabContext value={index}>
        <TabList
          onChange={(event, value) => setIndex(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="회원가입 신청" value="sign-in-request" />
          <Tab label="사내 일정" value="calendar" />
          <Tab label="정산일" value="payday" />
          <Tab label="휴무일" value="holiday" />
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
        <TabPanel value="calendar" sx={{ p: 0 }}>
          {Object.keys(events.event)
            .filter((key) => moment(key).year() === moment().year())
            .map((key) => (
              <Typography key={key}>
                {moment(key).format("M/D")} {events.event[key]}
              </Typography>
            ))}
        </TabPanel>
        <TabPanel value="payday" sx={{ p: 0 }}>
          정산일
        </TabPanel>
        <TabPanel value="holiday" sx={{ p: 0 }}>
          {Object.keys(events.vacation)
            .filter((key) => moment(key).year() === moment().year())
            .map((key) => (
              <Typography key={key}>
                {moment(key).format("M/D")} {events.vacation[key]}
              </Typography>
            ))}
        </TabPanel>
      </TabContext>
    </Paper>
  );
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
