import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// import { ApplicationCalendar } from "./CustomCalendar";
import { Link, Route } from "react-router-dom";
import { LocalizationProvider, PickersDay, StaticDatePicker } from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
import {
  TextField,
  Box,
  Grid,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
  Typography,
  Slider,
  Button,
} from "@mui/material";
import moment from "moment";
import { getNextMonthRange } from "./CustomCalendar";
import { UserContext } from "../contexts/Context";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
} from "@firebase/firestore";
import { db } from "../myFirebase";

const { startDate, endDate } = getNextMonthRange();
const isHoliday = (date) => {
  // 추후에 한국 공휴일 API 긁어와서 포함시키자!
  return moment(date).day() === 0 || moment(date).day() === 6;
};

const workdays = (startDate, endDate) => {
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

const Schedule = ({ match }) => {
  return (
    <>
      <Route path={`${match.path}/check`} />
      <Route
        path={`${match.path}/application`}
        component={CustomStaticCalendar}
      />
    </>
  );
};

const CustomStaticCalendar = ({ match }) => {
  const [thisDate, setThisDate] = useState(null);
  const [nextDate, setNextDate] = useState(null);
  const [monthData, setMonthData] = useState({});
  const user = useContext(UserContext);
  // console.log(startDate, endDate);
  // console.log(workdays(startDate, endDate));

  const collectionRef = useMemo(
    () =>
      collection(
        db,
        `userlist/${user.uid}/schedule/${endDate.year()}/${startDate.format(
          "YYYYMMDD"
        )}-${endDate.format("YYYYMMDD")}`
      ),
    [user.uid]
  );

  const fetchMonthData = useCallback(async () => {
    await getDocs(collectionRef).then(async (querySnap) => {
      const newData = {};
      querySnap.forEach((doc) => {
        newData[doc.id] = doc.data();
      });
      if (Object.keys(newData).length === 0) {
        // 다음 달에 대한 정보가 DB에 없으므로 새로 생성!
        for (
          let i = moment(startDate);
          i.isSameOrBefore(endDate);
          i.add(1, "d")
        ) {
          const defaultDayInfo = {
            start: moment(i).hour(9).toDate(),
            started: null,
            finish: moment(i).hour(18).toDate(),
            finished: null,
            log: [],
            type: "0",
            holiday: isHoliday(i),
          };
          const docRef = doc(collectionRef, moment(i).format("YYYYMMDD"));
          await setDoc(docRef, defaultDayInfo);
        }
        newData.info = {
          type: "created",
          worktime: workdays(startDate, endDate) * 8 * 60 * 60 * 1000,
          worked: 0,
        };
        await setDoc(doc(collectionRef, "info"), newData.info);
      }
      setMonthData(newData);
    });
  }, [collectionRef]);

  useEffect(() => {
    fetchMonthData();
    const q = query(collectionRef);
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const doc = change.doc;
          setMonthData((data) => ({ ...data, [doc.id]: doc.data() }));
        }
      });
    });

    return () => {
      setThisDate(null);
      setNextDate(null);
      setMonthData({});
      unsub();
    };
  }, [fetchMonthData, collectionRef]);

  return (
    <>
      <Grid container columns={12}>
        <Route path={match.path}>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <Grid item xs={12} md={6}>
              <StaticDatePicker
                value={thisDate}
                defaultCalendarMonth={moment(startDate)}
                displayStaticWrapperAs="desktop"
                onChange={(newDate) => {
                  // setDate(newDate);
                  setThisDate(newDate);
                  setNextDate(null);
                }}
                renderInput={(props) => <TextField {...props} />}
                renderDay={(day, selectedDates, pickersDayProps) => (
                  <CustomPickersDay
                    {...pickersDayProps}
                    match={match}
                    data={monthData[moment(day).format("YYYYMMDD")]}
                  />
                )}
                minDate={startDate}
                maxDate={moment().endOf("month")}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StaticDatePicker
                value={nextDate}
                defaultCalendarMonth={moment(endDate)}
                displayStaticWrapperAs="desktop"
                onChange={(newDate) => {
                  // setDate(newDate);
                  setNextDate(newDate);
                  setThisDate(null);
                }}
                renderInput={(props) => <TextField {...props} />}
                renderDay={(day, selectedDates, pickersDayProps) => (
                  <CustomPickersDay
                    {...pickersDayProps}
                    match={match}
                    data={monthData[moment(day).format("YYYYMMDD")]}
                  />
                )}
                minDate={moment().add(1, "month").startOf("month")}
                maxDate={endDate}
              />
            </Grid>
          </LocalizationProvider>
          <Button variant="contained">submit</Button>
        </Route>
        <Route
          path={`${match.path}/:date`}
          render={(props) => (
            <SelectedDateDisplay
              {...props}
              data={
                monthData[moment(props.match.params.date).format("YYYYMMDD")]
              }
            />
          )}
        />
      </Grid>
    </>
  );
};

export const isBetween = (startDate, endDate, date) => {
  return (
    moment(date).isSameOrAfter(startDate.startOf("day")) &&
    moment(date).isSameOrBefore(endDate.endOf("day"))
  );
};

const dateColor = (date) => {
  if (date.day() === 0) return { color: "error.main" };
  else if (date.day() === 6) return { color: "primary.main" };
  return {};
};

const borderByType = (data) => {
  if (!data) return {};
  const { type } = data;
  if (type === "0")
    // 정상 근로
    return {};
  else if (type === "1")
    // 연차
    return {
      border: "2px solid",
      borderColor: "error.main",
    };
  else if (type === "2")
    // 오전 반차
    return {
      border: "2px solid",
      borderColor: "error.main",
      borderBottomColor: "transparent",
      borderRightColor: "transparent",
    };
  else if (type === "3")
    // 오후 반차
    return {
      border: "2px solid",
      borderColor: "error.main",
      borderTopColor: "transparent",
      borderLeftColor: "transparent",
    };
  // 병가
  else return {};
};

const CustomPickersDay = (props) => {
  const { day, match, outsideCurrentMonth, data } = props;
  return isBetween(startDate, endDate, day) && !outsideCurrentMonth ? (
    <Link to={`${match.path}/${day.format("YYYYMMDD")}`}>
      <Tooltip title={<Box>{TooltipWithInfo(data)}</Box>}>
        <PickersDay
          {...props}
          sx={{
            ...dateColor(day),
            ...borderByType(data),
          }}
        />
      </Tooltip>
    </Link>
  ) : (
    <PickersDay {...props} />
  );
};

const TooltipWithInfo = (data) => {
  const text = data ? (
    data.holiday ? (
      <p>휴일</p>
    ) : (
      <>
        <p>{moment(data.start.toDate()).format("HH:mm")}</p>
        <p>{moment(data.finish.toDate()).format("HH:mm")}</p>
      </>
    )
  ) : (
    <></>
  );
  return text;
};

const SelectedDateDisplay = (props) => {
  const {
    match: {
      params: { date },
    },
    data,
  } = props;

  // 하루 최소 근로 시간
  const minHours = 4;

  const [type, setType] = useState("0");
  const [hour, setHour] = useState([0, 0]);
  const [loading, setLoading] = useState(true);

  const user = useContext(UserContext);
  const docRef = doc(
    db,
    `userlist/${user.uid}/schedule/${endDate.year()}/${startDate.format(
      "YYYYMMDD"
    )}-${endDate.format("YYYYMMDD")}/${date}`
  );

  const handleRadioChange = async ({ target: { value } }) => {
    setType(value);
    await updateDoc(docRef, {
      type: value,
    });
  };

  const handleChange = async (event, newValue, activeThumb) => {
    if (!Array.isArray(newValue)) {
      return;
    }

    let newHour;
    if (activeThumb === 0) {
      newHour = [Math.min(newValue[0], hour[1] - minHours), hour[1]];
      setHour(newHour);
      await updateDoc(docRef, {
        start: moment(date).hour(newHour[0]).toDate(),
        finish: moment(date).hour(newHour[1]).toDate(),
      });
    } else {
      newHour = [hour[0], Math.max(newValue[1], hour[0] + minHours)];
      setHour(newHour);
      await updateDoc(docRef, {
        start: moment(date).hour(newHour[0]).toDate(),
        finish: moment(date).hour(newHour[1]).toDate(),
      });
    }
  };

  useEffect(() => {
    if (data !== undefined) {
      setType(data.type);
      setHour([
        moment(data.start.toDate()).hour(),
        moment(data.finish.toDate()).hour(),
      ]);
      setLoading(false);
    }
    return () => {
      setType("0");
      setLoading(true);
      setHour([0, 0]);
    };
  }, [data]);

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h4">{moment(date).format("M/D ddd")}</Typography>
      </Grid>
      {!isHoliday(date) ? (
        <>
          <Grid item xs={6}>
            <FormControl>
              <RadioGroup value={type} onChange={handleRadioChange} disabled>
                <FormControlLabel value={0} control={<Radio />} label="근로" />
                <FormControlLabel value={1} control={<Radio />} label="연차" />
                <FormControlLabel
                  value={2}
                  control={<Radio />}
                  label="반차(오전)"
                />
                <FormControlLabel
                  value={3}
                  control={<Radio />}
                  label="반차(오후)"
                />
                <FormControlLabel
                  value={4}
                  control={<Radio />}
                  label="병가"
                  disabled
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <Slider
              // scale={(value) => 30 - value}
              size="small"
              orientation="vertical"
              value={hour}
              onChange={handleChange}
              disabled={loading}
              disableSwap
              valueLabelDisplay="auto"
              marks={sliderMarks}
              min={8}
              max={22}
              valueLabelFormat={(value) => `${value}:00`}
            />
          </Grid>
        </>
      ) : (
        <Typography variant="h6">휴무일입니다!</Typography>
      )}
    </>
  );
};

const sliderMarks = [
  { value: 8, label: "8:00" },
  { value: 9, label: "9:00" },
  { value: 10, label: "10:00" },
  { value: 11, label: "11:00" },
  { value: 12, label: "12:00" },
  { value: 13, label: "13:00" },
  { value: 14, label: "14:00" },
  { value: 15, label: "15:00" },
  { value: 16, label: "16:00" },
  { value: 17, label: "17:00" },
  { value: 18, label: "18:00" },
  { value: 19, label: "19:00" },
  { value: 20, label: "20:00" },
  { value: 21, label: "21:00" },
  { value: 22, label: "22:00" },
];

export default Schedule;
