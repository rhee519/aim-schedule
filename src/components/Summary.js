import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useState, useEffect } from "react";
import dateFormat from "dateformat";

import { db } from "../myFirebase";
import WorkTimeString from "./WorkTimeString";
import getWeekNumber from "./getWeekNumber";

import "./Summary.scss";

const Summary = ({ userData }) => {
  const [todayWorkTime, setTodayWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");

  useEffect(() => {
    let isSubscribed = true;

    const dayDocRef = doc(db, userData.uid, todayString);
    const weekDocRef = doc(
      db,
      userData.uid,
      `week${getWeekNumber(new Date())}`
    );
    const fetchData = async () => {
      try {
        const dayDocSnap = await getDoc(dayDocRef);
        const weekDocSnap = await getDoc(weekDocRef);
        if (dayDocSnap.exists()) {
          if (isSubscribed) setTodayWorkTime(dayDocSnap.data().workTime);
        }
        if (weekDocSnap.exists()) {
          if (isSubscribed) setWeekWorkTime(weekDocSnap.data().weekWorkTime);
        }
      } catch (error) {
        console.log("from Summary.js");
        console.log(error);
      }
    };
    if (isSubscribed) fetchData();

    const q = query(dayDocRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isSubscribed) fetchData();
    });

    return () => {
      isSubscribed = false;
      // setTodayWorkTime(0);
      // setWeekWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, todayString]);

  return (
    <div className="summary--container">
      <div>오늘의 근로 시간: {WorkTimeString(todayWorkTime)}/8시간</div>
      <div>이번 주 근로 시간: {WorkTimeString(weekWorkTime)}/40시간</div>
    </div>
  );
};

export default Summary;
