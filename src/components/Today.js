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
    const weekDocRef = doc(
      db,
      userData.uid,
      `week${getWeekNumber(new Date())}`
    );
    const todayDocRef = doc(db, userData.uid, todayString);
    const fetchData = async (docReference, setTime) => {
      try {
        const docSnap = await getDoc(docReference);
        if (docSnap.exists()) {
          setTime(docSnap.data().workTime);
        }
      } catch (error) {
        console.log("from Today.js");
        console.log(error);
      }
    };
    fetchData(dayDocRef, setWorkTime);
    fetchData(weekDocRef, setWeekWorkTime);

    // listener
    const q = query(todayDocRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (dateString === todayString) fetchData(todayDocRef, setWorkTime);
    });

    return () => {
      setWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, dateString, todayString]);

  console.log(weekWorkTime);
  return (
    <>
      <h4>{dateString} Log!</h4>
      <span>{workTime}</span>
    </>
  );
};

export default Today;
