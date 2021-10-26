import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useState, useEffect, useCallback } from "react";
import moment from "moment";

import { db } from "../myFirebase";
import WorkTimeString from "./WorkTimeString";
import getWeekNumber from "./getWeekNumber";

import "../css/Summary.scss";
import ProgressBar from "./ProgressBar";

const Summary = ({ userData }) => {
  const [todayWorkTime, setTodayWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  const today = moment().format("YYYY-MM-DD");

  const fetchData = useCallback(async () => {
    const dayDocRef = doc(db, `userlist/${userData.uid}/daily`, today);
    const weekDocRef = doc(
      db,
      `userlist/${userData.uid}/weekly`,
      `week${getWeekNumber(new Date())}`
    );
    await getDoc(dayDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setTodayWorkTime(docSnap.data().workTime);
        }
      })
      .catch((error) => {
        console.log("from Summary.js");
        console.log(error);
      });
    await getDoc(weekDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setWeekWorkTime(docSnap.data().workTime);
        }
      })
      .catch((error) => {
        console.log("from Summary.js");
        console.log(error);
      });
  }, [today, userData.uid]);

  useEffect(() => {
    fetchData();

    const q = query(doc(db, userData.uid, today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      fetchData();
    });

    return () => {
      unsubscribe();
    };
  }, [userData.uid, today, fetchData]);

  return (
    <div className="summary--container">
      <h2 className="summary--title">WorkTime Summary</h2>
      <div className="summary--box summary-today">
        <div className="text--container">
          <span className="summary--subtitle">Today</span>
          <span className="summary--text">
            {WorkTimeString(todayWorkTime)}/8시간
          </span>
        </div>
        <ProgressBar workTime={todayWorkTime} targetTime={1000 * 60 * 60 * 8} />
      </div>
      <div className="summary--box summary-week">
        <div className="text--container">
          <span className="summary--subtitle">This Week</span>
          <span className="summary--text">
            {WorkTimeString(weekWorkTime)}/40시간
          </span>
        </div>
        <ProgressBar workTime={weekWorkTime} targetTime={1000 * 60 * 60 * 40} />
      </div>
    </div>
  );
};

export default Summary;
