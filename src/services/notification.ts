export async function sendInviteToUser(
  inviteLink: string,
  contact: { email?: string; phone?: string; tg?: string }
): Promise<void> {
  // TODO: Implement real notification sending (email, SMS, Telegram message)
  console.log(`[Notification] Sending invite link to user:`, contact);
  console.log(`[Notification] Link: ${inviteLink}`);
}
