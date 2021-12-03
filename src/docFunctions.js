import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "@firebase/firestore";
import moment from "moment";
import { db } from "./myFirebase";

// user 기본 정보 불러오기
export const fetchUser = async (uid) => await getDoc(db, `userlist/${uid}`);

// 일간 근로 데이터 생성할 때 기본값
// 날짜값은 Google Firebase에서 제공하는 class Timestamp 타입으로 저장!
// 그래야 생성할 때와 fetch할 때 type 차이에서 오는 오류를 방지할 수 있음!
export const initialDailyData = (date) => ({
  start: Timestamp.fromDate(moment(date).startOf("d").hour(9).toDate()),
  started: null,
  finish: Timestamp.fromDate(moment(date).startOf("d").hour(18).toDate()),
  finished: null,
  log: [],
  type: "work",
});

// user의 월간 근로데이터 collection 레퍼런스
export const monthDocRef = (uid, yearMonth) => {
  const date = moment(yearMonth, "YYYYMM");
  const year = date.format("YYYY");
  const month = date.format("MM");
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

// user의 해당 날짜의 일간 근로데이터 불러오기
export const fetchDayData = async (uid, date) => {
  return await getDoc(dayRef(uid, date));
};

// user의 월간 근로데이터 불러오기
export const fetchMonthData = async (uid, yearMonth) => {
  return await getDocs(monthDocRef(uid, yearMonth));
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
