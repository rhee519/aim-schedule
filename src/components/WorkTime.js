import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { db } from "../myFirebase";
import moment from "moment";

const Error = (error) => {
  console.log("from WorkTime.js");
  console.log(error);
};

const WorkTime = () => {};

const finishWork = async ({ uid, lastLoginAt }) => {
  const now = new Date().getTime();
  const userRef = doc(db, "userlist", uid);
  let dailyRef;
  // let startDay = moment(lastLoginAt).format('YYYY-MM-DD');
  let finishDay = moment(now).format("YYYY-MM-DD");

  // while(startDay !== finishDay) {

  // }
  dailyRef = doc(db, `userlist/${uid}/daily`, finishDay);
  await getDoc(dailyRef)
    .then(async (dailySnap) => {
      if (dailySnap.exists()) {
        const { workTime } = dailySnap.data();
        await updateDoc(dailyRef, {
          workTime: workTime + now - lastLoginAt,
        }).catch(Error);
      } else {
        await setDoc(dailyRef, {
          workTime: now - lastLoginAt,
        }).catch(Error);
      }
    })
    .then(async () => {
      await updateDoc(userRef, {
        lastLogoutAt: now,
        isWorking: false,
      }).catch(Error);
    })
    .catch(Error);
};

const startWork = async ({ uid }) => {
  const now = new Date().getTime();
  const userRef = doc(db, "userlist", uid);
  // this reference must exist
  await updateDoc(userRef, {
    lastLoginAt: now,
    isWorking: true,
  })
    .then(() => {})
    .catch(Error);
};

export default WorkTime;
export { finishWork, startWork };
