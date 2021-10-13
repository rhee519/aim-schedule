import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";
import getWeekNumber from "./getWeekNumber";
import WorkTimeString from "./WorkTimeString";
import "./Today.scss";

const Today = ({ userData, date }) => {
  const [workTime, setWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  const dateFormat = require("dateformat");
  const dateString = dateFormat(date, "yyyy-mm-dd");
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");
  const weekNum = getWeekNumber(date);

  useEffect(() => {
    // when this component is mounted,
    // fetch data of this date.
    const dayDocRef = doc(db, userData.uid, dateString);
    const weekDocRef = doc(db, userData.uid, `week${weekNum}`);
    let isSubscribed = true;
    const fetchData = async () => {
      try {
        const dayDocSnap = await getDoc(dayDocRef);
        const weekDocSnap = await getDoc(weekDocRef);
        if (dayDocSnap.exists()) {
          if (isSubscribed) setWorkTime(dayDocSnap.data().workTime);
        }
        if (weekDocSnap.exists()) {
          if (isSubscribed) setWeekWorkTime(weekDocSnap.data().weekWorkTime);
        }
      } catch (error) {
        console.log("from Today.js");
        console.log(error);
      }
    };
    fetchData();

    // listener
    // const q = query(dayDocRef);
    const unsubscribe = onSnapshot(query(dayDocRef), (snapshot) => {
      if (dateString === todayString) fetchData();
    });

    return () => {
      isSubscribed = false;
      // setWorkTime(0);
      // setWeekWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, dateString, todayString, date, weekNum]);

  return (
    <div className="today--container">
      <h4 className="today--date-text">{dateString}</h4>
      <span>일일 근로시간: {WorkTimeString(workTime)}</span>
      <span>
        {weekNum}주차 근로 시간: {WorkTimeString(weekWorkTime)}
      </span>
    </div>
  );
};

export default Today;
