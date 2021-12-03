import React, { createContext, useContext, useEffect, useState } from "react";
import {
  CalendarPickerSkeleton,
  LocalizationProvider,
  StaticDatePicker,
} from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
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
} from "@mui/material";
import moment from "moment";
import {
  dayRef,
  fetchCalendarEvents,
  fetchMonthData,
  initialDailyData,
} from "../docFunctions";
import { UserContext } from "../contexts/Context";
import {
  query,
  setDoc,
  getDoc,
  updateDoc,
  Timestamp,
} from "@firebase/firestore";

// 현재 @mui/lab 버전에서는 MonthPicker 에러때문에 월 선택창을 띄우는 것이 불가능!
// 기능은 정상이지만, 에러 메시지가 계속 출력됨.
// 주기적으로 확인 필요

// /schedule 접속 시 fetch하는 정산일 정보를 context에 저장
const EventsContext = createContext();

const Schedule = () => {
  const user = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(moment()); // 선택된 날짜
  const [monthData, setMonthData] = useState({}); // 선택된 월의 데이터
  const [loading, setLoading] = useState(true); // monthData fetch 여부
  const [events, setEvents] = useState({}); // 휴무, 공휴일, 행사, 정산 일정
  // payday 문서 fetch
  useEffect(() => {
    fetchCalendarEvents().then((snapshot) => {
      const e = {};
      snapshot.forEach((doc) => (e[doc.id] = doc.data()));
      setEvents(e);
    });
    return () => {
      setEvents();
    };
  }, []);

  // 최초 월 단위 데이터 fetch
  useEffect(() => {
    fetchMonthData(user.uid, moment())
      .then((snapshot) => {
        const data = {};
        snapshot.forEach(
          (doc) => (data[moment().date(doc.id).format("YYYYMMDD")] = doc.data())
        );
        setMonthData(data);
      })
      .then(() => setLoading(false));

    return () => {
      setLoading(true);
      setMonthData();
    };
  }, [user.uid]);

  // 달력 넘어갈 때마다 월 단위 데이터 fetch
  // 만약 해당 월에 데이터가 존재하지 않으면 데이터는 갱신되지 않음.
  const handleMonthChange = async (date) => {
    setLoading(true);
    fetchMonthData(user.uid, date)
      .then((snapshot) => {
        const data = {};
        snapshot.forEach(
          (doc) =>
            (data[moment(date).date(doc.id).format("YYYYMMDD")] = doc.data())
        );
        setMonthData(data);
      })
      .then(() => setLoading(false));
  };

  const handleClose = (event) => setOpen(false);

  return (
    <EventsContext.Provider value={events}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
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
              height: "80%",
              overflowY: "scroll",
            }}
          >
            {events && events.payday && (
              <ApplicationDisplay onClose={handleClose} />
            )}
          </Paper>
        </Modal>
        <Grid container spacing={1} columns={12}>
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Paper
                sx={{
                  position: "relative",
                  width: { xs: "100%", md: 320 },
                  height: 340,
                  overflowY: "hidden",
                }}
              >
                {/* <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showNextMonth}
                        onChange={(event) =>
                          setShowNextMonth(event.target.checked)
                        }
                      />
                    }
                    label="다음 달 근무 신청하기"
                  />
                </FormGroup> */}
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  // showDaysOutsideCurrentMonth
                  loading={loading}
                  minDate={moment("2021-01-01")}
                  value={date}
                  onChange={(newValue) => setDate(newValue)}
                  renderLoading={() => <CalendarPickerSkeleton />}
                  renderInput={(params) => (
                    <TextField {...params} helperText={"날짜를 입력하세요"} />
                  )}
                  onMonthChange={handleMonthChange}
                  showTodayButton={true}
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
          </Grid>
        </Grid>
      </LocalizationProvider>
    </EventsContext.Provider>
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
  // payday.history.at(-1) == 최근 정산일
  // payday.next[0] == 다음 정산 예정일
  // payday.next[1] == 다다음 정산 예정일
  // const [dates, setDates] = useState([]);
  const user = useContext(UserContext);
  const events = useContext(EventsContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async (date) => {
      // setLoading(true);
      const key = moment(date).format("YYYYMMDD");
      const q = query(dayRef(user.uid, moment(date)));
      await getDoc(q).then(async (doc) => {
        if (doc.exists()) {
          setData((prev) => ({ ...prev, [key]: doc.data() }));
        } else {
          const defaultData = initialDailyData(moment(date));
          setData((prev) => ({ ...prev, [key]: defaultData }));
          await setDoc(q, defaultData);
        }
      });
    };

    if (events && events.payday && events.payday.next) {
      const startDate = events.payday.next[0].toDate();
      const finishDate = events.payday.next[1].toDate();
      for (
        let d = moment(startDate);
        d.isBefore(moment(finishDate));
        d.add(1, "d")
      ) {
        fetchData(d).then(() => {
          if (d.format("YMD") === moment(finishDate).format("YMD")) {
            setLoading(false);
          }
        });
      }
    } else setLoading(false);

    return () => {
      setLoading(true);
      setData();
    };
  }, [user.uid, events]);

  const handleStartChange = async (event, date) => {
    const docRef = dayRef(user.uid, date);
    const start = Timestamp.fromDate(
      moment(date).startOf("d").hour(event.target.value).toDate()
    );
    const newData = { ...data[date], start };
    setData((prev) => ({ ...prev, [date]: newData }));
    await updateDoc(docRef, newData);
  };

  const handleFinishChange = async (event, date) => {
    const docRef = dayRef(user.uid, date);
    const finish = Timestamp.fromDate(
      moment(date).startOf("d").hour(event.target.value).toDate()
    );
    const newData = { ...data[date], finish };
    setData((prev) => ({ ...prev, [date]: newData }));
    await updateDoc(docRef, newData);
  };

  const handleTypeChange = async (event, date) => {
    const docRef = dayRef(user.uid, date);
    const type = event.target.value;
    const newData = { ...data[date], type };
    setData((prev) => ({ ...prev, [date]: newData }));
    await updateDoc(docRef, newData);
  };

  return loading ? (
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
        <Typography variant="body1">{`${moment(
          events.payday.next[0].toDate()
        ).format("Y년 M월 D일")} ~ ${moment(events.payday.next[1].toDate())
          .subtract(1, "d")
          .format("Y년 M월 D일")}`}</Typography>
        <Button onClick={onClose}>OK</Button>
      </ListSubheader>
      {Object.keys(data).map((date, index) => (
        <Box key={index}>
          <ListItem>
            <ListItemText variant="body2">
              {moment(date).format("M월 D일")}
            </ListItemText>
            <FormControl variant="standard">
              <InputLabel>근로 형태</InputLabel>
              <Select
                value={data[date].type}
                onChange={(event) => handleTypeChange(event, date)}
              >
                <MenuItem value="work">근로</MenuItem>
                <MenuItem value="annual">연차</MenuItem>
                <MenuItem value="half">반차</MenuItem>
              </Select>
            </FormControl>

            <FormControl variant="standard">
              <InputLabel>출근</InputLabel>
              <Select
                value={data[date].start.toDate().getHours()}
                label="출근"
                onChange={(event) => handleStartChange(event, date)}
                disabled={data[date].type === "annual"}
              >
                <MenuItem value={9}>9시</MenuItem>
                <MenuItem value={10}>10시</MenuItem>
                <MenuItem value={11}>11시</MenuItem>
                <MenuItem value={12}>12시</MenuItem>
                <MenuItem value={13}>13시</MenuItem>
                <MenuItem value={14}>14시</MenuItem>
                <MenuItem value={15}>15시</MenuItem>
                <MenuItem value={16}>16시</MenuItem>
                <MenuItem value={17}>17시</MenuItem>
                <MenuItem value={18}>18시</MenuItem>
                <MenuItem value={19}>19시</MenuItem>
                <MenuItem value={20}>20시</MenuItem>
                <MenuItem value={21}>21시</MenuItem>
                <MenuItem value={22}>22시</MenuItem>
              </Select>
            </FormControl>
            <FormControl variant="standard">
              <InputLabel>퇴근</InputLabel>
              <Select
                value={data[date].finish.toDate().getHours()}
                label="퇴근"
                onChange={(event) => handleFinishChange(event, date)}
                disabled={data[date].type === "annual"}
              >
                <MenuItem value={9}>9시</MenuItem>
                <MenuItem value={10}>10시</MenuItem>
                <MenuItem value={11}>11시</MenuItem>
                <MenuItem value={12}>12시</MenuItem>
                <MenuItem value={13}>13시</MenuItem>
                <MenuItem value={14}>14시</MenuItem>
                <MenuItem value={15}>15시</MenuItem>
                <MenuItem value={16}>16시</MenuItem>
                <MenuItem value={17}>17시</MenuItem>
                <MenuItem value={18}>18시</MenuItem>
                <MenuItem value={19}>19시</MenuItem>
                <MenuItem value={20}>20시</MenuItem>
                <MenuItem value={21}>21시</MenuItem>
                <MenuItem value={22}>22시</MenuItem>
              </Select>
            </FormControl>
          </ListItem>
          <Divider variant="fullWidth" />
        </Box>
      ))}
    </List>
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
