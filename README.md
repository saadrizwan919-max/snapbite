# SnapBite

A calorie, macro and gym tracker for Android, built with Expo and React Native. Log your meals with a photo or by hand, watch your daily calories and macros fill up, plan your weekly workouts, and get reminders at the times you choose.

> **Status:** in development, Play Store release planned.

## Demo


https://github.com/user-attachments/assets/cde616dc-a9ee-4653-a387-949f3ace461d



## Features

- **Daily tracking:** a scrolling date strip, a calorie ring and protein, carbs and fats rings that update as you log
- **Log meals your way:** type a meal in manually, or snap or pick a photo and fill in its calories and macros
- **Meal history:** saved meals with favorites, so you can log your usual meals again in one tap
- **Water and weight:** quick water logging (glass, bottle or custom amount) and a weight log with a scroll ruler, in kg or lb
- **Weekly workout plan:** plan the exercises for each weekday, with sets and reps
- **Reminders:** local notifications for breakfast, lunch, dinner and your workout of the day, with no server needed
- **Streaks:** days in a row with something logged
- **Monetization:** Google AdMob ads (banner, full-screen and native) with a Pro option to remove them
- **Private by design:** everything is saved on the device

## Tech stack

- [Expo](https://expo.dev) SDK 56 and React Native 0.85, with [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind](https://www.nativewind.dev) (Tailwind CSS) for styling
- [Zustand](https://zustand-demo.pmnd.rs) with AsyncStorage for state and persistence
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/) and Reanimated for the sheets
- `react-native-svg` for the progress rings
- `expo-notifications` for scheduled reminders
- `react-native-google-mobile-ads` for AdMob

## Getting started

You need Node.js, Android Studio (with an emulator or a phone with USB debugging) and a JDK.

```bash
# install dependencies
npm install

# build and install the development app (needed once, and again when native packages change)
npx expo prebuild --clean
npx expo run:android

# from then on, start the dev server
npx expo start --dev-client
```

The app uses native modules (ads, notifications, bottom sheets), so it can't run in Expo Go. In development it uses Google's test ad IDs.

## Project structure

```
app/          screens (Expo Router): home, meal detail, saved meals, offers, reminders
components/   reusable UI: sheets, rings, date strip, meal cards, dialogs
lib/          helpers: dates, streaks, ads, notifications, workout data
store/        Zustand stores (meals, water, weight, workout plans, reminders)
```

## Roadmap

- [ ] Real Google Play Billing for Pro
- [ ] Production AdMob ad units
- [ ] Play Store release

## Author

Built by **Muhammad Saad Rizwan**.
