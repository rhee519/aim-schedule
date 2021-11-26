import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper as MuiPaper,
  Typography,
  experimentalStyled as styled,
  IconButton,
  LinearProgress,
  Stack,
} from "@mui/material";
import { UserContext } from "../contexts/Context";
import moment from "moment";
import { collection, doc, getDocs } from "@firebase/firestore";
import { db } from "../myFirebase";
import CustomRangeCalendar, {
  CustomDayComponent,
  DayComponentText,
  getMonthRange,
} from "./CustomRangeCalendar";

const Paper = styled(MuiPaper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.primary,
  height: "100%",
}));

const { startDate, endDate } = getMonthRange();

const Dashboard = () => {
  const userData = useContext(UserContext);
  const [date, setDate] = useState(moment());
  const [monthData, setMonthData] = useState({});

  const handleChange = (value) => setDate(value);

  const fetchData = useCallback(async () => {
    const docRef = doc(
      db,
      `userlist/${userData.uid}/schedule/${endDate.year()}`
    );
    const collectionRef = collection(
      docRef,
      `${startDate.format("YYYYMMDD")}-${endDate.format("YYYYMMDD")}`
    );
    await getDocs(collectionRef).then((querySnap) => {
      const data = {};
      querySnap.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setMonthData(data);
    });
  }, [userData.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container columns={{ xs: 8, sm: 8, md: 12 }} spacing={1}>
        <Grid item xs={12} sm={12} md={12}>
          <Paper>
            <WeekSummary
              value={date}
              onChange={handleChange}
              data={monthData}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Paper>
            <DaySummary value={date} data={monthData} />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Paper>
            <MonthSummary
              value={date}
              onChange={handleChange}
              data={monthData}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const DaySummary = (props) => {
  const { value, data } = props;
  const dailyData = data ? data[moment(value).format("YYYYMMDD")] : undefined;
  return dailyData ? (
    <>
      <Box display="flex">
        <Typography variant="body2">{value.month() + 1}</Typography>
        <Typography variant="body2">월</Typography>
        <Typography variant="body2">{value.date()}</Typography>
        <Typography variant="body2">일</Typography>
      </Box>
      {dailyData.started ? (
        <Typography>
          출근 시간: {moment(dailyData.start.toDate()).format("HH:mm")}
        </Typography>
      ) : (
        <Typography>아직 출근을 안 했어요.</Typography>
      )}
      {/* <Typography>
        출근 시간: {moment(dailyData.start.toDate()).format("HH:mm")}
      </Typography>
      <Typography>
        퇴근 시간: {moment(dailyData.finish.toDate()).format("HH:mm")}
      </Typography> */}
      <Box sx={{ width: "100%" }}>
        <Stack>
          <LinearProgress variant="determinate" value={30} />
          <Box display="flex" justifyContent="space-between">
            <Typography>09:00</Typography>
            <Typography>18:00</Typography>
          </Box>
        </Stack>
      </Box>
    </>
  ) : (
    <>loading...</>
  );
};

const WeekSummary = (props) => {
  const { value, onChange } = props;
  const startDate = moment().startOf("week");
  const endDate = moment().endOf("week");
  return (
    <>
      <CalendarLabel calendarStart={startDate} calendarEnd={endDate} />
      <CustomRangeCalendar
        calendarStart={startDate}
        calendarEnd={endDate}
        value={value}
        onChange={onChange}
        dayComponent={DayComponentProgress}
      />
      <p>주간 정보 표시</p>
    </>
  );
};

const DayComponentProgress = (props) => {
  const { value, today, outOfRange, selected, onClick } = props;

  return (
    <Box>
      <IconButton
        size="small"
        sx={{
          width: 36,
          height: 36,
          bgcolor: selected ? "primary.main" : "none",
          "&:hover": {
            bgcolor: selected ? "primary.main" : "",
          },
        }}
        disabled={outOfRange}
        onClick={onClick}
      >
        <DayComponentText
          value={value}
          today={today}
          outOfRange={outOfRange}
          selected={selected}
        />
      </IconButton>
    </Box>
  );
};

const MonthSummary = (props) => {
  const { value, onChange } = props;
  return (
    <>
      <CalendarLabel calendarStart={startDate} calendarEnd={endDate} />
      <CustomRangeCalendar
        calendarStart={moment(startDate)}
        calendarEnd={moment(endDate)}
        value={value}
        onChange={onChange}
        dayComponent={CustomDayComponent}
      />
    </>
  );
};

const CalendarLabel = ({ calendarStart, calendarEnd }) => (
  <Box sx={{ display: "flex", alignItems: "flex-end", mb: 1 }}>
    <Typography variant="subtitle2" mr={0.5}>
      {calendarStart.format("MMMM")}
    </Typography>
    <Typography variant="caption">{calendarStart.format("Do")}</Typography>
    <Typography variant="body1" ml={1} mr={1} fontSize={12}>
      ~
    </Typography>
    <Typography variant="subtitle2" mr={0.5}>
      {calendarEnd.format("MMMM")}
    </Typography>
    <Typography variant="caption">{calendarEnd.format("Do")}</Typography>
  </Box>
);

export default Dashboard;
