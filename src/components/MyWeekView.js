import React, { useCallback, useEffect, useState, useContext } from "react";
import { Box, Grid, LinearProgress, Paper } from "@mui/material";
import moment from "moment";
import { UserContext } from "../contexts/Context";
import { doc, getDoc } from "@firebase/firestore";
import { db } from "../myFirebase";

const Error = (error) => {
  console.log("from MyWeekView.js");
  console.log(error);
};

const MyWeekView = ({ date }) => {
  // const startOfWeek = moment(date).startOf("week");
  const week = [];
  for (let i = 0; i < 7; i++) week.push(moment(date).day(i));
  // console.log(week);
  return (
    <Box
      sx={{
        flexGrow: 1,
        margin: 3,
        maxWidth: 800,
      }}
    >
      {week.map((date, index) => (
        <Box
          key={index}
          sx={{
            marginBottom: 2,
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={3}>
              <DayStatus date={date} />
            </Grid>
            <Grid item xs={9}>
              <Paper>
                <DayProgressBar date={date} />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

const DayStatus = ({ date }) => {
  return (
    <Paper>
      <DayLabel date={date} />
    </Paper>
  );
};

const DayLabel = ({ date }) => {
  const month = moment(date).get("month") + 1;
  const day = moment(date).get("date");
  const text =
    moment(date).format("ddd") === "Sun" || day === 1
      ? `${month}/${day}`
      : `${day}`;

  return text;
};

const DayProgressBar = ({ date }) => {
  const { uid } = useContext(UserContext);
  const dateString = moment(date).format("YYYY-MM-DD");
  const [workTime, setWorkTime] = useState(0);

  const fetchData = useCallback(async () => {
    const dayRef = doc(db, `userlist/${uid}/daily`, dateString);
    await getDoc(dayRef)
      .then((daySnap) => {
        if (daySnap.exists()) {
          setWorkTime(daySnap.data().workTime);
        }
      })
      .catch(Error);
  }, [uid, dateString]);

  useEffect(() => {
    fetchData();
    return () => setWorkTime(0);
  }, [fetchData]);

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      <LinearProgress
        variant="determinate"
        value={workTime / (8 * 60 * 1000)}
      />
    </Box>
  );
};

export default MyWeekView;
