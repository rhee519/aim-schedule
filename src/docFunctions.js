import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "@firebase/firestore";
import moment from "moment";
import { holidayType } from "./components/CustomRangeCalendar";
import { db } from "./myFirebase";

export const userDocRef = (uid) => doc(db, `userlist/${uid}`);

// user 기본 정보 불러오기
export const fetchUser = async (uid) => await getDoc(userDocRef(uid));

// 회원가입 승인 후 최초 로그인 시 생성되는 유저의 초기 정보
export const initialUserData = (user) => ({
  uid: user.uid,
  email: user.email,
  userName: user.displayName,
  profileImageURL: user.photoURL,
  position: "직책",
});

// 일간 근로 데이터 생성할 때 기본값
// 날짜값은 Google Firebase에서 제공하는 class Timestamp 타입으로 저장!
// 그래야 생성할 때와 fetch할 때 type 차이에서 오는 오류를 방지할 수 있음!
export const initialDailyData = (date, calendar) => {
  const d = moment(date);
  const key = d.format("YYYYMMDD");
  const htype = holidayType(d, calendar);
  const type =
    htype === "saturday" ||
    htype === "sunday" ||
    (calendar[htype] && calendar[htype][key])
      ? "offday"
      : "work";
  return {
    start: Timestamp.fromDate(moment(d).startOf("d").hour(9).toDate()),
    started: null,
    finish: Timestamp.fromDate(moment(d).startOf("d").hour(18).toDate()),
    finished: null,
    log: [],
    type,
  };
};

// user의 월간 근로데이터 collection 레퍼런스
export const monthDocRef = (uid, date) => {
  const d = moment(date);
  const year = d.format("YYYY");
  const month = d.format("MM");
  return collection(db, `userlist/${uid}/schedule/${year}/${month}`);
};

// user의 일간 근로 데이터 doc 레퍼런스
export const dayRef = (uid, date) => {
  const d = moment(date);
  const year = d.format("YYYY");
  const month = d.format("MM");
  const dateNumber = d.format("DD");
  return doc(db, `userlist/${uid}/schedule/${year}/${month}/${dateNumber}`);
};

// waiting list doc 레퍼런스
export const waitingRef = collection(db, "waitinglist");
export const waitingUserRef = (uid) => doc(waitingRef, uid);

// waiting list 불러오기
export const fetchWaitingList = async () => {
  return await getDocs(waitingRef);
};

// user의 해당 날짜의 일간 근로데이터 불러오기
export const fetchDayData = async (uid, date) => {
  return await getDoc(dayRef(uid, date));
};

// user의 월간 근로데이터 불러오기
export const fetchMonthData = async (uid, date) => {
  return await getDocs(monthDocRef(uid, date));
};

// 사내 휴무, 행사, 정산 일정 모두 불러오기
// return: Promise<Array<doc>>
// fulfilled 이후 data: event(doc), holiday(doc), vacation(doc), payday(doc)
export const fetchCalendarEvents = async () => {
  return await getDocs(collection(db, "calendar"));
};

// 정산 일정 모두 불러오기
// return: Promise<Array<doc>>
// 실제 return data : {history: Array<Date>, next: Date}
export const fetchPayday = async () => {
  return await getDoc(doc(db, "calendar/payday"));
};

// 해당 날짜 기준 마지막 정산일, 다음 정산일을 object로 return
export const getPaydayPeriod = (payday, date) => {
  const period = { lastPayday: undefined, nextPayday: undefined };
  // 인자가 falsy한 경우 종료
  if (!payday || !date) return period;
  const { history, next } = payday;
  // history가 배열이 아니거나 빈 배열인 경우 종료 (비어있으면 안 됨!)
  if (!Array.isArray(history) || history.length === 0) return period;
  // date가 history[0]보다 이전이거나 next보다 이후인 경우 종료
  const dateClone = moment(date);

  // history, next의 모든 Date들은 오전 12시 0분 0초로 설정되어있음!

  // 입력된 날짜가 history[0]보다 이전이거나 next보다 이후인 경우 종료
  if (
    dateClone.isBefore(history[0].toDate()) ||
    dateClone.isSameOrAfter(next.toDate())
  )
    return period;

  // date 기준 마지막 정산일, 다음 정산일을 탐색
  if (
    moment(history[history.length - 1].toDate()).isSameOrBefore(dateClone) &&
    dateClone.isBefore(moment(next.toDate()))
  ) {
    // date가 최근 정산일 이후이고 다음 정산일 이전인 경우
    period.lastPayday = moment(history[history.length - 1].toDate());
    period.nextPayday = moment(next.toDate());
  } else {
    // date가 최근 정산일 이전인 경우
    history.forEach((day, index) => {
      if (index === history.length - 1) return;
      const prev = moment(day.toDate()),
        next = moment(history[index + 1].toDate());
      if (prev.isSameOrBefore(dateClone) && dateClone.isBefore(next)) {
        period.lastPayday = moment(prev);
        period.nextPayday = moment(next);
      }
    });
  }
  return period;
};

export const eventDocRef = doc(db, "calendar/event");
export const holidayDocRef = doc(db, "calendar/holiday");
export const vacationDocRef = doc(db, "calendar/vacation");

export const appliedSchedule = (dateRange, workOnHoliday) => ({
  from: Timestamp.fromDate(dateRange[0].toDate()),
  to: Timestamp.fromDate(dateRange[1].toDate()),
  workOnHoliday,
  status: "waiting",
  createdAt: Timestamp.now(),
});

export const fetchAnnualDataResponses = async (uid, date) => {
  const responses = [];
  for (
    let d = moment(date).startOf("year");
    d.isSameOrBefore(moment(date).endOf("year"));
    d.add(1, "month")
  ) {
    responses.push(fetchMonthData(uid, d));
  }
  return Promise.all(responses);
};

export const fetchAnnualData = async (uid, date) => {
  return fetchAnnualDataResponses(uid, date).then((responses) => {
    const data = {};
    responses.forEach((snapshot) => {
      snapshot.forEach((doc) => {
        const docData = doc.data();
        const key = moment(docData.start.toDate()).format("YYYYMMDD");
        data[key] = docData;
      });
    });
    return data;
  });
};

export const fetchRangeDataResponses = async (uid, startDate, endDate) => {
  if (!(uid && startDate && endDate)) return undefined;
  const responses = [];
  for (let d = moment(startDate); d.isSameOrBefore(endDate); d.add(1, "d")) {
    responses.push(fetchDayData(uid, d));
  }
  return Promise.all(responses);
};

export const fetchRangeData = async (uid, startDate, endDate) => {
  return fetchRangeDataResponses(uid, startDate, endDate).then((responses) => {
    const data = {};
    responses.forEach((doc) => {
      const docData = doc.data();
      const key = moment(docData.start.toDate()).format("YYYYMMDD");
      data[key] = docData;
    });
    return data;
  });
};

export const getWorkTime = (calendar, data, startDate, endDate) => {
  if (!(calendar && startDate && endDate)) return undefined;
  let standard = 0,
    scheduled = 0,
    actual = 0;
  for (let d = moment(startDate); d.isSameOrBefore(endDate); d.add(1, "d")) {
    const key = d.format("YYYYMMDD");
    const htype = holidayType(d, calendar);

    // 기준 근로시간 계산
    if (htype === "default") standard += 8;
    if (data[key]) {
      const { type } = data[key];
      if (type === "annual") scheduled += 8;
      else if (type === "half") scheduled += 4;
      else if (type === "work") {
        // 신청한 근로시간 계산
        let workHours =
          (data[key].finish.toDate().getTime() -
            data[key].start.toDate().getTime()) /
          (1000 * 60 * 60);
        if (workHours > 8) workHours -= 1; // 법정 휴게시간: 8시간 당 무급 휴게시간 1시간
        if (workHours > 12) workHours = 12; // 일일 최대 근로시간: 12시간
        scheduled += workHours;

        // 실제로 기록된 근로시간 계산
        let workedHours =
          data[key].started && data[key].finished
            ? (data[key].finished.toDate().getTime() -
                data[key].started.toDate().getTime()) /
              (1000 * 60 * 60)
            : 0;
        if (workedHours > 8) workedHours -= 1; // 법정 휴게시간: 8시간 당 무급 휴게시간 1시간
        if (workedHours > 12) workedHours = 12; // 일일 최대 근로시간: 12시간
        actual += workedHours;
      }
    }
  }

  return { standard, scheduled, actual };
};
