// ========== Worklet utilities ==========
export const calculateMinutesFromAngle = (angle: number): number => {
    'worklet';
    return Math.round(angle / (2 * Math.PI / 288)) * 5;
  };
  
  export const calculateTimeFromAngle = (angle: number): { h: number; m: number } => {
    'worklet';
    const minutes = calculateMinutesFromAngle(angle);
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return { h, m };
  };
  
  export const padMinutes = (min: number): string => {
    'worklet';
    return min < 10 ? `0${min}` : `${min}`;
  };
  
  export const formatTime = (time: { h: number; m: number }): string => {
    'worklet';
    const hours = time.h % 12 || 12;
    const period = time.h < 12 ? 'AM' : 'PM';
    return `${hours}:${padMinutes(time.m)} ${period}`;
  };


  export function roundAngleToFives(angle: number): number {
    const fiveMinuteAngle = 2 * Math.PI / 288;
    return Math.round(angle / fiveMinuteAngle) * fiveMinuteAngle;
  }
  
  export const parseTimeToRadians = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const totalMinutes = (hours % 24) * 60 + minutes;
    const dayFraction = totalMinutes / (24 * 60);
    return dayFraction * 2 * Math.PI;
  };
  
  export const calculateAngleLength = (startTime: string, endTime: string): number => {
    const startRadians = parseTimeToRadians(startTime);
    const endRadians = parseTimeToRadians(endTime);
  
    let angleLength = endRadians - startRadians;
    if (angleLength < 0) {
      angleLength += 2 * Math.PI;
    }
    return angleLength;
  };