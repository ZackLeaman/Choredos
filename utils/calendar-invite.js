import ical, { ICalCalendarMethod } from "ical-generator";
import nodemailer from "nodemailer";
const smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.G_U,
    pass: process.env.G_P, // on google account one needs to create an app password https://support.google.com/mail/?p=InvalidSecondFactor
  },
});

export const getIcalObjectInstance = (
  id,
  sequence,
  starttime,
  summary,
  description,
  name,
  email
) => {
  const calendar = ical({
    domain: "choredo.com",
    name: "My test calendar event",
    method: ICalCalendarMethod.REQUEST,
  });
  calendar.createEvent({
    start: starttime, // eg : moment()
    allDay: true,
    summary: summary, // 'Summary of your event'
    description: description, // 'More description'
    stamp: starttime,
    organizer: process.env.G_U,
    id: `${id}@choredo.com`, // make sure this is unique to the event
    attendees: [
      {
        email,
        name,
        status: "NEEDS-ACTION",
        rsvp: true,
        type: "INDIVIDUAL",
      },
    ],
    status: "CONFIRMED",
    transparency: "TRANSPARENT",
    sequence, // increment this on updates
  });
  return calendar;
};

export const sendemail = async (sendto, subject, htmlbody, calendarObj) => {
  const mailOptions = {
    from: process.env.G_U,
    to: sendto,
    subject: subject,
    html: htmlbody,
    attachments: {
      contentType: "text/calendar",
      method: "REQUEST",
      content: calendarObj.toString(),
      contentDisposition: "attachment",
      filename: "chore-invite.ics",
    },
  };
  smtpTransport.sendMail(mailOptions, function (error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: ", response);
    }
  });
};
