import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";
import getWeekNumber from "./getWeekNumber";

const Today = ({ userData, date }) => {
  const [workTime, setWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  const dateFormat = require("dateformat");
  const dateString = dateFormat(date, "yyyy-mm-dd");
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");

  useEffect(() => {
    // when this component is mounted,
    // fetch data of this date.
    const dayDocRef = doc(db, userData.uid, dateString);
    const weekDocRef = doc(db, userData.uid, `week${getWeekNumber(date)}`);
    const fetchData = async () => {
      try {
        const dayDocSnap = await getDoc(dayDocRef);
        const weekDocSnap = await getDoc(weekDocRef);
        if (dayDocSnap.exists()) {
          setWorkTime(dayDocSnap.data().workTime);
        }
        if (weekDocSnap.exists()) {
          setWeekWorkTime(weekDocSnap.data().weekWorkTime);
        }
      } catch (error) {
        console.log("from Today.js");
        console.log(error);
      }
    };
    fetchData();

    // listener
    const q = query(dayDocRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (dateString === todayString) fetchData();
    });

    return () => {
      setWorkTime(0);
      setWeekWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, dateString, todayString, date]);

  useEffect(() => {
    // clean-up
  }, []);

  console.log(weekWorkTime);
  return (
    <>
      <h4>{dateString} Log!</h4>
      <span>{workTime}</span>
    </>
  );
};

export default Today;
