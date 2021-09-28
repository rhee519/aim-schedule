import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Today from "../components/Today";

const MyCalendar = ({ userData }) => {
  const [date, SetDate] = useState(new Date());
  return (
    <>
      <Calendar value={date} onChange={SetDate} calendarType="US" />
      <Today userData={userData} date={date} />
    </>
  );
};

export default MyCalendar;
