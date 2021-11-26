import {
  Box,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  experimentalStyled as styled,
  Paper,
} from "@mui/material";
import moment from "moment";
import React, { useMemo } from "react";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
export const isHoliday = (date) => {
  // 추후에 한국 공휴일 API 긁어와서 포함시키자!
  return moment(date).day() === 0 || moment(date).day() === 6;
};

export const workdays = (startDate, endDate) => {
  // 해당 기간의 실제 근로일수
  // 추후에 한국 공휴일 API 긁어와서 적용시켜야 함!!!
  let count = 0;
  for (
    let date = moment(startDate);
    date.isSameOrBefore(endDate.endOf("day"));
    date.add(1, "d")
  ) {
    if (!isHoliday(date)) count++;
  }
  return count;
};

export const CalendarContainer = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(1),
  height: "100%",
}));

const CustomRangeCalendar = (props) => {
  const { calendarStart, calendarEnd, value, onChange, dayComponent } = props;
  const DayComponent = dayComponent;
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
      <WeekWrapper />
      <Divider light sx={{ mb: 0.5 }} />
      <Grid
        container
        columns={7}
        sx={{
          minHeight: 500,
          height: "40vh",
          overflowY: "scroll",
        }}
      >
        {range.map((date, index, array) => (
          <Grid
            item
            xs={1}
            key={index}
            sx={{
              display: "flex",
              justifyContent: "center",
              // borderCollapse: "collapse",
              // border: "1px solid #000",
            }}
          >
            {DayComponent && (
              <DayComponent
                value={date}
                today={moment().format("YMD") === date.format("YMD")}
                outOfRange={
                  date.isBefore(calendarStart.startOf("day")) ||
                  date.isAfter(calendarEnd.endOf("day"))
                }
                selected={value && value.format("YMD") === date.format("YMD")}
                onClick={() => onChange(date)}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export const CustomDayComponent = (props) => {
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
      <DayComponentText
        value={value}
        today={today}
        outOfRange={outOfRange}
        selected={selected}
      />
    </IconButton>
  );
};

export const DayComponentText = (props) => {
  const { value, today, outOfRange, selected } = props;
  const showMonth = value.month() !== moment(value).subtract(1, "d").month();
  const showYear = value.year() !== moment(value).subtract(1, "d").year();
  return (
    <Box display="flex" alignItems="center" justifyContent="center">
      <Stack spacing={-0.25}>
        <Typography
          variant="body2"
          fontSize={8}
          color={selected ? "background.paper" : "inherit"}
        >
          {showMonth && value.format("MMM")}
        </Typography>
        <Typography
          variant="body2"
          color={
            outOfRange
              ? "text.disabled"
              : selected
              ? "background.paper"
              : value.day() === 0
              ? "error.main"
              : value.day() === 6
              ? "primary.main"
              : "text.primary"
          }
          fontSize={11}
          fontWeight={selected ? 700 : 400}
          textDecoration={today ? "underline" : "none"}
        >
          {value.format("D")}
        </Typography>
        <Typography
          variant="body2"
          fontSize={8}
          color={selected ? "background.paper" : "inherit"}
        >
          {showYear && value.year()}
        </Typography>
      </Stack>
    </Box>
  );
};

const WeekWrapper = () => {
  return (
    <Grid container columns={7}>
      {weekdays.map((value, index) => (
        <Grid item xs={1} key={index}>
          <Typography
            variant="body2"
            textAlign="center"
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

export const getMonthRange = (date) => {
  // 오늘을 포함하는 25일 ~ 24일 범위를 return!
  const dateClone = moment(date);
  const startDate =
    dateClone.date() < 25
      ? dateClone.subtract(1, "month").date(25)
      : dateClone.date(25);
  const endDate = moment(startDate).add(1, "month").date(24);
  return { startDate, endDate };
};

export const getNextMonthRange = (date) => {
  // 다음 25일 ~ 24일 범위를 return!
  const dateClone = moment(date);
  const nextStartDate =
    dateClone.date() < 25
      ? dateClone.date(25)
      : dateClone.endOf("month").add(25, "d");
  const nextEndDate = moment(nextStartDate)
    .add(1, "month")
    .date(24)
    .endOf("day");
  return { nextStartDate, nextEndDate };
};

export default CustomRangeCalendar;
