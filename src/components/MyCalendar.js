import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Today from "./Today";

const MyCalendar = ({ userData }) => {
  const [date, SetDate] = useState(new Date());
  return (
    <>
      <Calendar value={date} onChange={SetDate} />
      <Today userData={userData} date={date} />
    </>
  );
};

export default MyCalendar;
