// Customer-initiated handoff only; never sends or confirms an appointment.
export function whatsappBookingUrl(d) {
  const lines = ["Hello TONI&GUY Bengaluru, I would like to arrange an appointment.",
    d.reference ? `Saved request: ${d.reference}` : "Enquiry only — no saved booking reference.",
    d.branch && `Salon: ${d.branch}`, d.service && `Service: ${d.service}`,
    d.price && `Menu price: ${d.price} (taxes as applicable)`,
    d.date && `Preferred date: ${d.date}`, d.time && `Preferred time: ${d.time} IST`,
    d.name && `Name: ${d.name.trim()}`, d.phone && `Callback number: ${d.phone.trim()}`,
    d.note && `Note: ${d.note.trim()}`,
    "Please confirm availability, duration and final price. This is not a confirmed appointment."];
  return "https://wa.me/918123729873?text=" + encodeURIComponent(lines.filter(Boolean).join("\n"));
}
