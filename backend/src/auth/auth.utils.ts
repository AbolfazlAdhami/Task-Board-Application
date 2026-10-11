export function durationToSeconds(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);

  if (!match) {
    throw new Error('Invalid JWT duration configuration');
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * secondsPerUnit[unit];
}
