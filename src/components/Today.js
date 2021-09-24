import { doc, getDoc, onSnapshot, query } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";

const Today = ({ userData, date }) => {
  const [workTime, setWorkTime] = useState(0);
  const dateFormat = require("dateformat");
  const dateString = dateFormat(date, "yyyy-mm-dd");
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");

  useEffect(() => {
    // when this component is mounted,
    // fetch data of this date.
    const docRef = doc(db, userData.uid, dateString);
    const todayDocRef = doc(db, userData.uid, todayString);
    const fetchData = async (docReference) => {
      try {
        const docSnap = await getDoc(docReference);
        if (docSnap.exists()) {
          setWorkTime(docSnap.data().workTime);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchData(docRef);

    // listener
    const q = query(todayDocRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (dateString === todayString) fetchData(todayDocRef);
    });

    return () => {
      setWorkTime(0);
      unsubscribe();
    };
  }, [userData.uid, dateString, todayString]);

  return (
    <>
      <h4>{dateString} Log!</h4>
      <span>{workTime}</span>
    </>
  );
};

export default Today;
