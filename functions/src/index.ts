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

// ფუნქცია, რომელიც ამოწმებს ოთახის ხელმისაწვდომობას
async function checkRoomAvailability(
  roomId: string,
  checkInDate: string, 
  checkOutDate: string,
  requestedBeds: number,
  totalRoomsInCottage?: number,
  extraBedsConfirmed?: boolean
): Promise<{ 
  available: boolean; 
  availableCount: number;
  availableRegularBeds: number;
  availableExtraBeds: number;
  needsExtraBeds: boolean;
}> {
  try {
    // მივიღოთ ოთახის მონაცემები
    const roomSnapshot = await admin.firestore().collection('rooms').doc(roomId).get();
    if (!roomSnapshot.exists) {
      logger.error(`Room ${roomId} not found`);
      return { 
        available: false, 
        availableCount: 0,
        availableRegularBeds: 0,
        availableExtraBeds: 0,
        needsExtraBeds: false
      };
    }

    const roomData = roomSnapshot.data();
    if (!roomData) {
      logger.error(`No data for room ${roomId}`);
      return { 
        available: false, 
        availableCount: 0,
        availableRegularBeds: 0,
        availableExtraBeds: 0,
        needsExtraBeds: false
      };
    }

    const bedsPerRoom = roomData.beds || 2;
    const totalRooms = roomData.totalRooms || 1;
    const regularBeds = bedsPerRoom * totalRooms;
    const extraBeds = roomData.extraBeds || 0;
    const totalBeds = regularBeds + extraBeds;

    // მივიღოთ ყველა აქტიური ჯავშანი ამ ოთახისთვის
    const bookingsSnapshot = await admin.database().ref('bookings').orderByChild('roomId').equalTo(roomId).once('value');
    const bookings: BookingData[] = [];
    
    bookingsSnapshot.forEach((childSnapshot) => {
      const booking = childSnapshot.val() as BookingData;
      if (booking.status !== 'cancelled') {
        bookings.push(booking);
      }
      return false; // ეს არის forEach-ის მოთხოვნა
    });

    // შევამოწმოთ ყოველი დღე მოთხოვნილ პერიოდში
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    let maxBookedBeds = 0;

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      let dailyBookedBeds = 0;
      
      for (const booking of bookings) {
        const bookingCheckIn = new Date(booking.checkInDate);
        const bookingCheckOut = new Date(booking.checkOutDate);
        
        // თუ მიმდინარე დღე არის ჯავშნის პერიოდში
        if (d >= bookingCheckIn && d < bookingCheckOut) {
          dailyBookedBeds += booking.beds || booking.numberOfRooms;
        }
      }
      
      // ვიპოვოთ მაქსიმალური დაკავებული საწოლების რაოდენობა
      maxBookedBeds = Math.max(maxBookedBeds, dailyBookedBeds);
    }
    
    // გამოვთვალოთ ხელმისაწვდომი საწოლების რაოდენობა
    const availableBeds = totalBeds - maxBookedBeds;

    // ვთვლით, რომ ჯერ ჩვეულებრივი საწოლები ივსება, შემდეგ დამატებითი
    const availableRegularBeds = Math.max(0, regularBeds - maxBookedBeds);
    const availableExtraBeds = extraBeds;

    // შევამოწმოთ, საჭიროა თუ არა დამატებითი საწოლების გამოყენება
    const needsExtraBeds = requestedBeds > availableRegularBeds && 
                          availableRegularBeds + availableExtraBeds >= requestedBeds;
    
    logger.info(`Room ${roomId} availability check: 
      totalBeds=${totalBeds}, 
      regularBeds=${regularBeds},
      extraBeds=${extraBeds},
      maxBookedBeds=${maxBookedBeds}, 
      availableBeds=${availableBeds}, 
      availableRegularBeds=${availableRegularBeds},
      availableExtraBeds=${availableExtraBeds},
      needsExtraBeds=${needsExtraBeds},
      requestedBeds=${requestedBeds},
      extraBedsConfirmed=${extraBedsConfirmed}`);
    
    // თუ საჭიროა დამატებითი საწოლები და მომხმარებელმა დაადასტურა მათი გამოყენება,
    // მაშინ ჯავშნა შესაძლებელია, თუ საკმარისი საწოლები არის ხელმისაწვდომი
    let available = false;
    
    // თუ საკმარისი რაოდენობის ჩვეულებრივი საწოლებია
    if (availableRegularBeds >= requestedBeds) {
        available = true;
    } 
    // თუ საჭიროა დამატებითი საწოლები, მაგრამ საკმარისი საწოლები არის ჯამში და მომხმარებელმა დაადასტურა
    else if (needsExtraBeds && extraBedsConfirmed && availableBeds >= requestedBeds) {
        available = true;
    }
    
    return {
      available: available,
      availableCount: availableBeds,
      availableRegularBeds: availableRegularBeds,
      availableExtraBeds: availableExtraBeds,
      needsExtraBeds: needsExtraBeds
    };
  } catch (error) {
    logger.error('Error checking room availability:', error);
    return { 
      available: false, 
      availableCount: 0,
      availableRegularBeds: 0,
      availableExtraBeds: 0,
      needsExtraBeds: false
    };
  }
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

  // შევამოწმოთ ოთახის ხელმისაწვდომობა
  const beds = booking.beds || booking.numberOfRooms;
  const availabilityResult = await checkRoomAvailability(
    booking.roomId,
    booking.checkInDate,
    booking.checkOutDate,
    beds,
    undefined, // totalRoomsInCottage - ეს პარამეტრი მოგვიანებით მოიძიება ფუნქციის შიგნით
    booking.extraBedsConfirmed
  );

  // თუ ოთახი არ არის ხელმისაწვდომი, შევცვალოთ ჯავშნის სტატუსი
  if (!availabilityResult.available) {
    logger.warn(`Booking ${bookingId} failed availability check. Requested: ${beds}, Available: ${availabilityResult.availableCount}`);
    
    // თუ საჭიროა დამატებითი საწოლები და მომხმარებელმა დაადასტურა მათი გამოყენება, ჯავშნა მაინც უნდა შედგეს
    if (availabilityResult.needsExtraBeds && booking.extraBedsConfirmed && availabilityResult.availableCount >= beds) {
      logger.info(`Booking ${bookingId} uses extra beds (confirmed by user). Proceeding with booking.`);
    } else {
      // განვაახლოთ ჯავშნის სტატუსი
      await admin.database().ref(`bookings/${bookingId}`).update({
        status: 'failed',
        statusReason: `Room not available. Only ${availabilityResult.availableCount} beds available.`
      });
      
      // გავაგზავნოთ შეტყობინება ადმინისტრატორს
      await sendEmail(
        'osqelan1@gmail.com',
        `Booking Failed - Availability Check - Serodani Cottages #${bookingId}`,
        `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF0000;">Booking Failed - Availability Check</h2>
            <p>A booking has failed the availability check:</p>
            <ul>
              <li>Booking ID: ${bookingId}</li>
              <li>Room: ${booking.roomName}</li>
              <li>Check-in: ${booking.checkInDate}</li>
              <li>Check-out: ${booking.checkOutDate}</li>
              <li>Requested beds: ${beds}</li>
              <li>Available beds: ${availabilityResult.availableCount}</li>
            </ul>
            <p>Please check the booking system for possible overlapping reservations.</p>
          </div>
        `
      );
      
      // გავაგზავნოთ შეტყობინება მომხმარებელს
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
  }

  // დავფორმატოთ თარიღები
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // შევამოწმოთ იყენებს თუ არა დამატებით საწოლებს
  const usesExtraBeds = availabilityResult.needsExtraBeds;
  const regularBedsCount = Math.min(beds, availabilityResult.availableRegularBeds);
  const extraBedsCount = beds - regularBedsCount;
  
  // დამატებითი ინფორმაცია საწოლების შესახებ
  let bedsInfo = `<p><strong>Beds:</strong> ${beds}</p>`;
  
  // თუ იყენებს დამატებით საწოლებს, დავამატოთ შესაბამისი შეტყობინება
  if (usesExtraBeds && extraBedsCount > 0) {
    bedsInfo = `
      <p><strong>Beds:</strong> ${beds} (${regularBedsCount} regular, ${extraBedsCount} extra)</p>
      <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0;">
        <p style="margin: 0;">Note: Your booking includes ${extraBedsCount} extra ${extraBedsCount === 1 ? 'bed' : 'beds'} 
        (sofa beds or other extra beds).</p>
      </div>
    `;
  }

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
        ${bedsInfo}
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
