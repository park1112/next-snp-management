import { Timestamp } from 'firebase/firestore';
export function toJSDate(
    value: Date | string | number | Timestamp | undefined | null
): Date | null {
    if (!value) return null;
    if ((value as any)?.toDate instanceof Function) {
        return (value as Timestamp).toDate();
    }
    const d = new Date(value as string | number);
    return isNaN(d.valueOf()) ? null : d;
}