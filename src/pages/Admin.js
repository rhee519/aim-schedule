import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Divider,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Skeleton,
  List,
  ListItemText,
  ListSubheader,
  Typography,
} from "@mui/material";
import Status from "../components/Status";
import { db } from "../myFirebase";
import {
  CalendarPickerSkeleton,
  LocalizationProvider,
  StaticDatePicker,
} from "@mui/lab";
import moment from "moment";
import AdapterMoment from "@mui/lab/AdapterMoment";
import { fetchMonthData, initialDailyData } from "../docFunctions";
import { PickersDayWithMarker, worktypeEmoji } from "../components/Schedule";

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
          <AdminNotificationPanel />
        </Grid>
        <Grid item xs={12} md={6}>
          {loading ? (
            <UserListSkeleton />
          ) : (
            <UserListPanel users={userList} onClick={setSelectedUser} />
          )}
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
    <Paper sx={{ p: 1 }}>
      <Stack>
        <UserStatusSkeleton />
        <Divider variant="middle" sx={{ mb: 1 }} />
        <UserStatusSkeleton />
        <Divider variant="middle" sx={{ mb: 1 }} />
        <UserStatusSkeleton />
      </Stack>
    </Paper>
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
  const { users, onClick } = props;
  return (
    <Paper
      sx={{
        maxHeight: 400,
        overflowY: "auto",
        p: 1,
      }}
    >
      {users.map((user, index) => (
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
      ))}
    </Paper>
  );
};

const UserDisplay = (props) => {
  const { user } = props;
  const [date, setDate] = useState(moment());
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSelectedDate, setLastSelectedDate] = useState(moment());

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
                date={date}
                data={
                  monthData[date.format("YYYYMMDD")] || initialDailyData(date)
                }
              />
            </Box>
          </Stack>
          <List
            sx={{
              width: "100%",
              height: { xs: "auto", md: 700 },
              overflowY: "scroll",
              pt: 0,
            }}
          >
            <ListSubheader>
              {moment(lastSelectedDate).format("M월")}
            </ListSubheader>
            {Object.keys(monthData).map((key, index) => {
              const dailyData =
                (monthData && monthData[key]) || initialDailyData(moment(key));
              const { type } = dailyData;
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
                  <Box width={40} mr={1}>
                    <ListItemText
                      primary=""
                      secondary={moment(key).format("D일")}
                      sx={{
                        textAlign: "right",
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
                          primary={moment(dailyData.start.toDate()).format(
                            "HH:mm"
                          )}
                          secondary={
                            dailyData.started
                              ? `${moment(dailyData.started.toDate()).format(
                                  "HH:mm"
                                )} 출근`
                              : "-"
                          }
                          sx={{ textAlign: "center" }}
                        />
                        <ListItemText
                          primary={moment(dailyData.finish.toDate()).format(
                            "HH:mm"
                          )}
                          secondary={
                            dailyData.finished
                              ? `${moment(dailyData.finished.toDate()).format(
                                  "HH:mm"
                                )} 퇴근`
                              : "-"
                          }
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
  const { date, data } = props;
  // console.log(data);
  return (
    <Box>
      <Typography variant="h6">{date.format("M월 D일")}</Typography>
      <Typography variant="body2">
        {moment(data.start.toDate()).format("HH:mm")} ~{" "}
        {moment(data.finish.toDate()).format("HH:mm")}
      </Typography>
    </Box>
  );
};
const AdminNotificationPanel = (props) => {
  return (
    <Paper sx={{ height: "100%" }} {...props}>
      회원가입 신청 목록 여기에 띄우기.
    </Paper>
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
