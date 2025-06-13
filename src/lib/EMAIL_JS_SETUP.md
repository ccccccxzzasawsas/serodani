# Email.js - დაყენებისა და გამართვის სახელმძღვანელო

## შესავალი

ეს სახელმძღვანელო აღწერს, თუ როგორ გამოვიყენოთ Email.js სერვისი ჯავშნების დადასტურების და შეტყობინებების გასაგზავნად, როგორც მარტივი ალტერნატივა Firebase Functions-ის.

## Email.js-ის უპირატესობები

1. **არ საჭიროებს სერვერის კოდს** - მუშაობს კლიენტის მხარეს
2. **მარტივი** - მარტივი API და დაყენების პროცესი
3. **უფასო გეგმა** - 200 იმეილი თვეში უფასოდ
4. **მზა ტემპლეიტები** - ტემპლეიტების შექმნა დინამიური კონტენტით

## დაყენების ნაბიჯები

### 1. დარეგისტრირდით Email.js-ზე

1. გადადით [Email.js ვებგვერდზე](https://www.emailjs.com/) და შექმენით ანგარიში
2. შედით თქვენს ანგარიშში

### 2. შექმენით სერვისი

1. მენიუში აირჩიეთ "Email Services"
2. დააჭირეთ "Add New Service" ღილაკს
3. აირჩიეთ იმეილის სერვისი (მაგ. Gmail)
4. შეიყვანეთ იმეილი და პაროლი (აპლიკაციის პაროლი Gmail-ის შემთხვევაში)
5. შეინახეთ სერვისის ID (SERVICE_ID)

### 3. შექმენით იმეილის ტემპლეიტები

#### მომხმარებლის დადასტურების ტემპლეიტი:

1. მენიუში აირჩიეთ "Email Templates"
2. დააჭირეთ "Create New Template"
3. მიუთითეთ სათაური და კონტენტი:

```html
<!DOCTYPE html>
<html>
<head>
    <title>ჯავშნის დადასტურება</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4b6043;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .details {
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>ჯავშნის დადასტურება</h2>
        </div>
        
        <p>ძვირფასო {{to_name}},</p>
        
        <p>გილოცავთ! თქვენი ჯავშანი Serodani Cottages-ში წარმატებით დადასტურდა.</p>
        
        <div class="details">
            <h3>ჯავშნის დეტალები:</h3>
            <p><strong>ჯავშნის ID:</strong> {{booking_id}}</p>
            <p><strong>შესვლის თარიღი:</strong> {{check_in}}</p>
            <p><strong>გასვლის თარიღი:</strong> {{check_out}}</p>
            <p><strong>ოთახი:</strong> {{room_name}}</p>
            <p><strong>სტუმრები:</strong> {{adults}} მოზრდილი, {{children}} ბავშვი</p>
            <p><strong>საერთო ფასი:</strong> {{total_price}}</p>
        </div>
        
        <p>თქვენი შეტყობინება: {{message}}</p>
        
        <p>გმადლობთ, რომ აირჩიეთ Serodani Cottages. თუ გაქვთ კითხვები, დაგვიკავშირდით ამ იმეილზე ან დარეკეთ: +995 599 720-720</p>
        
        <div class="footer">
            <p>Serodani Cottages | სიღნაღი, საქართველო | serodani@gmail.com</p>
        </div>
    </div>
</body>
</html>
```

4. მიუთითეთ Subject: "ჯავშნის დადასტურება - Serodani Cottages"
5. შეინახეთ ტემპლეიტის ID (TEMPLATE_ID_CUSTOMER)

#### ადმინისტრატორის შეტყობინების ტემპლეიტი:

1. შექმენით მეორე ტემპლეიტი ადმინისტრატორისთვის:

```html
<!DOCTYPE html>
<html>
<head>
    <title>ახალი ჯავშანი</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4b6043;
            color: white;
            padding: 15px;
            text-align: center;
        }
        .details {
            border: 1px solid #ddd;
            padding: 15px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>ახალი ჯავშანი</h2>
        </div>
        
        <p>მიღებულია ახალი ჯავშანი.</p>
        
        <div class="details">
            <h3>ჯავშნის დეტალები:</h3>
            <p><strong>ჯავშნის ID:</strong> {{booking_id}}</p>
            <p><strong>სტუმარი:</strong> {{guest_name}}</p>
            <p><strong>შესვლის თარიღი:</strong> {{check_in}}</p>
            <p><strong>გასვლის თარიღი:</strong> {{check_out}}</p>
            <p><strong>ოთახი:</strong> {{room_name}}</p>
            <p><strong>სტუმრები:</strong> {{adults}} მოზრდილი, {{children}} ბავშვი</p>
            <p><strong>საერთო ფასი:</strong> {{total_price}}</p>
            <p><strong>ტელეფონი:</strong> {{phone}}</p>
            <p><strong>იმეილი:</strong> {{email}}</p>
            <p><strong>შეტყობინება:</strong> {{message}}</p>
        </div>
    </div>
</body>
</html>
```

2. მიუთითეთ Subject: "ახალი ჯავშანი - Serodani Cottages"
3. შეინახეთ ტემპლეიტის ID (TEMPLATE_ID_ADMIN)

### 4. მიიღეთ Public Key

1. მენიუში აირჩიეთ "Account"
2. გადააკოპირეთ "Public Key" (PUBLIC_KEY)

### 5. გაანახლეთ კოდში კონფიგურაცია

ფაილში `src/lib/email-service.ts`:

```typescript
const SERVICE_ID = 'YOUR_SERVICE_ID'; // შეცვალეთ რეალური service ID-ით
const TEMPLATE_ID_CUSTOMER = 'YOUR_TEMPLATE_ID'; // შეცვალეთ მომხმარებლის ტემპლეიტის ID-ით
const TEMPLATE_ID_ADMIN = 'YOUR_ADMIN_TEMPLATE_ID'; // შეცვალეთ ადმინისტრატორის ტემპლეიტის ID-ით
const PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // შეცვალეთ თქვენი public key-თ
```

### 6. გამოიყენეთ სერვისი

მაგალითი - იმეილების გაგზავნა ჯავშნის დადასტურებისას:

```typescript
import { sendAllBookingEmails } from '@/lib/email-service';

// დაჯავშნის ფუნქციაში
const handleBookingConfirmation = async () => {
  // ... თქვენი ჯავშნის ლოგიკა ...
  
  // ჯავშნის წარმატებით შექმნის შემდეგ
  await sendAllBookingEmails(bookingData);
};
```

## უსაფრთხოება

Email.js იყენებს თქვენს Public Key-ს API წვდომისთვის, რომელიც ასევე შეიძლება იყოს კლიენტის მხარეს კოდში. ეს უსაფრთხოა, რადგან Public Key მხოლოდ თქვენი ანგარიშის იდენტიფიკაციას ახდენს და არ იძლევა წვდომას თქვენს იმეილზე.

## პრობლემების აღმოფხვრა

1. **იმეილები არ იგზავნება?**
   - შეამოწმეთ კონსოლი შეცდომის შეტყობინებებისთვის
   - დარწმუნდით, რომ სწორად მიუთითეთ SERVICE_ID, TEMPLATE_ID და PUBLIC_KEY
   - შეამოწმეთ თქვენი უფასო კვოტა

2. **ტემპლეიტის შეტყობინება არასწორად ჩანს?**
   - შეამოწმეთ ცვლადების სახელები ტემპლეიტში
   - დარწმუნდით, რომ ყველა ველი გადაეცემა templateParams ობიექტში

## დეტალები

Email.js უფასო პაკეტი გთავაზობთ თვეში 200 იმეილს, რაც საკმარისია მცირე პროექტებისთვის. თუ გჭირდებათ მეტი, შეგიძლიათ აირჩიოთ ფასიანი პაკეტი. 