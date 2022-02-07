import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarPickerSkeleton,
  DatePicker,
  LoadingButton,
  PickersDay,
  StaticDatePicker,
  StaticDateRangePicker,
  TabContext,
  TabList,
  TabPanel,
} from "@mui/lab";
import {
  Box,
  TextField,
  MenuItem,
  Paper,
  Select,
  InputLabel,
  FormControl,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Grid,
  Button,
  ListSubheader,
  Modal,
  IconButton,
  Tab,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Badge,
  ThemeProvider,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import moment from "moment";
import {
  appliedSchedule,
  dayRef,
  fetchAnnualData,
  fetchDayData,
  fetchMonthData,
  fetchUser,
  initialDailyData,
  userDocRef,
  fetchRangeData,
  getWorkTime,
} from "../docFunctions";
import {
  CalendarContext,
  ScheduleContext,
  UserContext,
} from "../contexts/Context";
import { setDoc, updateDoc, Timestamp } from "@firebase/firestore";
import CustomRangeCalendar, { holidayType } from "./CustomRangeCalendar";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import TimelapseIcon from "@mui/icons-material/Timelapse";
import { badgeTheme } from "../theme";

// 현재 @mui/lab 버전에서는 MonthPicker 에러때문에 월 선택창을 띄우는 것이 불가능!
// 기능은 정상이지만, 에러 메시지가 계속 출력됨.
// 주기적으로 확인 필요

export const EMOJI_ANNUAL = "🔥";
export const EMOJI_HALF = "😎";
export const EMOJI_SICK = "😷";
export const EMOJI_ALT = "😴";
export const EMOJI_ALERT = "🚨";
export const worktypeEmoji = (type) => {
  if (type === "annual") return EMOJI_ANNUAL;
  else if (type === "half") return EMOJI_HALF;
  else if (type === "sick") return EMOJI_SICK;
  else if (type === "alt") return EMOJI_ALT;
  else return undefined;
};

export const ScheduleCategory = () => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{ width: "100%" }}
  >
    <ListItemText
      primary={EMOJI_ANNUAL}
      secondary="연차"
      sx={{ textAlign: "center" }}
    />
    <ListItemText
      primary={EMOJI_HALF}
      secondary="반차"
      sx={{ textAlign: "center" }}
    />
    <ListItemText
      primary={EMOJI_SICK}
      secondary="병가"
      sx={{ textAlign: "center" }}
    />
    <ListItemText
      primary={EMOJI_ALT}
      secondary="대체 휴무"
      sx={{ textAlign: "center" }}
    />
    <ListItemText
      primary={EMOJI_ALERT}
      secondary="휴일 근로"
      sx={{ textAlign: "center" }}
    />
  </Stack>
);

const isWeekend = (date) => {
  const d = moment(date);
  return d.day() === 0 || d.day() === 6;
};

export const koreanWeekDays = ["일", "월", "화", "수", "목", "금", "토"];

// 근로 신청 가능한 시각
const availableTimes = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const Schedule = () => {
  const user = useContext(UserContext);
  const [open, setOpen] = useState(false); // 근로 신청 창 open 여부
  const [index, setIndex] = useState("schedule"); // tab index
  const [date, setDate] = useState(moment()); // 선택된 날짜
  const [monthData, setMonthData] = useState({}); // 선택된 월의 데이터
  const [loading, setLoading] = useState(true); // monthData fetch 여부
  const calendar = useContext(CalendarContext); // 휴무, 공휴일, 행사, 정산 일정
  const [schedule, setSchedule] = useState(); // 근로 신청 내용
  const [annualData, setAnnualData] = useState({}); // 연간 근로 데이터
  const annualCount = useMemo(() => {
    let count = 0;
    Object.keys(annualData).forEach((key) => {
      const { type } = annualData[key];
      if (type === "annual") count += 1;
      else if (type === "half") count += 0.5;
    });
    return count;
  }, [annualData]);

  const fetchSchedule = useCallback(async () => {
    fetchUser(user.uid).then((docSnap) => {
      setSchedule(docSnap.data().schedule);
    });
  }, [user.uid]);

  // 최초 월 단위 데이터 & schedule fetch
  // 올해 데이터도 fetch (연차 개수 파악)
  useEffect(() => {
    fetchAnnualData(user.uid, moment()).then((data) => setAnnualData(data));

    fetchMonthData(user.uid, moment())
      .then((snapshot) => {
        const data = {};
        snapshot.forEach(
          (doc) => (data[moment().date(doc.id).format("YYYYMMDD")] = doc.data())
        );
        setMonthData((prev) => ({ ...prev, ...data }));
      })
      .then(() => fetchSchedule())
      .then(() => setLoading(false));

    return () => {
      setLoading(true);
      setMonthData();
      setSchedule();
    };
  }, [user.uid, fetchSchedule]);

  // 달력 넘어갈 때마다 월 단위 데이터 fetch
  // 만약 해당 월에 데이터가 존재하지 않으면 데이터는 갱신되지 않음.
  const refetchMonthData = useCallback(
    async (date) => {
      setLoading(true);
      fetchMonthData(user.uid, date)
        .then((snapshot) => {
          const data = {};
          snapshot.forEach(
            (doc) =>
              (data[moment(date).date(doc.id).format("YYYYMMDD")] = doc.data())
          );
          setMonthData((prev) => ({ ...prev, ...data }));
        })
        .then(() => setLoading(false));
    },
    [user.uid]
  );

  const handleClose = async (event) => {
    refetchMonthData(date);
    setOpen(false);
  };

  return (
    <ThemeProvider theme={badgeTheme}>
      <ScheduleContext.Provider value={schedule}>
        <TabContext value={index}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(event, value) => setIndex(value)}>
              <Tab label="스케줄 확인" value="schedule" />
              <Tab label="근로시간 확인 & 급여 가계산" value="calculate" />
            </TabList>
          </Box>

          <TabPanel value="schedule">
            <Modal
              sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
              open={open}
              onClose={handleClose}
            >
              <Paper
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80%",
                  minWidth: 400,
                  height: "80%",
                  overflowY: "scroll",
                }}
              >
                {calendar && calendar.payday && (
                  <ApplicationDisplay onClose={handleClose} />
                )}
              </Paper>
            </Modal>
            <Grid container spacing={1} columns={12}>
              <Grid
                item
                xs={12}
                sx={{ display: "flex", justifyContent: "center" }}
              >
                <Stack
                  spacing={1}
                  sx={{
                    display: { xs: "block", md: "none" },
                    width: "100%",
                  }}
                >
                  <RecentScheduleApplication schedule={schedule} />
                  <RecentScheduleStatusText
                    schedule={schedule}
                    annualCount={annualCount}
                  />
                  <Paper
                    sx={{
                      position: "relative",
                      height: 340,
                      overflowY: "hidden",
                    }}
                  >
                    <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      loading={loading}
                      minDate={moment("2021-01-01")}
                      value={date}
                      onChange={(newValue) => setDate(newValue)}
                      renderLoading={() => <CalendarPickerSkeleton />}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          helperText={"날짜를 입력하세요"}
                        />
                      )}
                      onMonthChange={refetchMonthData}
                      renderDay={(day, _value, props) => {
                        const key = day.format("YYYYMMDD");
                        return (
                          <PickersDayWithMarker
                            {...props}
                            data={monthData[key]}
                          />
                        );
                      }}
                    />
                    <Button
                      onClick={() => setOpen(true)}
                      variant="text"
                      sx={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                      }}
                    >
                      <Typography variant="subtitle2">
                        다음 달 근로 신청하기
                      </Typography>
                    </Button>
                  </Paper>
                  <Paper>
                    {monthData && (
                      <SelectedDayDisplay
                        date={date}
                        data={monthData[date.format("YYYYMMDD")]}
                      />
                    )}
                  </Paper>
                </Stack>
                <Paper
                  sx={{
                    display: { xs: "none", md: "block" },
                    width: "100%",
                    minWidth: 650,
                  }}
                >
                  <Box sx={{ width: "100%", display: "flex", p: 1 }}>
                    <RecentScheduleApplication schedule={schedule} />
                    <RecentScheduleStatusText
                      schedule={schedule}
                      annualCount={annualCount}
                    />
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    position="relative"
                  >
                    <DatePicker
                      displayStaticWrapperAs="desktop"
                      loading={loading}
                      minDate={moment("2021-01-01")}
                      views={["year", "month"]}
                      value={date}
                      onChange={(newValue) => setDate(newValue)}
                      renderLoading={() => <CalendarPickerSkeleton />}
                      renderInput={(params) => (
                        <TextField
                          variant="standard"
                          {...params}
                          sx={{
                            m: 1,
                          }}
                        />
                      )}
                      onMonthChange={refetchMonthData}
                    />
                    <Stack>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() =>
                            setDate(
                              moment(date).subtract(1, "month").startOf("month")
                            )
                          }
                        >
                          <NavigateBeforeIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            setDate(
                              moment(date).add(1, "month").startOf("month")
                            )
                          }
                        >
                          <NavigateNextIcon />
                        </IconButton>
                      </Box>
                      <Button onClick={() => setOpen(true)} variant="text">
                        <Typography variant="subtitle2">
                          다음 달 근로 신청하기
                        </Typography>
                      </Button>
                    </Stack>
                  </Box>
                  <CustomRangeCalendar
                    calendarStart={moment(date).startOf("month")}
                    calendarEnd={moment(date).endOf("month")}
                    value={date}
                    onChange={(newValue) => setDate(newValue)}
                    dayComponent={LargeViewDayComponent}
                    data={monthData}
                  />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          <TabPanel value="calculate">
            <Calculate />
          </TabPanel>
        </TabContext>
      </ScheduleContext.Provider>
    </ThemeProvider>
  );
};

const RecentScheduleApplication = ({ schedule }) =>
  schedule ? (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ width: { sx: "100%", md: "50%" }, maxWidth: 400 }}
    >
      <ListItemText
        primary="최근 근로 신청"
        secondary={moment(schedule.createdAt.toDate()).format(
          "M월 D일 HH:mm 신청함"
        )}
      />
      <ListItemText
        sx={{ textAlign: "right" }}
        secondary={
          schedule.status === "waiting"
            ? "대기중"
            : schedule.status === "confirmed"
            ? "승인됨"
            : schedule.status === "rejected"
            ? "반려됨"
            : ""
        }
      />
    </Stack>
  ) : (
    <></>
  );

export const RecentScheduleStatusText = ({ sx, schedule, annualCount }) =>
  schedule && annualCount ? (
    <Stack
      alignItems={{ sx: "flex-start", md: "flex-end" }}
      flexGrow={1}
      sx={sx}
    >
      {schedule.workOnHoliday && (
        <Typography variant="h6">🚨 휴일 근로 신청이 있습니다!</Typography>
      )}
      <Typography>
        신청기간: {moment(schedule.from.toDate()).format("M월 D일")} -{" "}
        {moment(schedule.to.toDate()).format("M월 D일")}
      </Typography>
      <Typography>
        {moment().year()}년 사용한 연차: {annualCount}일
      </Typography>
    </Stack>
  ) : (
    <></>
  );

const LargeViewDayComponent = (props) => {
  const schedule = useContext(ScheduleContext);
  const calendar = useContext(CalendarContext);
  const { value, today, outOfRange, data } = props;
  const hideContent = useMemo(
    () =>
      data && schedule
        ? moment(value).isAfter(schedule.to.toDate(), "d")
        : true,
    [schedule, data, value]
  );

  const { type } = data || initialDailyData(value, calendar);
  const htype = holidayType(value, calendar);
  const key = value.format("YYYYMMDD");
  // console.log(value, calendar.event[key]);

  const startTime =
    data && data.start && moment(data.start.toDate()).format("HH:mm");

  const finishTime =
    data && data.finish && moment(data.finish.toDate()).format("HH:mm");

  const startedTime =
    data && data.started
      ? moment(data.started.toDate()).format("HH:mm")
      : type === "work" || type === "half" || type === "sick"
      ? "-"
      : "";

  const finishedTime =
    data && data.finished
      ? moment(data.finished.toDate()).format("HH:mm")
      : type === "work" || type === "half" || type === "sick"
      ? "-"
      : "";

  const dateColor =
    htype === "holiday" || htype === "vacation" || value.day() === 0
      ? "error.main"
      : value.day() === 6
      ? "primary.main"
      : "text.primary";

  const titleList = [];
  if (calendar.event[key]) titleList.push(calendar.event[key]);
  if (calendar[htype] && calendar[htype][key])
    titleList.push(calendar[htype][key]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: 100,
        boxSizing: "border-box",
        border: today ? "1px solid" : "none",
        borderColor: today ? "primary.main" : "none",
        borderRadius: 3,
      }}
    >
      {!outOfRange && (
        <Stack sx={{ width: "100%" }}>
          <ListItemText
            primary={value.format("D")}
            secondary={worktypeEmoji(type)}
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              mt: 0,
              mr: 0.5,
              color: dateColor,
              "& .MuiListItemText-primary": {
                fontSize: 12,
                textAlign: "right",
              },
              "& .MuiListItemText-secondary": {
                fontSize: 12,
                textAlign: "right",
              },
            }}
          />
          {type !== "annual" && (
            <List>
              <ListItem sx={{ flexDirection: "column" }}>
                <Stack sx={{ width: "100%", position: "absolute", top: 0 }}>
                  {titleList.map((title, index) => (
                    <Typography
                      key={index}
                      fontSize={10}
                      textAlign="center"
                      sx={{ p: 0, m: 0 }}
                    >
                      {title}
                    </Typography>
                  ))}
                </Stack>

                {/* <Typography
                  fontSize={10}
                  textAlign="center"
                  sx={{ width: "100%", position: "absolute", top: 0 }}
                >
                </Typography> */}
              </ListItem>

              {!hideContent && (
                <ListItem>
                  <ListItemText
                    primary={
                      (type === "work" || type === "half" || type === "sick") &&
                      startTime
                    }
                    secondary={startedTime}
                    sx={{
                      m: 0,
                      "& .MuiListItemText-primary": {
                        fontSize: 10,
                        textAlign: "center",
                      },
                      "& .MuiListItemText-secondary": {
                        fontSize: 10,
                        textAlign: "center",
                      },
                    }}
                  />
                  <ListItemText
                    primary={
                      (type === "work" || type === "half" || type === "sick") &&
                      finishTime
                    }
                    secondary={finishedTime}
                    sx={{
                      m: 0,
                      "& .MuiListItemText-primary": {
                        fontSize: 10,
                        textAlign: "center",
                      },
                      "& .MuiListItemText-secondary": {
                        fontSize: 10,
                        textAlign: "center",
                      },
                    }}
                  />
                </ListItem>
              )}
            </List>
          )}
        </Stack>
      )}
    </Box>
  );
};

export const PickersDayWithMarker = (props) => {
  // Marker Color Guide
  // 좌상단: 근로 시간 충족 여부(충족: success, 초과: warning, 미달: secondary)
  // 우상단: 사내 일정 여부(일정 있으면 error, 없으면 미표시)
  const { day, data, outsideCurrentMonth, selected, dayComponent } = props;
  const DayComponent = dayComponent;
  const type = data ? data.type : undefined;
  const calendar = useContext(CalendarContext);
  const htype = holidayType(day, calendar);
  const key = day.format("YYYYMMDD");
  const timeAcceptRange = 30 * 60 * 1000;
  const isFuture = moment().isBefore(day);

  const worktimeInMs = data
    ? data.finish.toDate().getTime() - data.start.toDate().getTime()
    : 0;
  const workedtimeInMs =
    data && data.started && data.finished
      ? data.finished.toDate().getTime() - data.started.toDate().getTime()
      : 0;
  const timeDiffInMs = workedtimeInMs - worktimeInMs;

  const hideBadge = Boolean(!data || outsideCurrentMonth || isFuture);

  const timeStatusColor =
    Math.abs(timeDiffInMs) <= timeAcceptRange
      ? "success"
      : timeDiffInMs > 0
      ? "warning"
      : "secondary";
  const eventsExists = (!outsideCurrentMonth && calendar.event[key]) || 0;

  const pickersDayTextColor = outsideCurrentMonth
    ? "text.disabled"
    : selected
    ? "background.paper"
    : htype === "holiday" || htype === "vacation" || day.day() === 0
    ? "error.main"
    : day.day() === 6
    ? "primary.main"
    : "text.primary";

  return (
    <Badge
      variant="dot"
      overlap="circular"
      color={timeStatusColor}
      badgeContent={false}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
      invisible={hideBadge}
    >
      <Badge
        variant="dot"
        overlap="circular"
        color="error"
        badgeContent={eventsExists}
      >
        {dayComponent ? (
          <DayComponent {...props} />
        ) : (
          <PickersDay
            {...props}
            sx={{ color: pickersDayTextColor, fontSize: 12 }}
          >
            {worktypeEmoji(type)}
          </PickersDay>
        )}
      </Badge>
    </Badge>
  );
};

const SelectedDayDisplay = ({ date, data }) => {
  return (
    <Box>
      <Typography variant="h6">{date.format("M/D")}</Typography>
      {data ? (
        <>
          <Typography variant="body1">
            출근: {moment(data.start.toDate()).format("HH:mm")}
          </Typography>
          <Typography variant="body1">
            퇴근: {moment(data.finish.toDate()).format("HH:mm")}
          </Typography>
        </>
      ) : (
        <>해당 날짜의 근로 데이터가 없어요!</>
      )}
    </Box>
  );
};

const ApplicationDisplay = ({ onClose }) => {
  const user = useContext(UserContext);
  const calendar = useContext(CalendarContext);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState(false);
  const [data, setData] = useState();
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [selectedDateRange, setSelectedDateRange] = useState([null, null]);
  // 조회한 신청 기간
  const [period, setPeriod] = useState("1"); // 신청 개월수

  const handleFetchClick = async () => {
    setLoading(true);
    setSelectedDateRange([startDate, endDate]);
    fetchRangeData(user.uid, startDate, endDate)
      .then((data) => {
        const newData = { ...data };
        for (
          let d = moment(startDate);
          d.isSameOrBefore(endDate);
          d.add(1, "d")
        ) {
          const key = d.format("YYYYMMDD");
          if (!newData[key]) newData[key] = initialDailyData(d, calendar);
        }
        setData(newData);
      })
      .then(() => {
        setShowData(true);
        setLoading(false);
      });
  };

  const handleStartChange = (event, date) => {
    const key = moment(date).format("YYYYMMDD");
    const [hour, minute] = event.target.value.split(":");
    const start = Timestamp.fromDate(
      moment(date).startOf("d").hour(hour).minute(minute).toDate()
    );
    const newData = { ...data[key], start };
    setData((prev) => ({ ...prev, [key]: newData }));
  };

  const handleFinishChange = (event, date) => {
    const key = moment(date).format("YYYYMMDD");
    const [hour, minute] = event.target.value.split(":");
    const finish = Timestamp.fromDate(
      moment(date).startOf("d").hour(hour).minute(minute).toDate()
    );
    const newData = { ...data[key], finish };
    setData((prev) => ({ ...prev, [key]: newData }));
  };

  const handleTypeChange = (event, date) => {
    const key = moment(date).format("YYYYMMDD");
    const type = event.target.value;
    const newData = { ...data[key], type };
    setData((prev) => ({ ...prev, [key]: newData }));
  };

  const handleSaveClick = async (event) => {
    // 날짜별 근로 신청 현황을 DB에 업데이트
    Object.keys(data).forEach((key) => {
      const docRef = dayRef(user.uid, moment(key));
      fetchDayData(user.uid, moment(key)).then(async (docSnap) => {
        if (docSnap.exists()) {
          await updateDoc(docRef, data[key]);
        } else {
          await setDoc(docRef, data[key]);
        }
      });
    });

    // 해당 기간에 근로 신청을 새롭게 했음을 업데이트
    let workOnHoliday = false;
    Object.keys(data).forEach((key) => {
      const htype = holidayType(moment(key), calendar);
      const { type } = data[key];
      if (htype !== "default" && type !== "offday") {
        workOnHoliday = true;
        return;
      }
    });

    const schedule = appliedSchedule([startDate, endDate], workOnHoliday);
    const userRef = userDocRef(user.uid);
    await updateDoc(userRef, { schedule });
    onClose();
  };

  // 선택된 기간 (endDate) 갱신하기
  useEffect(() => {
    if (startDate === null) setEndDate(null);
    else {
      const months = parseInt(period);
      setEndDate(moment(startDate).subtract(1, "d").add(months, "M"));
    }
  }, [startDate, period]);

  // clean-up
  useEffect(() => {
    return () => {
      setLoading(true);
      setShowData(false);
      setData({});
    };
  }, []);

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ p: 1 }}>
        <Stack>
          <Typography variant="h6">
            💳 급여 정산일은 매월 25일입니다.
          </Typography>
          <Typography variant="h6">
            ⚠️ SAVE를 클릭하지 않으면 데이터가 DB에 저장되지 않습니다!
          </Typography>
        </Stack>
        <Box>
          <Button
            onClick={handleSaveClick}
            variant="contained"
            disabled={!showData}
          >
            SAVE
          </Button>
          <Button onClick={onClose}>CANCEL</Button>
        </Box>
      </Stack>
      <Divider />
      <DatePicker
        value={startDate}
        onChange={(newDate) => setStartDate(newDate)}
        renderInput={(params) => (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ width: "100%", p: 1 }}
          >
            <Stack direction="row" alignItems="center">
              <TextField {...params} />
              <Box sx={{ mx: 2 }}> 부터 </Box>
              <Stack>
                <ToggleButtonGroup
                  value={period}
                  size="small"
                  exclusive
                  onChange={(event, newPeriod) => {
                    if (!newPeriod) return;
                    setPeriod(newPeriod);
                  }}
                >
                  <ToggleButton value="1">1개월</ToggleButton>
                  <ToggleButton value="2">2개월</ToggleButton>
                  <ToggleButton value="3">3개월</ToggleButton>
                </ToggleButtonGroup>
                <ListItemText
                  secondary={endDate && endDate.format("~ Y년 M월 D일까지")}
                />
              </Stack>
              <Button
                variant="contained"
                size="large"
                disabled={!Boolean(startDate)}
                onClick={handleFetchClick}
                sx={{ m: 1 }}
              >
                조회
              </Button>
            </Stack>
          </Stack>
        )}
      />
      {showData &&
        (loading ? (
          <>loading...</>
        ) : (
          <List>
            <ListSubheader
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body1">{`${selectedDateRange[0].format(
                "Y년 M월 D일"
              )} ~ ${selectedDateRange[1].format("Y년 M월 D일")}`}</Typography>
            </ListSubheader>
            {Object.keys(data).map((key, index) => {
              const date = moment(key);
              const weekend = isWeekend(key);
              const htype = holidayType(date, calendar);
              const offday = htype === "holiday" || htype === "vacation";
              const holidayText = offday ? calendar[htype][key] : "";
              let secondaryText = koreanWeekDays[date.day()];
              if (holidayText) secondaryText += ` | ${holidayText}`;
              const secondaryTextColor =
                calendar.event[key] || htype === "default"
                  ? "text.secondary"
                  : htype === "saturday"
                  ? "primary"
                  : "error";
              return (
                <Box key={index}>
                  <ListItem>
                    <ListItemText
                      variant="body2"
                      primary={date.format("M월 D일")}
                      secondary={secondaryText}
                      secondaryTypographyProps={{ color: secondaryTextColor }}
                      sx={{ width: 100 }}
                    />
                    {(offday || weekend) && (
                      <ListItemText
                        variant="body2"
                        secondary={"신청 시 관리자 승인 필요"}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          textAlign: "center",
                        }}
                      >
                        <FormGroup>
                          <FormControlLabel
                            control={
                              <Checkbox
                                sx={{ p: 0 }}
                                checked={data[key].type !== "offday"}
                                onChange={(event) => {
                                  const dailyData = { ...data[key] };
                                  dailyData.type = event.target.checked
                                    ? "work"
                                    : "offday";
                                  setData({ ...data, [key]: dailyData });
                                }}
                              />
                            }
                            label="근로 신청하기"
                          />
                        </FormGroup>
                      </ListItemText>
                    )}

                    {
                      // !isWeekend(date) && htype === "default" &&
                      <Box>
                        <FormControl variant="standard">
                          <InputLabel>근로 형태</InputLabel>
                          <Select
                            value={data[key].type}
                            onChange={(event) => handleTypeChange(event, date)}
                            disabled={
                              data[key].type === "sick" ||
                              data[key].type === "offday"
                            }
                            sx={{ width: 90 }}
                          >
                            <MenuItem value="work">근로</MenuItem>
                            <MenuItem value="annual">연차</MenuItem>
                            <MenuItem value="half">반차</MenuItem>
                            <MenuItem value="alt">대체 휴무</MenuItem>
                            <MenuItem value="offday" disabled>
                              휴일
                            </MenuItem>
                            <MenuItem value="sick" disabled>
                              병가
                            </MenuItem>
                          </Select>
                        </FormControl>

                        <FormControl variant="standard" sx={{ ml: 1 }}>
                          <InputLabel>출근</InputLabel>
                          <Select
                            value={moment(data[key].start.toDate()).format(
                              "HH:mm"
                            )}
                            label="출근"
                            onChange={(event) => handleStartChange(event, date)}
                            disabled={
                              data[key].type === "annual" ||
                              data[key].type === "sick" ||
                              data[key].type === "alt" ||
                              data[key].type === "offday"
                            }
                            sx={{ width: 80 }}
                          >
                            {availableTimes.map((value, index) => {
                              const finishTime = moment(
                                data[key].finish.toDate()
                              ).format("HH:mm");
                              const disabled = value >= finishTime;
                              return (
                                <MenuItem
                                  key={index}
                                  value={value}
                                  disabled={disabled}
                                >
                                  {value}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                        <FormControl variant="standard" sx={{ ml: 1 }}>
                          <InputLabel>퇴근</InputLabel>
                          <Select
                            value={moment(data[key].finish.toDate()).format(
                              "HH:mm"
                            )}
                            label="퇴근"
                            onChange={(event) =>
                              handleFinishChange(event, date)
                            }
                            disabled={
                              data[key].type === "annual" ||
                              data[key].type === "sick" ||
                              data[key].type === "alt" ||
                              data[key].type === "offday"
                            }
                            sx={{ width: 80 }}
                          >
                            {availableTimes.map((value, index) => {
                              const startTime = moment(
                                data[key].start.toDate()
                              ).format("HH:mm");
                              const disabled = value <= startTime;
                              return (
                                <MenuItem
                                  key={index}
                                  value={value}
                                  disabled={disabled}
                                >
                                  {value}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </FormControl>
                      </Box>
                    }
                  </ListItem>
                  <Divider variant="fullWidth" />
                </Box>
              );
            })}
          </List>
        ))}
    </>
  );
};

const Calculate = (props) => {
  const user = useContext(UserContext);
  const calendar = useContext(CalendarContext);
  const [dateRange, setDateRange] = useState([null, null]); // 근로 시간 확인 & 급여 정산
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [worktime, setWorktime] = useState({});
  // const [workedtime, setWorkedtime] = useState(0);

  const handleCalculateClick = async (event) => {
    setLoading(true);
    fetchRangeData(user.uid, dateRange[0], dateRange[1])
      .then((data) => {
        setData(data);
        setWorktime(getWorkTime(calendar, data, dateRange[0], dateRange[1]));
      })
      .then(() => {
        setLoading(false);
        setShowDatePicker(false);
      });
    // const responses = [];
    // for (
    //   let d = moment(dateRange[0]);
    //   d.isSameOrBefore(dateRange[1]);
    //   d.add(1, "d")
    // ) {
    //   const key = moment(d).format("YYYYMMDD");
    //   responses.push(
    //     fetchDayData(user.uid, moment(d)).then((docSnap) => {
    //       if (docSnap.exists()) return { key, data: docSnap.data() };
    //       else return { key, data: initialDailyData(moment(key), calendar) };
    //     })
    //   );
    // }
    // Promise.all(responses)
    //   .then((snapshot) => {
    //     let timeToWork = 0,
    //       timeWorked = 0;
    //     setData(snapshot);
    //     snapshot.forEach((value) => {
    //       const { data, key } = value;
    //       const {
    //         start,
    //         started,
    //         finish,
    //         finished,
    //         // type
    //       } = data;
    //       const htype = holidayType(moment(key), calendar);
    //       if (htype !== "default") {
    //       } else {
    //         const work = finish.toDate().getTime() - start.toDate().getTime();
    //         const worked =
    //           started && finished
    //             ? finished.toDate().getTime() - started.toDate().getTime()
    //             : 0;
    //         timeToWork += work;
    //         timeWorked += worked;
    //       }
    //     });
    //     setWorktime(timeToWork);
    //     setWorkedtime(timeWorked);
    //   })
    //   .then(() => {
    //     setLoading(false);
    //     setShowDatePicker(false);
    //   });
  };

  const handleRecalculateClick = (event) => {
    setShowDatePicker(true);
  };

  const handleDetailClick = (event) => {
    setShowDetail(!showDetail);
  };

  return showDatePicker ? (
    <Box sx={{ maxWidth: 600 }}>
      <Stack spacing={1}>
        <LoadingButton
          fullWidth
          variant="contained"
          loading={loading}
          onClick={handleCalculateClick}
          startIcon={<TimelapseIcon />}
          loadingPosition="start"
          disabled={!dateRange[1]}
        >
          근로시간 확인하기
        </LoadingButton>
        <StaticDateRangePicker
          displayStaticWrapperAs="desktop"
          startText="정산 시작일"
          endText="정산 종료일"
          value={dateRange}
          onChange={(range) => setDateRange(range)}
          renderInput={(startProps, endProps) => (
            <React.Fragment>
              <TextField {...startProps} size="small" />
              부터
              <TextField {...endProps} size="small" />
              까지
            </React.Fragment>
          )}
        />
      </Stack>
    </Box>
  ) : (
    <Stack>
      <Paper>
        <Typography>
          {dateRange[0].format("Y년 M월 D일")}부터{" "}
          {dateRange[1].format("Y년 M월 D일")}까지
        </Typography>
        <Typography>기준 근로시간: {worktime.standard}h</Typography>
        <Typography>예정 근로시간: {worktime.scheduled}h</Typography>
        <Typography>
          실제 근로시간: {worktime.actual % 1}h {(worktime.actual * 60) % 60}m
        </Typography>
        <Button variant="text" onClick={handleDetailClick}>
          {showDetail ? "hide" : "show detail"}
        </Button>
        {
          showDetail &&
            Object.keys(data).map((key, index) => {
              const date = moment(key);
              const htype = holidayType(date, calendar);
              return (
                <Box key={key}>
                  <Typography>{date.format("M월 D일")}</Typography>
                  {htype === "default" ? (
                    <Typography>
                      {moment(data[key].start.toDate()).format("HH:mm")} ~{" "}
                      {moment(data[key].finish.toDate()).format("HH:mm")}
                    </Typography>
                  ) : htype === "annual" ? (
                    <Typography>연차</Typography>
                  ) : htype === "sick" ? (
                    <Typography>병가</Typography>
                  ) : htype === "holiday" || htype === "vacation" ? (
                    <Typography>{calendar[htype][key]}</Typography>
                  ) : (
                    <Typography>{htype}</Typography>
                  )}
                </Box>
              );
            })
          // data.map(({ key, data }) => {
          //   const d = moment(key);
          //   const htype = holidayType(d, calendar);
          //   return (
          //     <Box key={key}>
          //       <Typography>{d.format("M월 D일")}</Typography>
          //       {htype === "default" ? (
          //         <Typography>
          //           {moment(data.start.toDate()).format("HH:mm")} ~{" "}
          //           {moment(data.finish.toDate()).format("HH:mm")}
          //         </Typography>
          //       ) : htype === "annual" ? (
          //         <Typography>연차</Typography>
          //       ) : htype === "sick" ? (
          //         <Typography>병가</Typography>
          //       ) : htype === "holiday" || htype === "vacation" ? (
          //         <Typography>{calendar[htype][key]}</Typography>
          //       ) : (
          //         <Typography>{htype}</Typography>
          //       )}
          //     </Box>
          //   );
          // })
        }
      </Paper>
      <Button variant="contained" onClick={handleRecalculateClick}>
        다른 날짜 선택하기
      </Button>
    </Stack>
  );
};

// const DayDisplayThisMonth = (props) => {
//   const { date } = props;
//   const [data, setData] = useState(undefined);
//   const user = useContext(UserContext);
//   useEffect(() => {
//     fetchMonthData(user.uid, startDate, endDate).then((fetchedData) =>
//       setData(fetchedData)
//     );
//     return () => {
//       setData(undefined);
//     };
//   }, [user.uid]);
//   const dailyData = data ? data[date.format("YYYYMMDD")] : undefined;
//   return (
//     <Paper>
//       <Typography>{date.format("M월 D일")}</Typography>
//       {dailyData && (
//         <Box>
//           {!dailyData.holiday ? (
//             <Box>
//               <Typography>
//                 출근시각: {moment(dailyData.start.toDate()).format("HH:mm")}
//               </Typography>
//               <Typography>
//                 퇴근시각: {moment(dailyData.finish.toDate()).format("HH:mm")}
//               </Typography>
//               <Typography>
//                 실제 출근시각:{" "}
//                 {dailyData.started
//                   ? moment(dailyData.started.toDate()).format("HH:mm")
//                   : "출근 안 함"}
//               </Typography>
//               <Typography>
//                 실제 퇴근시각:{" "}
//                 {dailyData.finished
//                   ? moment(dailyData.finished.toDate()).format("HH:mm")
//                   : "퇴근 안 함"}
//               </Typography>
//             </Box>
//           ) : (
//             <Typography>휴일입니다.</Typography>
//           )}
//         </Box>
//       )}
//     </Paper>
//   );
// };

// const DayDisplayNextMonth = (props) => {
//   const { date } = props;
//   const [data, setData] = useState();
//   const user = useContext(UserContext);

//   useEffect(() => {
//     fetchMonthData(user.uid, nextStartDate, nextEndDate).then((fetchedData) =>
//       setData(fetchedData)
//     );
//   }, [user.uid]);
//   console.log(data);
//   return <Paper>{date.format("M월 D일")}</Paper>;
// };

// const ApplicationDayComponent = (props) => {
//   const { value, today, outOfRange, selected, onClick } = props;
//   const showMonth = value.month() !== moment(value).subtract(1, "d").month();
//   const showYear = value.year() !== moment(value).subtract(1, "d").year();
//   return (
//     <IconButton
//       size="small"
//       sx={{
//         width: 36,
//         height: 36,
//         bgcolor: selected ? "primary.main" : "none",
//         "&:hover": {
//           bgcolor: selected ? "primary.main" : "",
//         },
//       }}
//       disabled={outOfRange}
//       onClick={onClick}
//     >
//       <Box>
//         <Stack spacing={-0.25}>
//           <Typography
//             variant="body2"
//             fontSize={8}
//             color={selected ? "background.paper" : "inherit"}
//           >
//             {showMonth && value.format("MMM")}
//           </Typography>
//           <Typography
//             variant="body2"
//             display={outOfRange ? "none" : "inline"}
//             color={
//               selected
//                 ? "background.paper"
//                 : value.day() === 0
//                 ? "error.main"
//                 : value.day() === 6
//                 ? "primary.main"
//                 : "text.primary"
//             }
//             fontSize={11}
//             fontWeight={selected ? 700 : 400}
//             textDecoration={today ? "underline" : "none"}
//           >
//             {value.format("D")}
//           </Typography>
//           <Typography
//             variant="body2"
//             fontSize={8}
//             color={selected ? "background.paper" : "inherit"}
//           >
//             {showYear && value.year()}
//           </Typography>
//         </Stack>
//       </Box>
//     </IconButton>
//   );
// };

// const CheckSchedule = () => {
//   const user = useContext(UserContext);
//   const [thisMonth, setThisMonth] = useState({});
//   const [loading, setLoading] = useState(true);
//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     const collectionRef = collection(
//       db,
//       `userlist/${user.uid}/schedule/${moment(endDate).year()}/${moment(
//         startDate
//       ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}`
//     );
//     await getDocs(collectionRef)
//       .then(async (querySnap) => {
//         const data = {};
//         querySnap.forEach((doc) => {
//           data[doc.id] = doc.data();
//         });
//         // 정보가 없는 날은 새로 기본값 데이터를 생성하여 DB에 저장한다.
//         for (
//           let i = moment(startDate);
//           i.isSameOrBefore(endDate);
//           i.add(1, "d")
//         ) {
//           if (data[i.format("YYYYMMDD")]) continue;
//           const defaultDayInfo = {
//             start: moment(i).hour(9).minute(0).second(0).toDate(),
//             started: null,
//             finish: moment(i).hour(18).minute(0).second(0).toDate(),
//             finished: null,
//             log: [],
//             type: "0",
//             holiday: isHoliday(i),
//           };
//           data[i.format("YYYYMMDD")] = defaultDayInfo;
//           const docRef = doc(collectionRef, moment(i).format("YYYYMMDD"));
//           await setDoc(docRef, defaultDayInfo);
//         }
//         data.info = {
//           type: "created",
//           worktime: workdays(startDate, endDate) * 8 * 60 * 60 * 1000,
//           worked: 0,
//         };
//         await setDoc(doc(collectionRef, "info"), data.info);

//         setThisMonth(data);
//       })
//       .then(() => setLoading(false));
//   }, [user.uid]);

//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   console.log(thisMonth);
//   return loading ? <Loading /> : <>fetched!</>;
// };

// const CustomStaticCalendar = ({ match }) => {
//   const [thisDate, setThisDate] = useState(null);
//   const [nextDate, setNextDate] = useState(null);
//   const [monthData, setMonthData] = useState({});
//   const user = useContext(UserContext);
//   // console.log(startDate, endDate);
//   // console.log(workdays(startDate, endDate));

//   const collectionRef = useMemo(
//     () =>
//       collection(
//         db,
//         `userlist/${user.uid}/schedule/${endDate.year()}/${startDate.format(
//           "YYYYMMDD"
//         )}-${endDate.format("YYYYMMDD")}`
//       ),
//     [user.uid]
//   );

//   const fetchMonthData = useCallback(async () => {
//     await getDocs(collectionRef).then(async (querySnap) => {
//       const newData = {};
//       querySnap.forEach((doc) => {
//         newData[doc.id] = doc.data();
//       });
//       if (Object.keys(newData).length === 0) {
//         // 다음 달에 대한 정보가 DB에 없으므로 새로 생성!
//         for (
//           let i = moment(startDate);
//           i.isSameOrBefore(endDate);
//           i.add(1, "d")
//         ) {
//           const defaultDayInfo = {
//             start: moment(i).hour(9).toDate(),
//             started: null,
//             finish: moment(i).hour(18).toDate(),
//             finished: null,
//             log: [],
//             type: "0",
//             holiday: isHoliday(i),
//           };
//           const docRef = doc(collectionRef, moment(i).format("YYYYMMDD"));
//           await setDoc(docRef, defaultDayInfo);
//         }
//         newData.info = {
//           type: "created",
//           worktime: workdays(startDate, endDate) * 8 * 60 * 60 * 1000,
//           worked: 0,
//         };
//         await setDoc(doc(collectionRef, "info"), newData.info);
//       }
//       setMonthData(newData);
//     });
//   }, [collectionRef]);

//   const handleSubmit = async () => {
//     const { info } = monthData;
//     info.type = "submitted";
//     await updateDoc(doc(collectionRef, "info"), info);
//   };

//   useEffect(() => {
//     fetchMonthData();
//     const q = query(collectionRef);
//     const unsub = onSnapshot(q, (snapshot) => {
//       snapshot.docChanges().forEach((change) => {
//         if (change.type === "modified") {
//           const doc = change.doc;
//           setMonthData((data) => ({ ...data, [doc.id]: doc.data() }));
//         }
//       });
//     });

//     return () => {
//       setThisDate(null);
//       setNextDate(null);
//       setMonthData({});
//       unsub();
//     };
//   }, [fetchMonthData, collectionRef]);

//   return (
//     <>
//       <Grid container columns={12}>
//         <Route path={match.path}>
//           <LocalizationProvider dateAdapter={AdapterMoment}>
//             <Grid item xs={12} md={6}>
//               <StaticDatePicker
//                 value={thisDate}
//                 defaultCalendarMonth={moment(startDate)}
//                 displayStaticWrapperAs="desktop"
//                 onChange={(newDate) => {
//                   // setDate(newDate);
//                   setThisDate(newDate);
//                   setNextDate(null);
//                 }}
//                 renderInput={(props) => <TextField {...props} />}
//                 renderDay={(day, selectedDates, pickersDayProps) => (
//                   <CustomPickersDay
//                     {...pickersDayProps}
//                     match={match}
//                     data={monthData[moment(day).format("YYYYMMDD")]}
//                   />
//                 )}
//                 minDate={startDate}
//                 maxDate={moment().endOf("month")}
//               />
//             </Grid>
//             <Grid item xs={12} md={6}>
//               <StaticDatePicker
//                 value={nextDate}
//                 defaultCalendarMonth={moment(endDate)}
//                 displayStaticWrapperAs="desktop"
//                 onChange={(newDate) => {
//                   // setDate(newDate);
//                   setNextDate(newDate);
//                   setThisDate(null);
//                 }}
//                 renderInput={(props) => <TextField {...props} />}
//                 renderDay={(day, selectedDates, pickersDayProps) => (
//                   <CustomPickersDay
//                     {...pickersDayProps}
//                     match={match}
//                     data={monthData[moment(day).format("YYYYMMDD")]}
//                   />
//                 )}
//                 minDate={moment().add(1, "month").startOf("month")}
//                 maxDate={endDate}
//               />
//             </Grid>
//           </LocalizationProvider>
//           <Button variant="contained" onClick={handleSubmit}>
//             submit
//           </Button>
//         </Route>
//         <Route
//           path={`${match.path}/:date`}
//           render={(props) => (
//             <SelectedDateDisplay
//               {...props}
//               data={
//                 monthData[moment(props.match.params.date).format("YYYYMMDD")]
//               }
//             />
//           )}
//         />
//       </Grid>
//     </>
//   );
// };

// export const isBetween = (startDate, endDate, date) => {
//   return (
//     moment(date).isSameOrAfter(startDate.startOf("day")) &&
//     moment(date).isSameOrBefore(endDate.endOf("day"))
//   );
// };

// const dateColor = (date) => {
//   if (date.day() === 0) return { color: "error.main" };
//   else if (date.day() === 6) return { color: "primary.main" };
//   return {};
// };

// const borderByType = (data) => {
//   if (!data) return {};
//   const { type } = data;
//   if (type === "0")
//     // 정상 근로
//     return {};
//   else if (type === "1")
//     // 연차
//     return {
//       border: "2px solid",
//       borderColor: "error.main",
//     };
//   else if (type === "2")
//     // 오전 반차
//     return {
//       border: "2px solid",
//       borderColor: "error.main",
//       borderBottomColor: "transparent",
//       borderRightColor: "transparent",
//     };
//   else if (type === "3")
//     // 오후 반차
//     return {
//       border: "2px solid",
//       borderColor: "error.main",
//       borderTopColor: "transparent",
//       borderLeftColor: "transparent",
//     };
//   // 병가
//   else return {};
// };

// const CustomPickersDay = (props) => {
//   const { day, match, outsideCurrentMonth, data } = props;
//   return isBetween(startDate, endDate, day) && !outsideCurrentMonth ? (
//     <Link to={`${match.path}/${day.format("YYYYMMDD")}`}>
//       <Tooltip title={<Box>{TooltipWithInfo(data)}</Box>}>
//         <PickersDay
//           {...props}
//           sx={{
//             ...dateColor(day),
//             ...borderByType(data),
//           }}
//         />
//       </Tooltip>
//     </Link>
//   ) : (
//     <PickersDay {...props} />
//   );
// };

// const TooltipWithInfo = (data) => {
//   const text = data ? (
//     data.holiday ? (
//       <p>휴일</p>
//     ) : (
//       <>
//         <p>{moment(data.start.toDate()).format("HH:mm")}</p>
//         <p>{moment(data.finish.toDate()).format("HH:mm")}</p>
//       </>
//     )
//   ) : (
//     <></>
//   );
//   return text;
// };

// const SelectedDateDisplay = (props) => {
//   const {
//     match: {
//       params: { date },
//     },
//     data,
//   } = props;

//   // 하루 최소 근로 시간
//   const minHours = 4;

//   const [type, setType] = useState("0");
//   const [hour, setHour] = useState([0, 0]);
//   const [loading, setLoading] = useState(true);

//   const user = useContext(UserContext);
//   const docRef = doc(
//     db,
//     `userlist/${user.uid}/schedule/${endDate.year()}/${startDate.format(
//       "YYYYMMDD"
//     )}-${endDate.format("YYYYMMDD")}/${date}`
//   );

//   const handleRadioChange = async ({ target: { value } }) => {
//     setType(value);
//     await updateDoc(docRef, {
//       type: value,
//     });
//   };

//   const handleChange = async (event, newValue, activeThumb) => {
//     if (!Array.isArray(newValue)) {
//       return;
//     }

//     let newHour;
//     if (activeThumb === 0) {
//       newHour = [Math.min(newValue[0], hour[1] - minHours), hour[1]];
//       setHour(newHour);
//       await updateDoc(docRef, {
//         start: moment(date).hour(newHour[0]).toDate(),
//         finish: moment(date).hour(newHour[1]).toDate(),
//       });
//     } else {
//       newHour = [hour[0], Math.max(newValue[1], hour[0] + minHours)];
//       setHour(newHour);
//       await updateDoc(docRef, {
//         start: moment(date).hour(newHour[0]).toDate(),
//         finish: moment(date).hour(newHour[1]).toDate(),
//       });
//     }
//   };

//   useEffect(() => {
//     if (data !== undefined) {
//       setType(data.type);
//       setHour([
//         moment(data.start.toDate()).hour(),
//         moment(data.finish.toDate()).hour(),
//       ]);
//       setLoading(false);
//     }
//     return () => {
//       setType("0");
//       setLoading(true);
//       setHour([0, 0]);
//     };
//   }, [data]);

//   return (
//     <>
//       <Grid item xs={12}>
//         <Typography variant="h4">{moment(date).format("M/D ddd")}</Typography>
//       </Grid>
//       {!isHoliday(date) ? (
//         <>
//           <Grid item xs={6}>
//             <FormControl>
//               <RadioGroup value={type} onChange={handleRadioChange} disabled>
//                 <FormControlLabel value={0} control={<Radio />} label="근로" />
//                 <FormControlLabel value={1} control={<Radio />} label="연차" />
//                 <FormControlLabel
//                   value={2}
//                   control={<Radio />}
//                   label="반차(오전)"
//                 />
//                 <FormControlLabel
//                   value={3}
//                   control={<Radio />}
//                   label="반차(오후)"
//                 />
//                 <FormControlLabel
//                   value={4}
//                   control={<Radio />}
//                   label="병가"
//                   disabled
//                 />
//               </RadioGroup>
//             </FormControl>
//           </Grid>
//           <Grid item xs={6}>
//             <Slider
//               // scale={(value) => 30 - value}
//               size="small"
//               orientation="vertical"
//               value={hour}
//               onChange={handleChange}
//               disabled={loading}
//               disableSwap
//               valueLabelDisplay="auto"
//               marks={sliderMarks}
//               min={8}
//               max={22}
//               valueLabelFormat={(value) => `${value}:00`}
//             />
//           </Grid>
//         </>
//       ) : (
//         <Typography variant="h6">휴무일입니다!</Typography>
//       )}
//     </>
//   );
// };

// const sliderMarks = [
//   { value: 8, label: "8:00" },
//   { value: 9, label: "9:00" },
//   { value: 10, label: "10:00" },
//   { value: 11, label: "11:00" },
//   { value: 12, label: "12:00" },
//   { value: 13, label: "13:00" },
//   { value: 14, label: "14:00" },
//   { value: 15, label: "15:00" },
//   { value: 16, label: "16:00" },
//   { value: 17, label: "17:00" },
//   { value: 18, label: "18:00" },
//   { value: 19, label: "19:00" },
//   { value: 20, label: "20:00" },
//   { value: 21, label: "21:00" },
//   { value: 22, label: "22:00" },
// ];

export default Schedule;
