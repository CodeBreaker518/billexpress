export function getGreeting(): string {
  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return "Buenos días";
  }
  if (currentHour < 18) {
    return "Buenas tardes";
  }
  return "Buenas noches";
} 