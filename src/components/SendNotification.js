import { collection, addDoc } from "@firebase/firestore";
import { db } from "../myFirebase";

const SendNotification = async ({
  receiverUid,
  type,
  checked,
  createdAt,
  data,
}) => {
  const notificationCollection = collection(
    db,
    `userlist/${receiverUid}/notification`
  );
  await addDoc(notificationCollection, {
    type,
    checked,
    createdAt,
    data,
  })
    // .then((docSnap) => {
    //   console.log(docSnap);
    // })
    .catch((error) => {
      console.log("from SendNotification.js");
      console.log(error);
    });
};

export default SendNotification;
