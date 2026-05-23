export const formatDate = (isoString: string): string =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(
    new Date(isoString)
  );

export const formatDateTime = (isoString: string): string =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString));

export const cn = (...classes: (string | undefined | false | null)[]): string =>
  classes.filter(Boolean).join(' ');

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const truncate = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
