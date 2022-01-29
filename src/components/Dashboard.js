import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper as MuiPaper,
  Typography,
  experimentalStyled as styled,
  IconButton,
  TextField,
  ListItemText,
  Stack,
  ListItem,
} from "@mui/material";
import { CalendarContext, UserContext } from "../contexts/Context";
import moment from "moment";
import CustomRangeCalendar, {
  DayComponentText,
  holidayType,
} from "./CustomRangeCalendar";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import {
  fetchDayData,
  fetchMonthData,
  initialDailyData,
} from "../docFunctions";
import { blue, red, grey, green } from "@mui/material/colors";
import { CalendarPickerSkeleton, StaticDatePicker } from "@mui/lab";
import { PickersDayWithMarker, worktypeEmoji } from "./Schedule";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

const Paper = styled(MuiPaper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.primary,
  height: "100%",
}));

const Dashboard = () => {
  const user = useContext(UserContext);
  const [date, setDate] = useState(moment()); // datepicker에서 선택한 날짜
  const [data, setData] = useState({}); // 선택된 날짜가 포함된 월간+주간 데이터
  const [loading, setLoading] = useState(true);

  const handleChange = (value) => setDate(value);
  const fetchData = useCallback(
    async (date) => {
      setLoading(true);
      console.log("fetched");
      fetchMonthData(user.uid, date)
        .then((snapshot) => {
          // 이번 달 근로 정보 fetch
          const newData = {};
          snapshot.forEach(
            (doc) =>
              (newData[moment(date).date(doc.id).format("YYYYMMDD")] =
                doc.data())
          );
          setData((prev) => ({ ...prev, ...newData }));
        })
        .then(() => {
          // 이번 주 근로 정보 fetch
          const weekStart = moment(date).startOf("week");
          const weekEnd = moment(date).endOf("week");
          const responses = [];
          for (
            let d = moment(weekStart);
            d.isSameOrBefore(moment(weekEnd));
            d.add(1, "d")
          ) {
            const key = d.format("YYYYMMDD");
            responses.push(
              fetchDayData(user.uid, d).then((docSnap) => ({
                key,
                data: docSnap.exists() ? docSnap.data() : undefined,
              }))
            );
          }

          Promise.all(responses).then((snapshot) => {
            const newData = {};
            snapshot.forEach(({ key, data }) => (newData[key] = data));
            setData((prev) => ({ ...prev, ...newData }));
          });
        })
        .then(() => setLoading(false));
    },
    [user.uid]
  );

  useEffect(() => {
    setLoading(true);
    fetchData(moment());
    return () => {
      setDate(moment());
      setData();
      setLoading();
    };
  }, [fetchData]);

  return (
    <>
      <Box
        sx={{
          flexGrow: 1,
          maxWidth: 800,
        }}
      >
        <Grid container columns={{ xs: 8, sm: 8, md: 12 }} spacing={1}>
          <Grid item xs={12} sm={12} md={12}>
            <Paper>
              <WeekSummary value={date} onChange={handleChange} data={data} />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Paper
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DaySummary
                date={date}
                data={data && data[date.format("YYYYMMDD")]}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Paper sx={{ overflow: "hidden" }}>
              <MonthSummary
                value={date}
                onChange={handleChange}
                loading={loading}
                data={data}
                fetch={fetchData}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

const clock = {
  id: "clock",
  label: "clock",
  data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  backgroundColor: "gray",
  weight: 0.2,
};

const DATA_TEMPLATE_WORKTIME = {
  id: "worktime",
  label: "",
  backgroundColor: [blue[500], "lightgray"],
  borderWidth: 2,
  weight: 1,
};

const DATA_TEMPLATE_REAL_WORKTIME = {
  id: "real-worktime",
  label: "",
  backgroundColor: [green[400], "lightgray"],
  borderWidth: 0,
  weight: 1,
};

const DATA_TEMPLATE_OFFDAY = {
  id: "offday",
  label: "",
  data: [1],
  backgroundColor: [red[400]],
  weight: 1,
  borderWidth: 2,
  rotation: 0,
};

const DATA_TEMPLATE_SICK = {
  id: "sick",
  label: "",
  data: [1],
  backgroundColor: [grey[600]],
  weight: 1,
  borderWidth: 2,
  rotation: 0,
};

const OPTION_TEMPLATE = {
  layout: { margin: 0 },
  cutout: "70%",
  plugins: {
    tooltip: {
      enabled: false,
    },
  },
};

const DaySummary = (props) => {
  const { date, data } = props;
  const key = date.format("YYYYMMDD");
  const calendar = useContext(CalendarContext);
  const htype = holidayType(date, calendar);
  const eventTitle =
    (htype === "holiday" || htype === "vacation") && calendar[htype][key];
  const { start, started, finish, finished, type } =
    data || initialDailyData(date, calendar);
  const noon = moment(date).startOf("day").hour(12).toDate();
  const outerOffset =
    (((start.toDate().getTime() - noon.getTime()) / 3600000) * 30) % 360;
  const innerOffset = started
    ? (((started.toDate().getTime() - noon.getTime()) / 3600000) * 30) % 360
    : 0;
  const worktime =
    (finish.toDate().getTime() - start.toDate().getTime()) / 3600000;
  const workedtime = started
    ? finished
      ? (finished.toDate().getTime() - started.toDate().getTime()) / 3600000
      : (moment(date).toDate().getTime() - started.toDate().getTime()) / 3600000
    : 0;
  const emoji = worktypeEmoji(type);
  const wText = worktimeText(data);

  return (
    <Stack spacing={1}>
      <ListItem sx={{ m: 0, height: 50 }}>
        <ListItemText
          primary={date.format("M월 D일")}
          secondary={eventTitle}
          primaryTypographyProps={{ fontSize: 20 }}
        />
        <ListItemText
          primary={wText ? wText.difference : emoji}
          primaryTypographyProps={{ fontSize: 14, textAlign: "right" }}
          secondary={calendar.event[key]}
          secondaryTypographyProps={{ fontSize: 14, textAlign: "right" }}
        />
      </ListItem>
      <Box
        sx={{
          maxHeight: 400,
          maxWidth: 300,
          position: "relative",
        }}
      >
        <WorkTimeStatus data={data} date={date} />
        <Doughnut
          options={{
            ...OPTION_TEMPLATE,
            plugins: {
              tooltip: {
                enabled: Boolean(started),
                // enabled: (props1, props2) => {
                //   return true;
                // },
                callbacks: {
                  label: (context) => {
                    let label = "";
                    const id = context.dataset.id;
                    if (id === "worktime") {
                      label = `오늘의 근로: ${moment(start.toDate()).format(
                        "HH:mm"
                      )} - ${moment(finish.toDate()).format("HH:mm")}`;
                    } else if (id === "real-worktime") {
                      label = `실제 근로: `;
                      if (started) {
                        label += ` ${moment(started.toDate()).format("HH:mm")}`;
                        if (finished) {
                          label += ` - ${moment(finished.toDate()).format(
                            "HH:mm"
                          )}`;
                        } else {
                          label += " ~";
                        }
                      }
                    } else if (id === "clock") {
                      const idx =
                        context.dataIndex === 0
                          ? context.dataIndex + 12
                          : context.dataIndex;
                      const next = idx === 12 ? 1 : idx + 1;
                      label = `${idx}:00 - ${next}:00`;
                    }
                    return label;
                  },
                },
              },
            },
          }}
          data={{
            datasets: [
              clock,
              type === "work" || type === "half"
                ? {
                    ...DATA_TEMPLATE_WORKTIME,
                    data: [worktime, Math.max(12 - worktime, 0)],
                    rotation: outerOffset,
                  }
                : type === "annual" || type === "offday"
                ? DATA_TEMPLATE_OFFDAY
                : DATA_TEMPLATE_SICK,
              {
                ...DATA_TEMPLATE_REAL_WORKTIME,
                data: [workedtime, Math.max(12 - workedtime, 0)],
                rotation: innerOffset,
              },
            ],
          }}
        />
        {/* {htype === "holiday" || htype === "vacation" ? (
          <>
            <Typography
              variant="h5"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {calendar[htype][key]}
            </Typography>
            <Doughnut
              options={OPTION_TEMPLATE}
              data={{
                datasets: [clock, DATA_TEMPLATE_OFFDAY],
              }}
            />
          </>
        ) : type === "work" ? (
          <>
            <WorkTimeStatus data={data} date={date} />
            <Doughnut
              options={{
                ...OPTION_TEMPLATE,
                plugins: {
                  tooltip: {
                    enabled: (props1, props2) => {
                      return true;
                    },
                    callbacks: {
                      label: (context) => {
                        let label = "";
                        const id = context.dataset.id;
                        if (id === "worktime") {
                          label = `오늘의 근로: ${moment(start.toDate()).format(
                            "HH:mm"
                          )} - ${moment(finish.toDate()).format("HH:mm")}`;
                        } else if (id === "real-worktime") {
                          label = `실제 근로: `;
                          if (started) {
                            label += ` ${moment(started.toDate()).format(
                              "HH:mm"
                            )}`;
                            if (finished) {
                              label += ` - ${moment(finished.toDate()).format(
                                "HH:mm"
                              )}`;
                            } else {
                              label += " ~";
                            }
                          }
                        } else if (id === "clock") {
                          const idx =
                            context.dataIndex === 0
                              ? context.dataIndex + 12
                              : context.dataIndex;
                          const next = idx === 12 ? 1 : idx + 1;
                          label = `${idx}:00 - ${next}:00`;
                        }
                        return label;
                      },
                    },
                  },
                },
              }}
              data={{
                datasets: [
                  clock,
                  {
                    ...DATA_TEMPLATE_WORKTIME,
                    data: [worktime, Math.max(12 - worktime, 0)],
                    rotation: outerOffset,
                  },
                  {
                    ...DATA_TEMPLATE_REAL_WORKTIME,
                    data: [workedtime, Math.max(12 - workedtime, 0)],
                    rotation: innerOffset,
                  },
                ],
              }}
            />
          </>
        ) : type === "annual" ? (
          <>
            <Typography
              variant="h4"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              연차
            </Typography>
            <Doughnut
              options={OPTION_TEMPLATE}
              data={{
                datasets: [
                  clock,
                  {
                    ...DATA_TEMPLATE_OFFDAY,
                    id: "annual",
                  },
                ],
              }}
            />
          </>
        ) : type === "half" ? (
          <>
            <WorkTimeStatus data={data} date={date} />
            <Doughnut
              options={{
                ...OPTION_TEMPLATE,
                plugins: {
                  tooltip: {
                    enabled: (props1, props2) => {
                      return true;
                    },
                    callbacks: {
                      label: (context) => {
                        let label = "";
                        const id = context.dataset.id;
                        if (id === "worktime") {
                          label = `오늘의 근로: ${moment(start.toDate()).format(
                            "HH:mm"
                          )} - ${moment(finish.toDate()).format("HH:mm")}`;
                        } else if (id === "real-worktime") {
                          label = `실제 근로: `;
                          if (started) {
                            label += ` ${moment(started.toDate()).format(
                              "HH:mm"
                            )}`;
                            if (finished) {
                              label += ` - ${moment(finished.toDate()).format(
                                "HH:mm"
                              )}`;
                            } else {
                              label += " ~";
                            }
                          }
                        } else if (id === "clock") {
                          const idx =
                            context.dataIndex === 0
                              ? context.dataIndex + 12
                              : context.dataIndex;
                          const next = idx === 12 ? 1 : idx + 1;
                          label = `${idx}:00 - ${next}:00`;
                        }
                        return label;
                      },
                    },
                  },
                },
              }}
              data={{
                datasets: [
                  clock,
                  {
                    ...DATA_TEMPLATE_WORKTIME,
                    data: [worktime, Math.max(12 - worktime, 0)],
                    rotation: outerOffset,
                  },
                  {
                    ...DATA_TEMPLATE_REAL_WORKTIME,
                    data: [0, workedtime, Math.max(12 - workedtime, 0)],
                    rotation: innerOffset,
                  },
                ],
              }}
            />
          </>
        ) : type === "sick" ? (
          <>
            <Typography
              variant="h4"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              병가
            </Typography>
            <Doughnut
              options={OPTION_TEMPLATE}
              data={{
                datasets: [clock, DATA_TEMPLATE_SICK],
              }}
            />
          </>
        ) : (
          <>type 오류!</>
        )} */}
      </Box>
    </Stack>
  );
};

const WorkTimeStatus = (props) => {
  const {
    data,
    // date
  } = props;
  const Container = (props) => (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      {...props}
    />
  );

  if (!data)
    return (
      <Container>
        <ListItemText
          primary="😁"
          primaryTypographyProps={{ fontSize: 20 }}
          secondary={
            <>
              근로 정보가 없습니다.
              <br />
              근로 신청을 해주세요!
            </>
          }
        />
      </Container>
    );

  const { start, started, finish, finished, type } = data;
  // const htype = holidayType(date);
  const worked = Boolean(started);
  const startText =
    type === "offday" ? "-" : moment(start.toDate()).format("HH:mm");
  const finishText =
    type === "offday" ? "-" : moment(finish.toDate()).format("HH:mm");
  const startedText = started ? moment(started.toDate()).format("HH:mm") : "";
  const finishedText = finished
    ? moment(finished.toDate()).format("HH:mm")
    : "";

  return (
    <Container>
      {type === "work" || worked ? (
        <>
          <ListItemText
            primary={startText}
            secondary={startedText}
            primaryTypographyProps={{ fontSize: 20 }}
          />
          <KeyboardArrowDownIcon />
          <ListItemText
            primary={finishText}
            secondary={finishedText}
            primaryTypographyProps={{ fontSize: 20 }}
          />
        </>
      ) : (
        <ListItemText
          primary="😉"
          primaryTypographyProps={{ fontSize: 20 }}
          secondary="출퇴근 기록이 없습니다."
        />
      )}
    </Container>
  );
};

const WeekSummary = (props) => {
  const { value, onChange, data } = props;

  const startDate = moment(value).startOf("week");
  const endDate = moment(value).endOf("week");
  return (
    <>
      <CalendarLabel calendarStart={startDate} calendarEnd={endDate} />
      <CustomRangeCalendar
        calendarStart={startDate}
        calendarEnd={endDate}
        value={value}
        onChange={onChange}
        dayComponent={WeekDayComponent}
        data={data}
      />
    </>
  );
};

const WeekDayComponent = (props) => {
  const { value, today, outOfRange, selected, onClick, data } = props;
  // const key = value.format("YYYYMMDD");
  // const showText = Boolean(data);
  const wText = worktimeText(data);

  return (
    <Stack
      // justifyContent="center"
      alignItems="center"
      sx={{
        width: "100%",
        // height: 70,
        // bgcolor: "green",
      }}
    >
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
      {wText && <ListItemText secondary={wText.difference} />}
    </Stack>
  );
};

const MonthSummary = (props) => {
  const { value, onChange, data, fetch, loading } = props;
  return (
    <StaticDatePicker
      displayStaticWrapperAs="desktop"
      value={value}
      onChange={onChange}
      minDate={moment("2021-01-01")}
      renderInput={(props) => <TextField {...props} variant="standard" />}
      renderDay={(day, _value, props) => {
        const key = day.format("YYYYMMDD");
        return (
          <PickersDayWithMarker
            {...props}
            type={data[key] ? data[key].type : undefined}
          />
        );
      }}
      onMonthChange={(date) => fetch(date)}
      loading={loading}
      renderLoading={() => <CalendarPickerSkeleton />}
    />
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

const worktimeText = (data) => {
  if (!data) return null;

  const { start, started, finish, finished } = data;

  const workMinutes =
    (finish.toDate().getTime() - start.toDate().getTime()) / 60000;
  const workedMinutes = started
    ? finished
      ? (finished.toDate().getTime() - started.toDate().getTime()) / 60000
      : moment(started.toDate()).isSame(moment(), "d")
      ? (moment().toDate().getTime() - started.toDate().getTime()) / 60000
      : 0
    : 0;
  const diffMinutes = Math.round(workedMinutes - workMinutes);

  const timeHour = Math.floor(workedMinutes / 60);
  const timeMinute = Math.round(workedMinutes % 60);
  const time = timeHour > 0 ? `${timeHour}h ${timeMinute}m` : `${timeMinute}m`;

  const diffHour = Math.floor(Math.abs(diffMinutes) / 60);
  const diffMinute = Math.round(Math.abs(diffMinutes) % 60);
  const difference =
    diffMinutes > 0
      ? `+${(diffHour && diffHour) || ""}h ${diffMinute}m`
      : `-${(diffHour && diffHour) || ""}h ${diffMinute}m`;

  return { time, difference };
};

export default Dashboard;
