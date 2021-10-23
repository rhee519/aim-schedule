import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Today from "../components/Today";
import "../css/MyCalendar.scss";

const MyCalendar = () => {
  const [date, SetDate] = useState(new Date());
  const dateFormat = require("dateformat");
  dateFormat.i18n = {
    dayNames: [
      "일",
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  };

  const onClickWeek = (weekNumber, date, event) => {
    console.log(weekNumber, date);
    console.log(event);
  };

  return (
    <div className="my-calendar--container">
      <h2 className="my-calendar--title">My Calendar</h2>
      <div className="my-calendar--box">
        <Calendar
          value={date}
          onChange={SetDate}
          calendarType="US"
          showWeekNumbers
          onClickWeekNumber={onClickWeek}
          formatDay={(locale, date) => dateFormat(date, "d")}
        />
        <Today date={date} />
      </div>
    </div>
  );
};

export default MyCalendar;
