import emailjs from '@emailjs/browser';
import { BookingData } from '@/types/booking';

// Email.js კონფიგურაცია
const SERVICE_ID = 'YOUR_SERVICE_ID'; // შეცვალეთ თქვენი სერვისის ID-ით
const TEMPLATE_ID_CUSTOMER = 'YOUR_TEMPLATE_ID'; // შეცვალეთ თქვენი ტემპლეიტის ID-ით
const TEMPLATE_ID_ADMIN = 'YOUR_ADMIN_TEMPLATE_ID'; // შეცვალეთ ადმინისტრატორის ტემპლეიტის ID-ით
const PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // შეცვალეთ თქვენი public key-თ

// ინიციალიზაცია Email.js-ის
export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};

/**
 * ფუნქცია აგზავნის დადასტურების იმეილს მომხმარებელთან
 */
export const sendBookingConfirmationEmail = async (bookingData: BookingData): Promise<boolean> => {
  try {
    // თარიღების ფორმატირება
    const checkIn = new Date(bookingData.checkIn).toLocaleDateString('ka-GE');
    const checkOut = new Date(bookingData.checkOut).toLocaleDateString('ka-GE');
    
    // იმეილის ტემპლეიტის პარამეტრები
    const templateParams = {
      to_email: bookingData.email,
      to_name: `${bookingData.firstName} ${bookingData.lastName}`,
      booking_id: bookingData.bookingId,
      check_in: checkIn,
      check_out: checkOut,
      room_name: bookingData.roomName,
      adults: bookingData.adults,
      children: bookingData.children || 0,
      total_price: `${bookingData.totalPrice} ₾`,
      message: bookingData.message || 'არ არის შეტყობინება',
      phone: bookingData.phone
    };

    // იმეილის გაგზავნა
    await emailjs.send(SERVICE_ID, TEMPLATE_ID_CUSTOMER, templateParams);
    console.log('დადასტურების იმეილი გაიგზავნა მომხმარებელთან');
    return true;
  } catch (error) {
    console.error('შეცდომა დადასტურების იმეილის გაგზავნისას', error);
    return false;
  }
};

/**
 * ფუნქცია აგზავნის შეტყობინებას ადმინისტრატორთან ახალი ჯავშნის შესახებ
 */
export const sendAdminNotificationEmail = async (bookingData: BookingData): Promise<boolean> => {
  try {
    // თარიღების ფორმატირება
    const checkIn = new Date(bookingData.checkIn).toLocaleDateString('ka-GE');
    const checkOut = new Date(bookingData.checkOut).toLocaleDateString('ka-GE');
    
    // იმეილის ტემპლეიტის პარამეტრები
    const templateParams = {
      booking_id: bookingData.bookingId,
      guest_name: `${bookingData.firstName} ${bookingData.lastName}`,
      check_in: checkIn,
      check_out: checkOut,
      room_name: bookingData.roomName,
      adults: bookingData.adults,
      children: bookingData.children || 0,
      total_price: `${bookingData.totalPrice} ₾`,
      message: bookingData.message || 'არ არის შეტყობინება',
      phone: bookingData.phone,
      email: bookingData.email
    };

    // იმეილის გაგზავნა
    await emailjs.send(SERVICE_ID, TEMPLATE_ID_ADMIN, templateParams);
    console.log('შეტყობინება გაიგზავნა ადმინისტრატორთან');
    return true;
  } catch (error) {
    console.error('შეცდომა ადმინისტრატორის იმეილის გაგზავნისას', error);
    return false;
  }
};

/**
 * გაგზავნის ორივე იმეილს (მომხმარებელს და ადმინისტრატორს)
 */
export const sendAllBookingEmails = async (bookingData: BookingData): Promise<boolean> => {
  try {
    // ინიციალიზაცია (თუ არ მოხდა ადრე)
    initEmailJS();
    
    // გავგზავნოთ ორივე იმეილი პარალელურად
    const results = await Promise.all([
      sendBookingConfirmationEmail(bookingData),
      sendAdminNotificationEmail(bookingData)
    ]);
    
    // თუ ყველა იმეილი წარმატებით გაიგზავნა
    return results.every(result => result === true);
  } catch (error) {
    console.error('შეცდომა იმეილების გაგზავნისას', error);
    return false;
  }
};