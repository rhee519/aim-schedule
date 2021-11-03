// import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, {
  useState,
  // useEffect, useCallback
} from "react";
// import moment from "moment";

import { TextField, Box, Tab } from "@mui/material";
import {
  TabList,
  TabPanel,
  TabContext,
  LocalizationProvider,
  DatePicker,
} from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
// import { db } from "../myFirebase";
// import getWeekNumber from "./getWeekNumber";
import MyWeekView from "./MyWeekView";

// import "../css/Summary.scss";
// eslint-disable-next-line
const Error = (error) => {
  console.log("from Summary.js");
  console.log(error);
};

const Summary = () => {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState("week");
  const onViewChange = (event, newView) => {
    setView(newView);
  };
  // const [todayWorkTime, setTodayWorkTime] = useState(0);
  // const [weekWorkTime, setWeekWorkTime] = useState(0);
  // const today = moment().format("YYYY-MM-DD");

  // const fetchData = useCallback(async () => {
  //   const dayDocRef = doc(db, `userlist/${userData.uid}/daily`, today);
  //   const weekDocRef = doc(
  //     db,
  //     `userlist/${userData.uid}/weekly`,
  //     `week${getWeekNumber(new Date())}`
  //   );
  //   await getDoc(dayDocRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists()) {
  //         setTodayWorkTime(docSnap.data().workTime);
  //       }
  //     })
  //     .catch(Error);
  //   await getDoc(weekDocRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists()) {
  //         setWeekWorkTime(docSnap.data().workTime);
  //       }
  //     })
  //     .catch(Error);
  // }, [today, userData.uid]);

  // useEffect(() => {
  //   fetchData();

  //   const q = query(doc(db, userData.uid, today));
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     fetchData();
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [userData.uid, today, fetchData]);

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <DatePicker
          label="Choose Date"
          value={date}
          onChange={(newDate) => setDate(newDate)}
          renderInput={(params) => <TextField {...params} />}
        />
        <Box
        //  sx={{ width: '100%', typography: 'body1' }}
        >
          <TabContext value={view}>
            <Box
            // sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <TabList
                onChange={onViewChange}
                aria-label="lab API tabs example"
              >
                <Tab label="DAY" value="day" />
                <Tab label="WEEK" value="week" />
                <Tab label="MONTH" value="month" />
              </TabList>
            </Box>
            <TabPanel value="day">Day View 준비중</TabPanel>
            <TabPanel value="week">
              <MyWeekView date={date} />
            </TabPanel>
            <TabPanel value="month">Month View 준비중</TabPanel>
          </TabContext>
        </Box>
      </LocalizationProvider>
    </>
    // <div className="summary--container">
    //   <h2 className="summary--title">WorkTime Summary</h2>
    //   <div className="summary--box summary-today">
    //     <div className="text--container">
    //       <span className="summary--subtitle">Today</span>
    //       <span className="summary--text">
    //         {WorkTimeString(todayWorkTime)}/8시간
    //       </span>
    //     </div>
    //     <ProgressBar workTime={todayWorkTime} targetTime={1000 * 60 * 60 * 8} />
    //   </div>
    //   <div className="summary--box summary-week">
    //     <div className="text--container">
    //       <span className="summary--subtitle">This Week</span>
    //       <span className="summary--text">
    //         {WorkTimeString(weekWorkTime)}/40시간
    //       </span>
    //     </div>
    //     <ProgressBar workTime={weekWorkTime} targetTime={1000 * 60 * 60 * 40} />
    //   </div>
    // </div>
    // <Paper>
    //   <LocalizationProvider dateAdapter={AdapterMoment}>
    //     <StaticDatePicker
    //       displayStaticWrapperAs="desktop"
    //       openTo="day"
    //       value={new Date()}
    //       onChange={(newValue) => console.log(newValue)}
    //       renderInput={(params) => <TextField {...params} />}
    //     />
    //   </LocalizationProvider>
    //   <Scheduler data={[]}>
    //     <ViewState currentDate={new Date()} />
    //     <WeekView
    //       startDayHour={9}
    //       endDayHour={18}
    //       intervalCount={1} // default
    //       // dayScaleCellComponent={() => <div>hi!</div>}
    //       // timeTableLayoutComponent={() => <div>hi!</div>}
    //       // timeTableLayoutComponent={() => <div>hi!</div>}
    //       // timeTableCellComponent={() => <div>hi!</div>}
    //       // timeTableRowComponent={() => <div>hi!</div>}
    //     />
    //   </Scheduler>
    // </Paper>
  );
};

export default Summary;
