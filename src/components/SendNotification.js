import { collection, addDoc } from "@firebase/firestore";
import { db } from "../myFirebase";

const SendNotification = async (senderUid, recieverUid, content, type) => {
  const notificationCollection = collection(
    db,
    `userlist/${recieverUid}/notification`
  );
  await addDoc(notificationCollection, {
    senderUid,
    content,
    type,
    createdAt: new Date().getTime(),
  })
    .then((docSnap) => {
      console.log(docSnap);
    })
    .catch((error) => {
      console.log("from SendNotification.js");
      console.log(error);
    });
};

export default SendNotification;
