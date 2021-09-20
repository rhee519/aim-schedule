export default function LogMessage({ type = "LOG", message = "" }) {
  const dateFormat = require("dateformat");
  const now = new Date();
  return `${dateFormat(now, "[yyyy-mm-dd ddd HH:MM:ss]")} [${type}] ${message}`;
}
