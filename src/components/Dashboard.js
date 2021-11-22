import React, { useContext, useMemo, useState } from "react";
import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { experimentalStyled as styled } from "@mui/material";
import { UserContext } from "../contexts/Context";
import {
  // CustomCalendar,
  getMonthRange,
} from "./CustomCalendar";
import moment from "moment";
// import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
// import AdapterMoment from "@mui/lab/AdapterMoment";

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.primary,
}));

const { startDate, endDate } = getMonthRange();

const Dashboard = () => {
  const userData = useContext(UserContext);
  console.log(userData);
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        columns={
          { xs: 8, sm: 8, md: 12 }
          // 12
        }
        spacing={1}
      >
        <Grid item xs={12} sm={12} md={12}>
          <Item>
            <WeekSummary />
          </Item>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Item>Day</Item>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Item>
            <MonthSummary />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

const WeekSummary = () => {
  const startDate = moment().startOf("week");
  const endDate = moment().endOf("week");
  return (
    <>
      {/* <Typography variant="h6">{`${moment(startDate).format(
        "YYYY년 MM월 DD일"
      )} ~ ${moment(endDate).format("YYYY년 MM월 DD일")}`}</Typography> */}
      <CustomRangeCalendar
        calendarStart={startDate}
        calendarEnd={endDate}
        onChange={() => {}}
      />
    </>
  );
};

const MonthSummary = () => {
  // const today = new Date();
  const [date, setDate] = useState();
  // const startDate =
  //   today.getDate() < 25
  //     ? moment(today).startOf("month").subtract(1, "M").date(25)
  //     : moment(today).date(25);
  // const endDate = moment(startDate).endOf("month").add(24, "d");
  return (
    <CustomRangeCalendar
      calendarStart={moment(startDate)}
      calendarEnd={moment(endDate)}
      value={date}
      onChange={(value) => setDate(value)}
    />
    // <LocalizationProvider dateAdapter={AdapterMoment}>
    //   <StaticDatePicker
    //     displayStaticWrapperAs="desktop"
    //     value={date1}
    //     onChange={(value) => {
    //       setDate1(value);
    //       setDate2(null);
    //     }}
    //     defaultCalendarMonth={startDate}
    //     minDate={startDate}
    //     maxDate={moment(startDate).endOf("month")}
    //     renderInput={(props) => null}
    //   />
    //   <StaticDatePicker
    //     displayStaticWrapperAs="desktop"
    //     value={date2}
    //     onChange={(value) => {
    //       setDate2(value);
    //       setDate1(null);
    //     }}
    //     minDate={moment(endDate).startOf("month")}
    //     maxDate={endDate}
    //     renderInput={(props) => null}
    //   />
    // </LocalizationProvider>
  );
};

const CustomRangeCalendar = (props) => {
  const { calendarStart, calendarEnd, value, onChange } = props;
  const range = useMemo(() => {
    const r = [];
    for (
      let date = moment(calendarStart).startOf("week");
      date.isSameOrBefore(moment(calendarEnd).endOf("week"));
      date.add(1, "d")
    ) {
      r.push(moment(date));
    }
    return r;
  }, [calendarStart, calendarEnd]);
  return (
    <>
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

      <WeekWrapper />
      <Divider />
      <Grid container columns={7}>
        {range.map((date, index, array) => (
          <Grid item xs={1} key={index}>
            <CustomDayComponent
              value={date}
              today={moment().format("YMD") === date.format("YMD")}
              outOfRange={
                date.isBefore(calendarStart.startOf("day")) ||
                date.isAfter(calendarEnd.endOf("day"))
              }
              selected={value && value.format("YMD") === date.format("YMD")}
              onClick={() => onChange(date)}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const CustomDayComponent = (props) => {
  const { value, today, outOfRange, selected, onClick } = props;
  return (
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
      <Box>
        <Typography
          variant="body2"
          sx={{
            color: outOfRange
              ? "text.disabled"
              : selected
              ? "background.paper"
              : value.day() === 0
              ? "error.main"
              : value.day() === 6
              ? "primary.main"
              : "text.primary",
            fontSize: 11,
            fontWeight: selected ? 700 : 400,
            textDecoration: today ? "underline" : "none",
          }}
        >
          {value.format("D")}
        </Typography>
      </Box>
    </IconButton>
  );
};
const WeekWrapper = () => {
  return (
    <Grid container columns={7}>
      {weekdays.map((value, index) => (
        <Grid item xs={1} key={index}>
          <Typography
            variant="body2"
            sx={{
              color:
                index === 0
                  ? "error.main"
                  : index === 6
                  ? "primary.main"
                  : "text.secondary",
              fontSize: 12,
            }}
          >
            {value}
          </Typography>
        </Grid>
      ))}
    </Grid>
  );
};

export default Dashboard;
