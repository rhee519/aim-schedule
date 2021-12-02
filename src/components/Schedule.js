import React, { createContext, useContext, useEffect, useState } from "react";
import { LocalizationProvider, StaticDatePicker } from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
import {
  Box,
  TextField,
  MenuItem,
  Paper,
  Switch,
  Select,
  InputLabel,
  FormGroup,
  FormControl,
  FormControlLabel,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import moment from "moment";
import { dayDocRef, fetchPayday, initialDailyData } from "../docFunctions";
import { UserContext } from "../contexts/Context";
import { query, setDoc, getDoc, updateDoc } from "@firebase/firestore";

// 현재 @mui/lab 버전에서는 MonthPicker 에러때문에 월 선택창을 띄우는 것이 불가능!
// 기능은 정상이지만, 에러 메시지가 계속 출력됨.
// 주기적으로 확인 필요

// /schedule 접속 시 fetch하는 정산일 정보를 context에 저장
const PaydayContext = createContext();

const Schedule = () => {
  const [showNextMonth, setShowNextMonth] = useState(true);
  const [date, setDate] = useState(moment()); // 선택된 날짜
  const [payday, setPayday] = useState(); // 정산

  // payday 문서 fetch
  useEffect(() => {
    fetchPayday().then((docSnap) => {
      setPayday(docSnap.data());
    });
  }, []);

  // 정산 기록 문서 fetch, 없으면 새로 생성

  return (
    <PaydayContext.Provider value={payday}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <Box display={{ xs: "block", md: "flex" }} height={500}>
          <Stack>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={showNextMonth}
                    onChange={(event) => setShowNextMonth(event.target.checked)}
                  />
                }
                label="다음 달 근무 신청하기"
              />
            </FormGroup>
            <Paper
              sx={{
                maxWidth: { xs: "100%", md: 320 },
                height: 360,
              }}
            >
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                showDaysOutsideCurrentMonth
                minDate={moment("2021-01-01")}
                value={date}
                onChange={(newValue) => setDate(newValue)}
                renderInput={(params) => (
                  <TextField {...params} helperText={"날짜를 입력하세요"} />
                )}
                showTodayButton={true}
              />
            </Paper>
          </Stack>
          <Paper
            sx={{
              display: showNextMonth ? "flex" : "none",
              flexGrow: 1,
              height: "100%",
              overflowY: "scroll",
            }}
          >
            {payday && (
              <ApplicationDisplay
                selectedDate={date}
                showComponent={showNextMonth}
              />
            )}
          </Paper>
        </Box>
      </LocalizationProvider>
    </PaydayContext.Provider>
  );
};

// const SelectedDatePanel = { uid };

const ApplicationDisplay = () => {
  // payday.history.at(-1) == 최근 정산일
  // payday.next[0] == 다음 정산 예정일
  // payday.next[1] == 다다음 정산 예정일
  // const [dates, setDates] = useState([]);
  const user = useContext(UserContext);
  const payday = useContext(PaydayContext);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();

  useEffect(() => {
    const fetchData = async (date) => {
      // setLoading(true);
      const key = moment(date).format("YYYYMMDD");
      const q = query(dayDocRef(user.uid, moment(date)));
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

    if (payday && payday.next) {
      const startDate = payday.next[0].toDate();
      const finishDate = payday.next[1].toDate();
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
  }, [user.uid, payday]);

  const handleStartChange = async (event, date) => {
    const docRef = dayDocRef(user.uid, date);
    const startTime =
      moment(date).startOf("d").hour(event.target.value).toDate().getTime() /
      1000;
    const newData = { ...data[date] };
    newData.start.seconds = startTime;
    setData((prev) => ({ ...prev, [date]: newData }));
    await updateDoc(docRef, newData);
  };

  const handleFinishChange = async (event, date) => {
    const docRef = dayDocRef(user.uid, date);
    const finishTime =
      moment(date).startOf("d").hour(event.target.value).toDate().getTime() /
      1000;
    const newData = { ...data[date] };
    newData.finish.seconds = finishTime;
    setData((prev) => ({ ...prev, [date]: newData }));
    await updateDoc(docRef, newData);
  };

  return loading ? (
    <>loading...</>
  ) : (
    <List width="100%">
      {data &&
        Object.keys(data).map((date, index) => (
          <Box key={index} width="100%">
            <ListItem display="flex">
              <ListItemText variant="body2">
                {moment(date).format("M월 D일")}
              </ListItemText>
              <FormControl variant="standard">
                <InputLabel>출근</InputLabel>
                <Select
                  value={data[date].start.toDate().getHours()}
                  label="출근"
                  onChange={(event) => handleStartChange(event, date)}
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
