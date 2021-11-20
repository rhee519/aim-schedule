import React, { useContext } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { experimentalStyled as styled } from "@mui/material";
import { UserContext } from "../contexts/Context";
import CustomCalendar, { getMonthRange } from "./CustomCalendar";
import moment from "moment";
// import { styled } from "@mui/system";

const Item = styled(Paper)(({ theme }) => ({
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.primary,
}));

const Dashboard = () => {
  const userData = useContext(UserContext);
  console.log(userData);
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        columns={
          { xs: 8, sm: 8, md: 12 }
          // 12
        }
        spacing={1}
      >
        <Grid item xs={12} sm={12} md={12}>
          <Item>
            <WeekSummary />
          </Item>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Item>Day</Item>
        </Grid>
        <Grid item xs={12} sm={12} md={6}>
          <Item>
            <MonthSummary />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

const WeekSummary = () => {
  const startDate = moment().startOf("week");
  const endDate = moment().endOf("week");
  return (
    <>
      <Typography variant="h6">{`${moment(startDate).format(
        "YYYY년 MM월 DD일"
      )} ~ ${moment(endDate).format("YYYY년 MM월 DD일")}`}</Typography>
      <CustomCalendar startDate={startDate} endDate={endDate} />
    </>
  );
};

const MonthSummary = () => {
  // const today = new Date();
  const { startDate, endDate } = getMonthRange();
  // const startDate =
  //   today.getDate() < 25
  //     ? moment(today).startOf("month").subtract(1, "M").date(25)
  //     : moment(today).date(25);
  // const endDate = moment(startDate).endOf("month").add(24, "d");
  return (
    <>
      <Typography variant="h6">{`${moment(startDate).format(
        "YYYY년 MM월 DD일"
      )} ~ ${moment(endDate).format("YYYY년 MM월 DD일")}`}</Typography>
      <CustomCalendar startDate={startDate} endDate={endDate} />
    </>
  );
};
export default Dashboard;
