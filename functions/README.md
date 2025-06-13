# Serodani Firebase Functions

ეს ფაილი შეიცავს ფუნქციებს Serodani-ს ჯავშნების სისტემისთვის.

## ფუნქციების დაყენება

### SendGrid-ის გამართვა

იმეილების გასაგზავნად, გამოვიყენებთ SendGrid-ს, რადგან ის არის უფასო და მარტივი:

1. გაიარეთ რეგისტრაცია [SendGrid-ზე](https://sendgrid.com/) და შექმენით API კლავიში.

2. შეასრულეთ შემდეგი ბრძანება კონსოლში:

```bash
firebase functions:config:set sendgrid.apikey="YOUR_SENDGRID_API_KEY"
```

### ფუნქციების დაყენება

რომ დააყენოთ ფუნქციები, შეასრულეთ:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### გარემოს ცვლადების დაყენება (დამატებითი მეთოდი)

თუ გინდათ, შეგიძლიათ გამოიყენოთ გარემოს ცვლადები:

```bash
# GCP კონსოლში:
firebase functions:config:set email.from="noreply@serodani.ge" email.replyto="osqelan1@gmail.com" admin.email="osqelan1@gmail.com"
```

## სერვისები

ეს ფუნქციები უზრუნველყოფენ:

1. **sendBookingConfirmation** - აგზავნის დასტურის იმეილს კლიენტთან
2. **sendBookingNotificationToAdmin** - აგზავნის შეტყობინებას ადმინისტრატორთან ახალი ჯავშნის შესახებ

## მარტივი ალტერნატივა

თუ გაგიჭირდათ Firebase Functions-ის გამართვა, შეგიძლიათ გამოიყენოთ საბაზისო იმეილის გაგზავნის სერვისები როგორიცაა:

- Email.js (კლიენტის მხრიდან)
- Resend.com (გამარტივებული API)
- Mailchimp Transactional (ყოფილი Mandrill)

## დებაგირება

პრობლემების შემთხვევაში, გადადით Firebase Console-ზე, აირჩიეთ თქვენი პროექტი, 
სექციაში "Functions" და შეამოწმეთ ლოგები. 