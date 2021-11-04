import React, { useEffect, useState } from "react";
import { Box } from "@mui/system";
import {
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import moment from "moment";
// import { LocalizationProvider, StaticDatePicker } from "@mui/lab";
// import AdapterMoment from "@mui/lab/AdapterMoment";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

const DateComponent = ({ day, isWeekend, outOfMonth }) => {
  const [hour, setHour] = useState(isWeekend ? 0 : 8);
  return (
    <Grid item xs={2}>
      <Paper>
        {/* {day.date()} */}
        <FormControl fullWidth>
          <InputLabel>{day.date()}</InputLabel>
          <Select
            value={hour}
            onChange={({ target: { value } }) => setHour(value)}
            disabled={outOfMonth}
          >
            <MenuItem value={0}>0시간</MenuItem>
            <MenuItem value={1}>1시간</MenuItem>
            <MenuItem value={2}>2시간</MenuItem>
            <MenuItem value={3}>3시간</MenuItem>
            <MenuItem value={4}>4시간</MenuItem>
            <MenuItem value={5}>5시간</MenuItem>
            <MenuItem value={6}>6시간</MenuItem>
            <MenuItem value={7}>7시간</MenuItem>
            <MenuItem value={8}>8시간</MenuItem>
            <MenuItem value={9}>9시간</MenuItem>
            <MenuItem value={10}>10시간</MenuItem>
            <MenuItem value={11}>11시간</MenuItem>
            <MenuItem value={12}>12시간</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </Grid>
  );
};

const WeekWrapper = () => {
  return (
    <>
      {weekdays.map((value, index) => (
        <Grid key={index} item xs={2}>
          <Paper>{value}</Paper>
        </Grid>
      ))}
    </>
  );
};

const CustomCalendar = ({ startDate, endDate }) => {
  // const calendarStart = moment(startDate).startOf("week");
  // const calendarEnd = moment(endDate).endOf("week");
  // const [selectedDate, setDate] = useState(startDate);
  const [workDays, setWorkDays] = useState([]);

  useEffect(() => {
    const days = [];
    const nextFirstDay = moment(startDate).endOf("month").add(1, "d");
    const calendarStart = moment(startDate).startOf("week");
    const calendarEnd = moment(nextFirstDay).add(23, "d").endOf("week");
    for (let i = calendarStart; i.isSameOrBefore(calendarEnd); i.add(1, "d")) {
      days.push(moment(i));
    }
    setWorkDays(days);
    // console.log(startDate);
  }, [startDate]);
  // console.log(workDays);
  return (
    <Box>
      <Typography variant="h3">{`${moment(startDate).format(
        "YYYY년 MM월 DD일"
      )} ~ ${moment(endDate).format("YYYY년 MM월 DD일")}`}</Typography>
      <Grid container columns={14}>
        <WeekWrapper />
        {workDays.map((value, index) => (
          <DateComponent
            key={index}
            day={value}
            isWeekend={value.get("day") === 0 || value.get("day") === 6}
            outOfMonth={value.isBefore(startDate) || value.isAfter(endDate)}
          />
        ))}
      </Grid>
    </Box>
  );
};

export default CustomCalendar;
