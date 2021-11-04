import React from "react";
import moment from "moment";
import CustomCalendar from "./CustomCalendar";

const Schedule = () => {
  const startDate =
    moment().date() < 25
      ? moment().date(25)
      : moment().endOf("month").add(25, "d");
  const endDate = moment(startDate).endOf("month").add(24, "d");
  return (
    <>
      <CustomCalendar startDate={startDate} endDate={endDate} />
    </>
    // <LocalizationProvider dateAdapter={AdapterMoment}>
    //   <StaticDatePicker minDate={}/>
    // </LocalizationProvider>
    // <LocalizationProvider dateAdapter={AdapterMoment}>
    //   <StaticDatePicker
    //     readOnly={true}
    //     sx={{ overflow: "display" }}
    //     orientation="portrait"
    //     value={date}
    //     openTo="day"
    //     onChange={(date) => setDate(date)}
    //     renderInput={
    //       (params) => <TextField {...params} />
    //       // null
    //     }
    //     renderDay={(day, _value, props) => {
    //       return (
    //         <Badge
    //           key={day.toString()}
    //           badgeContent={
    //             !props.outsideCurrentMonth ? new Date(day).getDate() : undefined
    //           }
    //           overlap="circular"
    //           sx={{
    //             width: 100,
    //             height: 100,
    //             bgcolor: "orange",
    //           }}
    //         >
    //           {/* <PickersDay {...props} /> */}
    //           <Box sx={{ width: 40, height: 40 }}>
    //             {!props.outsideCurrentMonth && <DayComponent />}
    //           </Box>
    //           {/* {!props.outsideCurrentMonth ? (
    //             <IconButton>{8}</IconButton>
    //           ) : (
    //             <Box sx={{ width: 40, height: 40 }}></Box>
    //           )} */}
    //         </Badge>
    //       );
    //     }}
    //   />
    // </LocalizationProvider>
  );
};

export default Schedule;
