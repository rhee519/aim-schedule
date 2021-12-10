import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper as MuiPaper,
  Typography,
  experimentalStyled as styled,
  IconButton,
  TextField,
} from "@mui/material";
import { UserContext } from "../contexts/Context";
import moment from "moment";
import CustomRangeCalendar, { DayComponentText } from "./CustomRangeCalendar";
import { Doughnut } from "react-chartjs-2";
import "chart.js/auto";
import { fetchMonthData, initialDailyData } from "../docFunctions";
import { blue, red } from "@mui/material/colors";
import { LocalizationProvider, StaticDatePicker } from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
import { PickersDayWithMarker } from "./Schedule";

const Paper = styled(MuiPaper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.primary,
  height: "100%",
}));

const Dashboard = () => {
  const user = useContext(UserContext);
  const [date, setDate] = useState(moment());
  const [monthData, setMonthData] = useState({});
  const [loading, setLoading] = useState(true);

  const handleChange = (value) => setDate(value);
  const refetchMonthData = useCallback(
    async (date) => {
      // console.log("fetched");
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
          // setMonthData((prev) => ({ ...prev, ...data }));
          setMonthData(data);
        })
        .then(() => setLoading(false));
    },
    [user.uid]
  );

  useEffect(() => {
    refetchMonthData(moment());
  }, [refetchMonthData]);

  return loading ? (
    <>loading...</>
  ) : (
    <LocalizationProvider dateAdapter={AdapterMoment}>
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
              <DaySummary
                value={date}
                data={monthData[date.format("YYYYMMDD")]}
              />
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={6}>
            <Paper>
              <MonthSummary
                value={date}
                onChange={handleChange}
                data={monthData}
                fetch={refetchMonthData}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

const DaySummary = (props) => {
  // const user = useContext(UserContext);
  const { value, data } = props;
  const dailyData = data || initialDailyData(value);
  const { start, started, finish, finished, type } = dailyData;
  const noon = moment(value).startOf("day").hour(12).toDate();
  // offset을 각도(deg) 단위로 환산
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
      : (moment(value).toDate().getTime() - started.toDate().getTime()) /
        3600000
    : 0;

  const clock = {
    id: "clock",
    label: "clock",
    data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    backgroundColor: "gray",
    weight: 0.15,
  };

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          width: "100%",
          textAlign: "left",
        }}
      >
        {value.format("M월 D일")}
      </Typography>
      <Box sx={{ position: "relative" }}>
        {type === "work" ? (
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
              근로시간
            </Typography>
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
                    id: "worktime",
                    label: "",
                    data: [worktime, 0, Math.max(12 - worktime, 0)],
                    rotation: outerOffset,
                    backgroundColor: [blue[500], red[400], "lightgray"],
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
          <>연차</>
        ) : type === "half" ? (
          <>반차</>
        ) : type === "sick" ? (
          <>병가</>
        ) : (
          <>type 오류!</>
        )}
      </Box>
    </Box>
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
  const { value, onChange, data } = props;
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
      />
      {/* <CalendarLabel calendarStart={startDate} calendarEnd={endDate} />
      <CustomRangeCalendar
        calendarStart={moment(startDate)}
        calendarEnd={moment(endDate)}
        value={value}
        onChange={onChange}
        dayComponent={CustomDayComponent}
      /> */}
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
