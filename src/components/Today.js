import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { db } from "../myFirebase";
import getWeekNumber from "./getWeekNumber";
import WorkTimeString from "./WorkTimeString";
import "../css/Today.scss";
import { UserContext } from "../contexts/Context";

const Error = (error) => {
  console.log("from Today.js");
  console.log(error);
};

const Today = ({ date }) => {
  const userData = useContext(UserContext);
  const [workTime, setWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  const dateFormat = require("dateformat");
  const dateString = dateFormat(date, "yyyy-mm-dd");
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");
  const weekNum = getWeekNumber(date); // 수정 필요

  const fetchData = useCallback(async () => {
    const dayRef = doc(db, `userlist/${userData.uid}/daily`, dateString);
    const weekRef = doc(
      db,
      `userlist/${userData.uid}/weekly`,
      `week${weekNum}`
    );
    await getDoc(dayRef)
      .then((docSnap) => {
        if (docSnap.exists()) setWorkTime(docSnap.data().workTime);
      })
      .catch(Error);
    await getDoc(weekRef)
      .then((docSnap) => {
        if (docSnap.exists()) setWeekWorkTime(docSnap.data().workTime);
      })
      .catch(Error);
  }, [userData.uid, dateString, weekNum]);

  useEffect(() => {
    // when this component is mounted,
    // fetch data of this date.
    fetchData();

    // listener
    const q = query(doc(db, `userlist/${userData.uid}/daily`, dateString));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (dateString === todayString) fetchData();
    });

    return () => {
      // setWorkTime(0);
      // setWeekWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, dateString, todayString, fetchData]);

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
