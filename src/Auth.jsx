export default function Auth(name) {
  // userData = {name, workTime, isWorking}
  if (name === undefined) throw new Error();
  if (!localStorage.getItem(name)) {
    localStorage.setItem(
      name,
      JSON.stringify({
        name,
        workTime: 0,
        isWorking: false,
      })
    );
  }
  const user = JSON.parse(localStorage.getItem(name));
  return user;
}
