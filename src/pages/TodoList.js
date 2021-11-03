import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { db } from "../myFirebase";
import Todo from "../components/Todo";
import "../css/TodoList.scss";
import { UserContext } from "../contexts/Context";
import Loading from "../components/Loading";

const TodoList = () => {
  const userData = useContext(UserContext);
  const [todo, setTodo] = useState("");
  const [todoList, setTodoList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const todoCollection = collection(db, `userlist/${userData.uid}/todo-list`);
    await getDocs(query(todoCollection, orderBy("createdAt", "desc")))
      .then((querySnap) => {
        const todoFetched = [];
        querySnap.forEach((doc) => {
          todoFetched.push({ ...doc.data(), id: doc.id });
        });
        setTodoList(todoFetched);
      })
      .then(() => setLoading(false))
      .catch((error) => {
        console.log("from TodoList.js");
        console.log(error);
      });
  }, [userData.uid]);

  const uploadTodo = useCallback(
    async (newTodo) => {
      const todoCollection = collection(
        db,
        `userlist/${userData.uid}/todo-list`
      );
      await addDoc(todoCollection, newTodo)
        .then()
        .catch((error) => {
          console.log(error);
        });
    },
    [userData.uid]
  );

  useEffect(() => {
    // component did mount & update
    fetchData();
    const q = query(collection(db, `userlist/${userData.uid}/todo-list`));
    const unsub = onSnapshot(q, (querySnapshot) => {
      fetchData();
    });
    return () => {
      setTodo("");
      setTodoList([]);
      unsub();
    };
  }, [fetchData, userData.uid]);

  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setTodo(value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (todo === "") return;
    const timeNow = new Date().getTime();
    const newTodo = {
      text: todo,
      done: false,
      createdAt: timeNow,
      modifiedAt: timeNow,
    };
    // update database
    uploadTodo(newTodo);

    // setTodoList([...todoList, newTodo]);
    setTodo("");
  };

  const onTodoCheckClick = (event) => {
    const {
      target: { id },
    } = event;
    const newTodoList = [...todoList];
    const docId = newTodoList[id].id;
    newTodoList[id].done = !newTodoList[id].done;
    // setTodoList(newTodoList);

    // update database
    const docRef = doc(db, `userlist/${userData.uid}/todo-list`, docId);
    updateDoc(docRef, {
      done: newTodoList[id].done,
    });
  };

  const onTodoDeleteClick = (event) => {
    const {
      target: { id },
    } = event;
    const newTodoList = [...todoList];
    const docId = newTodoList[id].id;
    newTodoList.splice(id, 1);
    setTodoList(newTodoList);
    // update database
    const docRef = doc(db, `userlist/${userData.uid}/todo-list`, docId);
    deleteDoc(docRef);
  };

  return (
    <div className="todo-list--container">
      <h3 className="todo-list--title">{userData.userName}의 To-do List.</h3>
      <form className="todo-list--form" onSubmit={onSubmit}>
        <input
          className="todo-list--input"
          type="text"
          value={todo}
          placeholder="Add new task"
          onChange={onChange}
        />
        <button className="todo--btn todo-list--btn-add" type="submit">
          <i className="material-icons">add</i>
        </button>
        {/* <input className="todo-list--btn-add" type="submit" value="add" /> */}
      </form>
      <div className="todo-list--todos">
        {loading ? (
          <Loading />
        ) : (
          todoList.map((todoEl, index) => (
            <div className="todo-list--todo" key={index}>
              <button
                className={
                  "todo--btn todo--btn-check" + (todoEl.done ? " checked" : "")
                }
                onClick={onTodoCheckClick}
                id={index}
              >
                <i className="material-icons check" id={index}>
                  {todoEl.done ? "undo" : "done"}
                </i>
              </button>
              <Todo
                className="todo--text"
                text={todoEl.text}
                done={todoEl.done}
                id={index}
              />

              <button
                className="todo--btn todo--btn-delete"
                onClick={onTodoDeleteClick}
                id={index}
              >
                <i className="material-icons delete" id={index}>
                  delete_forever
                </i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TodoList;
