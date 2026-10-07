# 🌾 Mineral Town Field Journal

A responsive web app for **Harvest Moon: Friends of Mineral Town** and **Story of Seasons: Friends of Mineral Town**. Use it to plan crops, track harvests, check birthdays, look up villagers, and compare seasonal crop profits.

## ✨ Features
- 📅 **Crop calendar:** Choose a season and day, inspect crops planted for a date, add planting notes, delete individual notes, or reset a season.
- 🌱 **Crop almanac:** Browse crop data for Spring, Summer, Fall, and Winter, including harvest time, regrowth time, seed cost, and sell price.
- 💰 **Profitability guide:** Compare crops by projected harvests, revenue, seed costs, total profit, and profit per day based on planting day and plot count.
- 🎂 **Birthday calendar:** Browse villagers' birthdays by season and open detailed birthday and gift-preference information.
- 👥 **Character directory:** Search and filter neighbors, jump by alphabet, and open accessible character detail modals.
- 🎨 **Seasonal UI:** Shared season and calendar-day state across pages, with themed styling for all four seasons.
- 📶 **Installable and offline-ready:** PWA support with automatic updates, standalone installation, and cached app assets.
- 💾 **Persistent notes:** Crop entries are stored locally in IndexedDB, while selected season and calendar day are remembered in browser storage.

> ⚠️ **Note:** The interface is designed mobile-first and also supports larger screens.


## 📦 Installation
```bash
# Clone the repo
git clone https://github.com/redplant0/fotm.git
cd fotm

# Install dependencies
pnpm install
```

## 🛠 Development
```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run lint checks
pnpm lint

# Run the test suite
pnpm test
```

## 🧭 App pages

The app is organized into the following routes:

- `/` — Crop Calendar
- `/birthdays` — Birthday Calendar
- `/crops` — Crop Almanac
- `/profitability` — Crop Profitability
- `/characters` — Character Directory

The test suite includes end-to-end coverage for navigation, shared calendar state, birthdays, crop interactions, character search and modals, and profitability calculations.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a new branch (git checkout -b feature-xyz)
3. Commit your changes (git commit -m "Add feature xyz")
4. Push to your branch (git push origin feature-xyz)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
