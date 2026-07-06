export function makeDateObjectToString(date: Date, localString: string) {
    if (Number.isNaN(date.getTime())) {
        return "Invalid Date";
    }
    const weeks = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const pad2 = (value: number) => value.toString().padStart(2, "0");
    const timezoneOffset = -date.getTimezoneOffset();
    const timezoneSign = timezoneOffset >= 0 ? "+" : "-";
    const timezoneAbsOffset = Math.abs(timezoneOffset);
    const timezoneHours = pad2(Math.floor(timezoneAbsOffset / 60));
    const timezoneMinutes = pad2(timezoneAbsOffset % 60);
    return `${weeks[date.getDay()]} ${months[date.getMonth()]} ${pad2(date.getDate())} ${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} GMT${timezoneSign}${timezoneHours}${timezoneMinutes} (${localString})`;
}
