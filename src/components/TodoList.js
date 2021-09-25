import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";
import Todo from "./Todo";

const TodoList = ({ userData }) => {
  const [todo, setTodo] = useState("");
  const [todoList, setTodoList] = useState([]);

  useEffect(() => {
    // component did mount
    const docRef = doc(db, userData.uid, "todo-list");
    const fetchData = async (docReference) => {
      try {
        const docSnap = await getDoc(docReference);
        if (docSnap.exists()) {
          setTodoList(docSnap.data().todoList);
        } else {
          setTodoList([]);
        }
      } catch (error) {
        console.log("from TodoList.js");
        console.log(error);
      }
    };
    fetchData(docRef);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      fetchData(docRef);
    });

    return () => {
      setTodo("");
      setTodoList([]);
      unsubscribe();
    };
  }, [userData.uid]);

  useEffect(() => {
    // component did update
    const docRef = doc(db, userData.uid, "todo-list");
    const updateData = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          updateDoc(docRef, {
            todoList,
          });
        } else {
          setDoc(docRef, {
            todoList,
          });
        }
      } catch (error) {
        console.log("from TodoList.js");
        console.log(error);
      }
    };
    updateData();
  }, [userData.uid, todoList]);

  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setTodo(value);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const timeNow = new Date().getTime();
    setTodoList([
      ...todoList,
      { text: todo, done: false, createdAt: timeNow, modifiedAt: timeNow },
    ]);

    setTodo("");
  };

  const onClick = (event) => {
    const {
      target: { name, id },
    } = event;
    const newList = [...todoList];
    if (name === "done") {
      newList[id].done = !newList[id].done;
    } else if (name === "delete") {
      newList.splice(id, 1);
    }
    setTodoList(newList);
  };

  return (
    <>
      <h3>{userData.displayName}의 To-do List.</h3>
      <form onSubmit={onSubmit}>
        <input type="text" value={todo} onChange={onChange} />
        <input type="submit" value="add" />
      </form>
      <ul>
        {todoList.map((todoEl, index) => (
          <div key={index}>
            <Todo text={todoEl.text} done={todoEl.done} id={index} />
            <input
              type="button"
              name="done"
              id={index}
              onClick={onClick}
              value={todoEl.done ? "undo" : "done"}
            />
            <input
              type="button"
              id={index}
              name="delete"
              value="del"
              onClick={onClick}
            />
          </div>
        ))}
      </ul>
    </>
  );
};

export default TodoList;
