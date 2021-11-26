import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Tab,
  Typography,
  Button,
  Skeleton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Status from "../components/Status";
import { db } from "../myFirebase";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import moment from "moment";
import CustomRangeCalendar, {
  getMonthRange,
  getNextMonthRange,
} from "../components/CustomRangeCalendar";
import Loading from "../components/Loading";

const { startDate, endDate } = getMonthRange(moment());
const { nextStartDate, nextEndDate } = getNextMonthRange(moment());

const Admin = () => {
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserList = useCallback(async () => {
    setLoading(true);
    const collectionRef = collection(db, "userlist");
    const fetchedList = [];
    const querySnap = await getDocs(collectionRef);
    querySnap.forEach((doc) => {
      fetchedList.push({
        ...doc.data(),
      });
    });
    setUserList(fetchedList);
    setLoading(false);
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
        <React.Fragment key={index}>
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
        </React.Fragment>
      ))}
    </Paper>
  );
};

const UserDisplay = (props) => {
  const { user } = props;
  const [value, setValue] = useState("1");
  const [thisMonth, setThisMonth] = useState({});
  const [nextMonth, setNextMonth] = useState({});
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);

  const handleChange = (event, value) => setValue(value);

  const fetchData = useCallback(async () => {
    setLoading1(true);
    setLoading2(true);
    const thisMonthRef = collection(
      db,
      `userlist/${user.uid}/schedule/${moment(endDate).year()}/${moment(
        startDate
      ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}`
    );
    const nextMonthRef = collection(
      db,
      `userlist/${user.uid}/schedule/${moment(nextEndDate).year()}/${moment(
        nextStartDate
      ).format("YYYYMMDD")}-${moment(nextEndDate).format("YYYYMMDD")}`
    );

    // fetch this month
    await getDocs(thisMonthRef)
      .then((querySnap) => {
        const data = {};
        querySnap.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setThisMonth(data);
      })
      .then(() => setLoading1(false));
    await getDocs(nextMonthRef)
      .then((querySnap) => {
        const data = {};
        querySnap.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setNextMonth(data);
      })
      .then(() => setLoading2(false));
  }, [user.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  console.log(thisMonth, nextMonth);

  return (
    <Paper>
      <ListItem
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Status user={user} />
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "flex-end" }}>
          <IconButton size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItem>
      <Box>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange}>
              <Tab label="이번 달 스케줄 조회" value="1" />
              <Tab label="다음 달 스케줄 신청" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">
            <UserScheduleCheck loading={loading1} />
          </TabPanel>
          <TabPanel value="2">
            <UserScheduleApplication
              {...props}
              loading={loading2}
              monthData={nextMonth}
            />
          </TabPanel>
        </TabContext>
      </Box>
    </Paper>
  );
};

const AdminNotificationPanel = (props) => {
  return (
    <Paper sx={{ height: "100%" }} {...props}>
      admin notification panel
    </Paper>
  );
};

const UserScheduleCheck = (props) => {
  const [date, setDate] = useState();
  return (
    <>
      <CustomRangeCalendar
        calendarStart={startDate}
        calendarEnd={endDate}
        value={date}
        onChange={(value) => setDate(value)}
        dayComponent={ScheduleCheckDayComponent}
      />
    </>
  );
};

const ScheduleCheckDayComponent = (props) => {
  const {
    value,
    // today, outOfRange, selected, onClick
  } = props;

  return <Box sx={{}}>{value.format("M/D")}</Box>;
};

const UserScheduleApplication = (props) => {
  const { user, loading, monthData } = props;
  console.log(user);

  return loading ? (
    <Loading />
  ) : monthData && monthData.info && monthData.info.type === "submitted" ? (
    <Box>
      <Button variant="contained" size="small">
        confirm
      </Button>
      <Typography>hi</Typography>
    </Box>
  ) : (
    <Typography>아직 근로 신청을 하지 않았습니다.</Typography>
  );
};

export default Admin;
