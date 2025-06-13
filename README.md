# Image Analysis

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/leqsos-projects-2c9b784a/v0-image-analysis)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/uTWJsH1a55Q)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/leqsos-projects-2c9b784a/v0-image-analysis](https://vercel.com/leqsos-projects-2c9b784a/v0-image-analysis)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/uTWJsH1a55Q](https://v0.dev/chat/projects/uTWJsH1a55Q)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## ჯავშნის ფუნქციონალი

საიტზე დამატებულია ორ-ეტაპიანი ჯავშნის სისტემა შემდეგი მახასიათებლებით:

1. პირველი ეტაპი - თარიღების არჩევა და ოთახის შემოწმება
   - თარიღების არჩევა
   - საწოლების რაოდენობის არჩევა
   - ალტერნატიული საწოლების შეთავაზება თუ არჩეული საწოლი არ არის ხელმისაწვდომი

2. მეორე ეტაპი - პირადი ინფორმაცია და დადასტურება
   - სახელი და გვარი
   - ელ-ფოსტა და დადასტურების ველი
   - ტელეფონის ნომერი
   - ქვეყანა
   - დამატებითი კომენტარი
   - სრული ფასის ჩვენება

ჯავშნის დადასტურების შემდეგ სისტემა ავტომატურად აგზავნის:
1. დადასტურების მეილს მომხმარებლის ელფოსტაზე
2. შეტყობინებას ადმინისტრატორისთვის

### ელფოსტის კონფიგურაცია

Firebase Functions-ის მეშვეობით ელფოსტის გასაგზავნად:

1. შექმენით `.env` ფაილი `functions` საქაღალდეში `.env.example` ფაილის მიხედვით:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ADMIN_EMAIL=admin@example.com
   ```

2. Google-ის ანგარიშისთვის აპლიკაციის პაროლის შექმნა:
   - გახსენით [Google Account Security](https://myaccount.google.com/security)
   - ჩართეთ 2-ფაქტორიანი ავთენტიფიკაცია
   - შექმენით აპლიკაციის პაროლი "Mail" აპლიკაციისთვის
   - გამოიყენეთ ეს პაროლი `EMAIL_PASSWORD` ველისთვის

3. Firebase-ზე ფუნქციების განთავსებამდე, დააყენეთ გარემოს ცვლადები:
   ```
   firebase functions:config:set email.user="your-email@gmail.com" email.pass="your-app-password" admin.email="admin@example.com"
   ```
