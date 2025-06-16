/**
 * Firebase Functions for Serodani Bookings System
 * 
 * These functions handle booking confirmations and notifications
 * for the Serodani hotel booking system.
 */

import {onValueCreated} from "firebase-functions/v2/database";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// მეილის გამგზავნის კონფიგურაცია - გამოვიყენოთ Gmail
const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL || process.env.FUNCTIONS_CONFIG_EMAIL_USER || 'osqelan1@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || process.env.FUNCTIONS_CONFIG_EMAIL_PASS || 'mucu gjqs kawv kdul'
  }
});

// მეილის გაგზავნის ფუნქცია
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const mailOptions = {
    from: `"Serodani Cottages" <noreply@serodani.ge>`,
    to,
    subject,
    html,
    replyTo: "osqelan1@gmail.com"
  };

  try {
    await mailTransport.sendMail(mailOptions);
    logger.info(`Email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
}

// ინტერფეისი ჯავშნის მონაცემებისთვის
interface BookingData {
  roomId: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  beds?: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  country?: string;
  comment?: string;
  extraBedsConfirmed?: boolean;
}

// ფუნქცია, რომელიც გააგზავნის ჯავშნის დადასტურების მეილს მომხმარებელს
export const sendBookingConfirmation = onValueCreated({
  ref: '/bookings/{bookingId}',
  region: 'europe-west1'
}, async (event) => {
  const bookingId = event.params.bookingId;
  const booking = event.data.val() as BookingData;

  if (!booking || !booking.guestEmail) {
    logger.warn('No booking data or email found');
    return null;
  }

  // თუ სტატუსი ცხადად უარყოფილი არ არის, ყოველთვის გავგზავნოთ დადასტურება
  // თუ მომხმარებელმა შეძლო ჯავშნის შექმნა, მაშინ ეს უკვე უნდა იყოს დადასტურებული
  const shouldConfirm = booking.status !== 'failed';

  if (shouldConfirm) {
    // დავფორმატოთ თარიღები
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const beds = booking.beds || booking.numberOfRooms;

    // მეილის შაბლონი
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a6741;">Booking Confirmation</h2>
        <p>Dear ${booking.guestName},</p>
        <p>Thank you for booking with Serodani Cottages. Your reservation has been confirmed.</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #4a6741; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4a6741;">Booking Details</h3>
          <p><strong>Booking ID:</strong> ${bookingId}</p>
          <p><strong>Room:</strong> ${booking.roomName}</p>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Beds:</strong> ${beds}</p>
          <p><strong>Total Price:</strong> ${booking.totalPrice} GEL</p>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
        
        <p><strong>Cancellation Policy:</strong> You can cancel free of charge before 24 hours of your check-in date. If you cancel after this period, you will be charged the first night's stay.</p>
        
        <p>We look forward to welcoming you to Serodani Cottages!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #777;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </div>
    `;

    // გავაგზავნოთ მეილი
    return sendEmail(
      booking.guestEmail,
      `Booking Confirmation - Serodani Cottages #${bookingId}`,
      emailHtml
    );
  } else {
    // თუ სტატუსი უკვე failed-ია, მაშინ გავაგზავნოთ შეტყობინება
    await sendEmail(
      booking.guestEmail,
      `Booking Failed - Serodani Cottages #${bookingId}`,
      `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF0000;">Booking Failed</h2>
          <p>Dear ${booking.guestName},</p>
          <p>We regret to inform you that your booking request could not be processed due to unavailability.</p>
          <p>It appears that the room you requested is no longer available for the selected dates.</p>
          <p>Please try booking again with different dates or contact us directly for assistance.</p>
          <p>We apologize for any inconvenience caused.</p>
        </div>
      `
    );

    return null;
  }
});

// ფუნქცია, რომელიც გააგზავნის შეტყობინებას ადმინისტრატორს ახალი ჯავშნის შესახებ
export const sendBookingNotificationToAdmin = onValueCreated({
  ref: '/bookings/{bookingId}',
  region: 'europe-west1'
}, async (event) => {
  const bookingId = event.params.bookingId;
  const booking = event.data.val() as BookingData;
  const adminEmail = 'osqelan1@gmail.com';

  if (!booking || !adminEmail) {
    logger.warn('No booking data or admin email configured');
    return null;
  }

  // დავფორმატოთ თარიღები
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const bookingDate = new Date(booking.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // მეილის შაბლონი
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a6741;">New Booking Notification</h2>
      <p>A new booking has been made at Serodani Cottages.</p>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #4a6741; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4a6741;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Room:</strong> ${booking.roomName}</p>
        <p><strong>Check-in:</strong> ${checkInDate}</p>
        <p><strong>Check-out:</strong> ${checkOutDate}</p>
        <p><strong>Beds:</strong> ${booking.numberOfRooms}</p>
        <p><strong>Total Price:</strong> ${booking.totalPrice} GEL</p>
        <p><strong>Status:</strong> ${booking.status}</p>
        <p><strong>Booked on:</strong> ${bookingDate}</p>
      </div>
      
      <div style="background-color: #f9f9f9; border-left: 4px solid #4a6741; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4a6741;">Guest Information</h3>
        <p><strong>Name:</strong> ${booking.guestName}</p>
        <p><strong>Email:</strong> ${booking.guestEmail}</p>
        <p><strong>Phone:</strong> ${booking.guestPhone || 'Not provided'}</p>
        ${booking.country ? `<p><strong>Country:</strong> ${booking.country}</p>` : ''}
        ${booking.comment ? `<p><strong>Comment:</strong> ${booking.comment}</p>` : ''}
      </div>
      
      <p>You can view and manage this booking in the admin dashboard.</p>
    </div>
  `;

  // გავაგზავნოთ მეილი
  return sendEmail(
    adminEmail,
    `New Booking Alert - Serodani Cottages #${bookingId}`,
    emailHtml
  );
});
