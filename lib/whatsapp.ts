/**
 * WhatsApp deep-link builder (wa.me) — no API dependency. Coaches never need
 * to save scholar numbers; the link is pre-filled with context.
 */

export function waLink(phone: string, message: string): string {
  const normalized = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function sessionContactMessage(input: {
  scholarName: string;
  sessionTitle: string;
  startsAt: Date;
}): string {
  const when = `${input.startsAt.toUTCString()} (UTC)`;
  return `Hi, this is ${input.scholarName} from the ZUVA programme. About our session "${input.sessionTitle}" scheduled for ${when}: `;
}
