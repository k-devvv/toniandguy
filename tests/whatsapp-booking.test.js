import test from 'node:test';
import assert from 'node:assert/strict';
import { whatsappBookingUrl } from '../public/whatsapp-booking.js';
test('WhatsApp handoff preserves reference, branch, selected service and IST time without sending', () => {
  const u = new URL(whatsappBookingUrl({reference:'TG-123',branch:'Prestige Tech Forest',service:'Wash & Style / Women',price:'₹990',date:'2026-11-01',time:'18:30',name:'A & B',phone:'+919000000000',note:'Please call first?'}));
  assert.equal(u.origin,'https://wa.me');
  assert.equal(u.pathname,'/918123729873');
  const message=u.searchParams.get('text');
  for (const v of ['TG-123','Prestige Tech Forest','Wash & Style / Women','₹990','2026-11-01','18:30 IST','A & B','+919000000000','Please call first?','not a confirmed appointment']) assert.ok(message.includes(v),v);
});
test('WhatsApp enquiry never claims an unsaved request has a reference', () => {
  const message=new URL(whatsappBookingUrl({branch:'Sobha Arcadia'})).searchParams.get('text');
  assert.ok(message.includes('Enquiry only'));
  assert.ok(!message.includes('Saved request:'));
  assert.ok(!message.includes('undefined'));
});
