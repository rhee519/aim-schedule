import { collection, doc, getDoc, getDocs, setDoc } from "@firebase/firestore";
import moment from "moment";
import { isHoliday, workdays } from "./components/CustomRangeCalendar";
import { db } from "./myFirebase";

export const fetchUser = async (uid) => await getDoc(db, `userlist/${uid}`);

export const initialDailyData = (date) => ({
  start: moment(date).startOf("d").hour(9).toDate(),
  started: null,
  finish: moment(date).startOf("d").hour(18).toDate(),
  finished: null,
  log: [],
  type: "work",
});

export const fetchDayData = async (uid, date) => {
  const data = await getDoc(dayDocRef(uid, date));
  return data;
};

export const dayDocRef = (uid, date) => {
  return doc(db, `userlist/${uid}/schedule/${date.format("YYYYMMDD")}`);
};

export const monthCollectionRef = (uid, startDate, endDate) => {
  return collection(
    db,
    `userlist/${uid}/schedule/${endDate.year()}/${startDate.format(
      "YYYYMMDD"
    )}-${endDate.format("YYYYMMDD")}`
  );
};

export const fetchMonthData = async (uid, startDate, endDate) => {
  const data = {};
  const collectionRef = monthCollectionRef(uid, startDate, endDate);
  await getDocs(collectionRef).then(async (querySnap) => {
    querySnap.forEach((doc) => {
      data[doc.id] = doc.data();
    });
    // 정보가 없는 날은 새로 기본값 데이터를 생성하여 DB에 저장한다.
    for (let i = moment(startDate); i.isSameOrBefore(endDate); i.add(1, "d")) {
      if (data[i.format("YYYYMMDD")]) continue;
      const defaultDayInfo = {
        start: moment(i).hour(9).minute(0).second(0).toDate(),
        started: null,
        finish: moment(i).hour(18).minute(0).second(0).toDate(),
        finished: null,
        log: [],
        type: "0",
        holiday: isHoliday(i),
      };
      data[i.format("YYYYMMDD")] = defaultDayInfo;
      const docRef = doc(collectionRef, moment(i).format("YYYYMMDD"));
      await setDoc(docRef, defaultDayInfo);
    }
    data.info = {
      type: "created",
      worktime: workdays(startDate, endDate) * 8 * 60 * 60 * 1000,
      worked: 0,
    };
    await setDoc(doc(collectionRef, "info"), data.info);
  });
  return data;
};
