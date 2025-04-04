function timeDifference(date, type = "date", end_date = null, detail = false) {
  const now = end_date ? new Date(end_date) : new Date(); // Current date
  const logDate = new Date(date);
  const diffInMs = type == "diff" ? date : Math.abs(now - logDate); // Difference in milliseconds
  let seconds = Math.floor(diffInMs / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  let days = Math.floor(hours / 24);
  let months = Math.floor(days / 30.4375);
  let years = Math.floor(months / 12);
  if (detail) {
    let result = "";
    if (years >= 0) {
      result += years > 0 ? `${years} year${years > 1 ? "s" : ""} ` : "";
      months = days % 365;
    }
    if (days >= 0) {
      result += days > 0 ? `${days} day${days > 1 ? "s" : ""} ` : "";
      hours = hours % 24;
    }
    if (hours >= 0) {
      result += hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""} ` : "";
      minutes = minutes % 60;
    }
    if (minutes >= 0) {
      result +=
        minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""} ` : "";
      seconds = seconds % 60;
    }
    if (seconds >= 0) {
      result += seconds > 0 ? `${seconds} second${seconds > 1 ? "s" : ""}` : "";
    }
    return result.trim();
  } else {
    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    } else if (seconds > 0) {
      return `${seconds} second${seconds > 1 ? "s" : ""}`;
    } else {
      return `0 second`;
    }
  }
}
