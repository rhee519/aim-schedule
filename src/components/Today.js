import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { db } from "../myFirebase";

const Today = ({ userData, date }) => {
  const [memo, setMemo] = useState({
    text: "",
    done: false,
  });
  const [allMemo, setAllMemo] = useState([]);
  const daySelected = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;
  const inputRef = useRef();

  useEffect(() => {
    // when this component is mounted,
    // fetch data of this date.
    const fetchData = async () => {
      const docRef = doc(db, userData.uid, daySelected);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAllMemo(docSnap.data().memo);
        } else {
          setAllMemo([]);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [userData.uid, daySelected]);

  useEffect(() => {
    const update = async () => {
      try {
        const docRef = doc(db, userData.uid, daySelected);
        const docSnap = await getDoc(docRef);
        if (docSnap.data() === undefined) {
          // No data for this date! Create new data.
          await setDoc(docRef, {
            memo: allMemo,
          });
        } else {
          // data already exists.
          // just update memo field.
          await updateDoc(docRef, {
            memo: allMemo,
          });
        }
      } catch (error) {
        console.log(error);
      }
    };
    update();
  }, [allMemo, userData.uid, daySelected]);

  // console.log(allMemo);
  const onChange = () => {
    // console.log(inputRef.current.value);
    setMemo({ ...memo, text: inputRef.current.value });
  };

  const onMemoAddClick = async (event) => {
    event.preventDefault();
    if (memo === "") return;
    const newMemo = [...allMemo, memo];
    setAllMemo(newMemo);
    setMemo({ ...memo, text: "" });
    inputRef.current.value = "";
  };

  const onDoneClick = (event) => {
    event.preventDefault();
    const {
      target: { id },
    } = event;
    const newMemo = [...allMemo];
    newMemo[id].done = !newMemo[id].done;
    setAllMemo(newMemo);
  };

  const onDeleteClick = (event) => {
    event.preventDefault();
    const {
      target: { id },
    } = event;
    const newMemo = [...allMemo];
    newMemo.splice(id, 1);
    setAllMemo(newMemo);
  };

  return (
    <>
      <h4>{daySelected} Today's Log!</h4>
      <ul>
        {allMemo.map((memoEl, index) => {
          return (
            <div key={index}>
              <li>
                {memoEl.text}
                <input
                  type="button"
                  id={index}
                  onClick={onDoneClick}
                  value={memoEl.done ? "undo" : "done"}
                />
                <input
                  type="button"
                  id={index}
                  onClick={onDeleteClick}
                  value="del"
                />
              </li>
            </div>
          );
        })}
      </ul>
      <form onSubmit={onMemoAddClick}>
        <input type="text" onChange={onChange} ref={inputRef} />
        <input type="submit" value="add" />
      </form>
    </>
  );
};

export default Today;
