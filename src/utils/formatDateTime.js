export const formatDateTime = (isoString) => {
  // console.log(isoString);
  if (!isoString) return null;

  const utcDate = new Date(isoString);

  if (isNaN(utcDate.getTime())) {
    console.error("Invalid date string:", isoString);
    return null; // Return null explicitly when invalid
  }

  // Get the UTC components of the date
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth(); // No need to add 1 here, we handle that in formatting
  const day = utcDate.getUTCDate();
  const hours = utcDate.getUTCHours();
  const minutes = utcDate.getUTCMinutes();
  const seconds = utcDate.getUTCSeconds();

  // No need to adjust the date, you can directly format the UTC date
  // const formattedDate = [
  //   String(month + 1).padStart(2, "0"), // Ensure 2-digit month
  //   String(day).padStart(2, "0"), // Ensure 2-digit day
  //   year,
  // ].join("-");

  // Format the time in hh:mm:ss format
  // const formattedTime = [
  //   String(hours).padStart(2, "0"), // Ensure 2-digit hours
  //   String(minutes).padStart(2, "0"), // Ensure 2-digit minutes
  //   String(seconds).padStart(2, "0"), // Ensure 2-digit seconds
  // ].join(":");

  const [formattedDate, formattedTime] = isoString?.split(" ");

  return {
    formattedDate,
    formattedTime,
  };
};
