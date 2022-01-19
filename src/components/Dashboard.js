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
import { EventsContext, UserContext } from "../contexts/Context";
import moment from "moment";
import CustomRangeCalendar, {
  DayComponentText,
  holidayType,
} from "./CustomRangeCalendar";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { fetchMonthData, initialDailyData } from "../docFunctions";
import { blue, red, grey } from "@mui/material/colors";
import {
  CalendarPickerSkeleton,
  LocalizationProvider,
  StaticDatePicker,
} from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
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
  const [data, setData] = useState({}); // 선택된 날짜가 포함된 월간 데이터
  const [loading, setLoading] = useState(true);

  const handleChange = (value) => setDate(value);
  const refetchData = useCallback(
    async (date) => {
      setLoading(true);
      setDate(date);
      fetchMonthData(user.uid, date)
        .then((snapshot) => {
          const data = {};
          for (
            let d = moment(date).startOf("month").startOf("week");
            d.isSameOrBefore(moment(date).endOf("month").endOf("week"), "day");
            d.add(1, "d")
          ) {
            const key = d.format("YYYYMMDD");
            data[key] = undefined;
          }
          snapshot.forEach(
            (doc) =>
              (data[moment(date).date(doc.id).format("YYYYMMDD")] = doc.data())
          );
          setData((prev) => ({ ...prev, ...data }));
        })
        .then(() => setLoading(false));
    },
    [user.uid]
  );

  useEffect(() => {
    refetchData(moment());
    return () => {
      setData();
      setDate(moment());
      setLoading();
    };
  }, [refetchData]);

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
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
            <Paper>
              <MonthSummary
                value={date}
                onChange={handleChange}
                loading={loading}
                data={data}
                fetch={refetchData}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

const DaySummary = (props) => {
  const { date, data } = props;
  const key = date.format("YYYYMMDD");
  const events = useContext(EventsContext);
  const htype = holidayType(date, events);
  const { start, started, finish, finished, type } =
    data || initialDailyData(date);
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
  const diffMinutes = Math.round((workedtime - worktime) * 60);
  const diffString =
    diffMinutes > 0
      ? `+${Math.floor(diffMinutes / 60)}시간 ${diffMinutes % 60}분`
      : `-${Math.floor(-diffMinutes / 60)}시간 ${-diffMinutes % 60}분`;
  const emoji = worktypeEmoji(type);

  const clock = {
    id: "clock",
    label: "clock",
    data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    backgroundColor: "gray",
    weight: 0.2,
  };

  return (
    <Stack spacing={1}>
      <ListItem sx={{ m: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Typography
            variant="h5"
            sx={{
              // position: "absolute",
              // top: 0,
              // left: 0,
              // width: "80%",
              textAlign: "left",
              // m: 1,
            }}
          >
            {date.format("M월 D일")}
          </Typography>
          <Typography variant="body2">
            {workedtime > 0 ? diffString : emoji}
          </Typography>
        </Stack>
      </ListItem>
      <Box
        sx={{
          maxHeight: 400,
          maxWidth: 300,
        }}
      >
        <Box sx={{ position: "relative" }}>
          {htype === "holiday" || htype === "vacation" ? (
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
                {events[htype][key]}
              </Typography>
              <Doughnut
                options={{
                  layout: {
                    margin: 0,
                  },
                  cutout: "70%",
                  plugins: {
                    tooltip: {
                      enabled: false,
                    },
                  },
                }}
                data={{
                  datasets: [
                    clock,
                    {
                      id: htype,
                      label: "",
                      data: [1],
                      backgroundColor: [red[400]],
                      weight: 2,
                      borderWidth: 0,
                    },
                  ],
                }}
              />
            </>
          ) : type === "work" ? (
            <>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <ListItemText
                  primary={moment(start.toDate()).format("HH:mm")}
                  secondary={
                    started ? moment(started.toDate()).format("HH:mm") : ""
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: 20,
                    },
                  }}
                />
                <KeyboardArrowDownIcon />
                <ListItemText
                  primary={moment(finish.toDate()).format("HH:mm")}
                  secondary={
                    finished ? moment(finished.toDate()).format("HH:mm") : ""
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: 20,
                    },
                  }}
                />
              </Box>
              <Doughnut
                style={{
                  margin: 0,
                  padding: 0,
                  maxWidth: 700,
                }}
                options={{
                  layout: {
                    margin: 0,
                  },
                  cutout: "70%",
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
                            label = `오늘의 근로: ${moment(
                              start.toDate()
                            ).format("HH:mm")} - ${moment(
                              finish.toDate()
                            ).format("HH:mm")}`;
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
                      id: "worktime",
                      label: "",
                      data: [worktime, 0, Math.max(12 - worktime, 0)],
                      rotation: outerOffset,
                      backgroundColor: [blue[500], red[400], "lightgray"],
                      borderWidth: 2,
                      weight: 1,
                    },
                    {
                      id: "real-worktime",
                      label: "",
                      data: [0, workedtime, Math.max(12 - workedtime, 0)],
                      rotation: innerOffset,
                      backgroundColor: [blue[500], red[400], "lightgray"],
                      borderWidth: 0,
                      weight: 1,
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
                options={{
                  layout: {
                    margin: 0,
                  },
                  cutout: "70%",
                  plugins: {
                    tooltip: {
                      enabled: false,
                    },
                  },
                }}
                data={{
                  datasets: [
                    clock,
                    {
                      id: "annual",
                      label: "",
                      data: [1],
                      // rotation: outerOffset,
                      backgroundColor: [red[400]],
                      weight: 2,
                      borderWidth: 0,
                    },
                  ],
                }}
              />
            </>
          ) : type === "half" ? (
            <>
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <ListItemText
                  primary={moment(start.toDate()).format("HH:mm")}
                  secondary={
                    started ? moment(started.toDate()).format("HH:mm") : ""
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: 20,
                    },
                  }}
                />
                <KeyboardArrowDownIcon />
                <ListItemText
                  primary={moment(finish.toDate()).format("HH:mm")}
                  secondary={
                    finished ? moment(finished.toDate()).format("HH:mm") : ""
                  }
                  sx={{
                    "& .MuiListItemText-primary": {
                      fontSize: 20,
                    },
                  }}
                />
              </Box>
              <Doughnut
                style={{
                  margin: 0,
                  padding: 0,
                  maxWidth: 700,
                }}
                options={{
                  layout: {
                    margin: 0,
                  },
                  cutout: "70%",
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
                            label = `오늘의 근로: ${moment(
                              start.toDate()
                            ).format("HH:mm")} - ${moment(
                              finish.toDate()
                            ).format("HH:mm")}`;
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
                      id: "worktime",
                      label: "",
                      data: [worktime, 0, Math.max(12 - worktime, 0)],
                      rotation: outerOffset,
                      backgroundColor: [blue[500], red[400], "lightgray"],
                      borderWidth: 2,
                      weight: 1,
                    },
                    {
                      id: "real-worktime",
                      label: "",
                      data: [0, workedtime, Math.max(12 - workedtime, 0)],
                      rotation: innerOffset,
                      backgroundColor: [blue[500], red[400], "lightgray"],
                      borderWidth: 0,
                      weight: 1,
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
                options={{
                  layout: {
                    margin: 0,
                  },
                  cutout: "70%",
                  plugins: {
                    tooltip: {
                      enabled: false,
                    },
                  },
                }}
                data={{
                  datasets: [
                    clock,
                    {
                      id: "sick",
                      label: "",
                      data: [1],
                      // rotation: outerOffset,
                      backgroundColor: [grey[600]],
                      weight: 2,
                      borderWidth: 0,
                    },
                  ],
                }}
              />
            </>
          ) : (
            <>type 오류!</>
          )}
        </Box>
      </Box>
    </Stack>
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
  const { value, onChange, data, fetch, loading } = props;
  return (
    <>
      <StaticDatePicker
        displayStaticWrapperAs="desktop"
        value={value}
        onChange={onChange}
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
