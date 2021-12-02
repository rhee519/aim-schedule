import { doc, getDoc } from "@firebase/firestore";
import moment from "moment";
import { db } from "./myFirebase";

// user 기본 정보 불러오기
export const fetchUser = async (uid) => await getDoc(db, `userlist/${uid}`);

// 일간 근로 데이터 생성할 때 기본값
export const initialDailyData = (date) => ({
  start: moment(date).startOf("d").hour(9).toDate(),
  started: null,
  finish: moment(date).startOf("d").hour(18).toDate(),
  finished: null,
  log: [],
  type: "work",
});

// user의 일간 근로 데이터 doc 레퍼런스
export const dayDocRef = (uid, date) => {
  return doc(db, `userlist/${uid}/schedule/${moment(date).format("YYYYMMDD")}`);
};

// user의 해당 날짜의 일간 근로데이터 불러오기
export const fetchDayData = async (uid, date) => {
  return await getDoc(dayDocRef(uid, date));
};

// 정산 일정 모두 불러오기
// return: Promise<object>
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

export const dateRangeDocRef = (uid, startDate, finishDate) =>
  doc(
    db,
    `userlist/${uid}/${moment(startDate).format("YYYYMMDD")}-${moment(
      finishDate
    ).format("YYYYMMDD")}`
  );
