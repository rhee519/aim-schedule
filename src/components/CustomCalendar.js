import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Button,
} from "@mui/material";
import moment from "moment";
import {
  // collection,
  doc,
  getDoc,
  // getDocs,
  setDoc,
  updateDoc,
} from "@firebase/firestore";
import { db } from "../myFirebase";
import { UserContext } from "../contexts/Context";
// import { LocalizationProvider, StaticDatePicker } from "@mui/lab";
// import AdapterMoment from "@mui/lab/AdapterMoment";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

const DateOutOfRangeComponent = ({ day, isCalendarStart }) => {
  // const dateLabel =
  //   isCalendarStart || day.date() === 1 ? day.format("M/D") : day.format("D");
  return <Typography>{/* {dateLabel} */}</Typography>;
};

const DateInRangeComponent = ({ day, isWeekend, isCalendarStart }) => {
  const defaultHour = isWeekend ? 0 : 8;

  const [hour, setHour] = useState(defaultHour);
  const dateLabel =
    isCalendarStart || day.date() === 1 ? day.format("M/D") : day.format("D");

  const onHourSelect = (event) => {
    const {
      target: { value },
    } = event;
    // setLocalData(newData);
    setHour(value);
  };

  return (
    <>
      {/* {day.date()} */}
      <FormControl fullWidth>
        <InputLabel>{dateLabel}</InputLabel>
        <Select value={hour} onChange={onHourSelect} sx={{ height: 30 }}>
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
    </>
  );
};

//eslint-disable-next-line
const DateComponent = ({ day, isWeekend, isCalendarStart, outOfMonth }) => {
  return outOfMonth ? (
    <DateOutOfRangeComponent day={day} isCalendarStart={isCalendarStart} />
  ) : (
    <DateInRangeComponent
      day={day}
      isWeekend={isWeekend}
      isCalendarStart={isCalendarStart}
    />
  );
};

const WeekWrapper = () => {
  return (
    <Grid container columns={14} spacing={1}>
      {weekdays.map((value, index) => (
        <Grid key={index} item xs={2}>
          <Typography>{value}</Typography>
        </Grid>
      ))}
    </Grid>
  );
};

export const getMonthRange = () => {
  // 오늘을 포함하는 25일 ~ 24일 범위를 return!
  const startDate =
    moment().date() < 25
      ? moment().subtract(1, "month").date(25)
      : moment().date(25);
  const endDate = moment(startDate).add(1, "month").date(24);
  return { startDate, endDate };
};

export const getNextMonthRange = () => {
  // 다음 25일 ~ 24일 범위를 return!
  const startDate =
    moment().date() < 25
      ? moment().date(25)
      : moment().endOf("month").add(25, "d");
  const endDate = moment(startDate).add(1, "month").date(24).endOf("day");
  return { startDate, endDate };
};

const CustomCalendar = (props) => {
  // console.log("custom-calendar");
  const { startDate, endDate, application, match } = props;
  // console.log(match.params);
  const [days, setDays] = useState([]);
  useEffect(() => {
    const days = [];
    const calendarStart = moment(startDate).startOf("week");
    const calendarEnd = moment(endDate).endOf("week");
    for (let i = calendarStart; i.isSameOrBefore(calendarEnd); i.add(1, "d")) {
      days.push(moment(i));
    }
    setDays(days);
    return () => {
      setDays([]);
    };
  }, [startDate, endDate]);

  return (
    <>
      <Box>
        <WeekWrapper />
        <Grid container columns={14} spacing={1}>
          {application
            ? days.map((value, index) => (
                <Grid item xs={2} key={index}>
                  <Link
                    to={`${match.path}?date=${moment(value).format(
                      "YYYYMMDD"
                    )}`}
                  >
                    <ApplicationDayComponent {...props} date={value} />
                  </Link>
                </Grid>
              ))
            : days.map((value, index) => (
                <Grid item xs={2} key={index}>
                  <SummaryDayView {...props} date={value} />
                </Grid>
              ))}
        </Grid>
        {application && (
          <>
            <Button>Save</Button>
            <Button>Submit</Button>
          </>
        )}
      </Box>
    </>
  );
};

const ApplicationDayComponent = (props) => {
  const { date, startDate, endDate } = props;
  const [data, setData] = useState(undefined);
  const user = useContext(UserContext);

  const fetchData = useCallback(async () => {
    const docRef = doc(
      db,
      `userlist/${user.uid}/schedule/${moment(endDate).year()}/${moment(
        startDate
      ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}/${moment(
        date
      ).format("YYYYMMDD")}`
    );
    await getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    });
  }, [user.uid, startDate, endDate, date]);

  useEffect(() => {
    fetchData();
    return () => {
      setData({});
    };
  }, [fetchData]);

  // data && console.log(data.start.toDate(), data.finish.toDate());
  return (
    <Button
      variant="body2"
      fullWidth
      disabled={
        moment(date).isBefore(moment(startDate).startOf("day")) ||
        moment(date).isAfter(moment(endDate).endOf("day"))
      }
    >
      {moment(date).format("D")}
      {/* <ApplicationDayDisplay {...props} /> */}
      {data && data.start && data.finish && (
        <Typography variant="caption">
          {`${moment(data.start.toDate()).format("HH:mm")} ~ ${moment(
            data.finish.toDate()
          ).format("HH:mm")}`}
        </Typography>
      )}
    </Button>
  );
};

export const ApplicationCalendar = ({ match, location }) => {
  // const [date, setDate] = useState();
  console.log(location);
  const { startDate, endDate } = getNextMonthRange();
  const user = useContext(UserContext);
  // const startDate =
  //   moment().date() < 25
  //     ? moment().date(25)
  //     : moment().endOf("month").add(25, "d");
  // const endDate = moment(startDate).endOf("month").add(24, "d");

  const setNextMonth = useCallback(async () => {
    const docRef = doc(
      db,
      `userlist/${user.uid}/schedule/${moment(endDate).year()}/${moment(
        startDate
      ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}/info`
    );
    await getDoc(docRef).then(async (docSnap) => {
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          confirm: false,
          worked: 0,
          worktime: 0,
        });
      } else {
        // console.log(docSnap.data());
      }
    });
  }, [user.uid, startDate, endDate]);

  useEffect(() => {
    setNextMonth();
  }, [setNextMonth]);

  return (
    <Box>
      <Typography variant="h6">{`${moment(startDate).format(
        "YYYY년 MM월 DD일"
      )} ~ ${moment(endDate).format("YYYY년 MM월 DD일")}`}</Typography>
      <CustomCalendar
        startDate={startDate}
        endDate={endDate}
        application
        // setDate={setDate}
        match={match}
      />
      {/* {date && (
        <ApplicationDayDisplay
          date={date}
          startDate={startDate}
          endDate={endDate}
        />
      )} */}
    </Box>
  );
};

export const ApplicationDayDisplay = (props) => {
  const { date, startDate, endDate } = props;
  const user = useContext(UserContext);
  const [type, setType] = useState("0");
  // 0: 정상 근로, 1: 연차(종일), 2: 반차(오전), 3: 반차(오후), 4: 병가
  const docRef = doc(
    db,
    `userlist/${user.uid}/schedule/${moment(endDate).year()}/${moment(
      startDate
    ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}`,
    moment(date).format("YYYYMMDD")
  );

  const fetchData = useCallback(async () => {
    await getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const { type } = docSnap.data();
        setType(type || "0");
      } else {
        setDoc(docRef, {
          start: moment(date).startOf("day").hour(9).toDate(),
          finish: moment(date).startOf("day").hour(18).toDate(),
          started: null,
          finished: null,
          log: [],
          type: "0",
        });
      }
    });
  }, [docRef, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRadioChange = async ({ target: { value } }) => {
    setType(value);
    await updateDoc(docRef, {
      type: value,
    });
  };

  return (
    <Box>
      <FormControl>
        <FormLabel>{moment(date).format("M/D")}</FormLabel>
        <RadioGroup row value={type} onChange={handleRadioChange}>
          <FormControlLabel value={0} control={<Radio />} label="근로" />
          <FormControlLabel value={1} control={<Radio />} label="연차" />
          <FormControlLabel value={2} control={<Radio />} label="반차(오전)" />
          <FormControlLabel value={3} control={<Radio />} label="반차(오후)" />
          <FormControlLabel
            value={4}
            control={<Radio />}
            label="병가"
            disabled
          />
        </RadioGroup>
      </FormControl>
    </Box>
  );
};

const SummaryDayView = (props) => {
  return <SummaryDayDisplay {...props} />;
};

const SummaryDayDisplay = (props) => {
  const { date, startDate, endDate } = props;
  const outOfMonth =
    moment(date).isBefore(moment(startDate).startOf("day")) ||
    moment(date).isAfter(moment(endDate).endOf("day"));
  return (
    <Typography
      variant="body2"
      sx={{
        color: outOfMonth ? "text.secondary" : "text.primary",
      }}
    >
      {moment(date).format("D")}
    </Typography>
  );
};

export default CustomCalendar;
