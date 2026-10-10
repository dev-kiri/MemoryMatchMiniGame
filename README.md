# Memory Game 🧠

## Description

This is a classic memory game with a 6x4 board and 12 pairs of identical images.  
The cards start face down and are flipped two at a time. If they match, they stay visible; if not, they are flipped back after 1 second.  

It includes 5 difficulty levels, each with a different time limit, and an extreme mode with penalties for mistakes.

---

## Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)  
- Internet connection only if the game uses external resources (online images)

---

## Installation

1. Download the game files.  
2. Save them in a local folder.  
3. Open the `index.html` file in your browser.

---

## How to play

1. Choose the theme, the difficulty level, and whether you want to enable **extreme mode**.  
2. Press the **Start Match** button to begin.  
3. Flip 2 cards per turn.  
4. Matching cards stay visible; those that don't match are flipped back after 1 second.  
5. The goal is to find all the pairs before time runs out.

---

## Controls

- **Start Match button:** Starts the game. Once a match is in progress, it becomes **Restart Match**.  
- **Pause Match / Resume Match button:** Pauses the current match and resumes it later. While paused, the timer stops and the cards cannot be flipped.  
- **Stop Match button:** Stops the current match and returns to the initial view with the preview cards.  
- **Clicking the cards:** Flips them and checks whether they match.  
- **Theme selection:** Changes the look of the cards and the game background.  
- **Extreme mode:** Each mistake subtracts additional time depending on the difficulty.

---

## Pausing, restarting, and stopping a match

Once a match has started, the **Pause Match** and **Stop Match** buttons appear next to the start button.

- **Pause:** Press **Pause Match** to freeze the match. The timer stops, and if two non-matching cards were waiting to be flipped back, that delay is also frozen. Press **Resume Match** to continue exactly where you left off.  
- **Restart:** Press **Restart Match** to start over. A confirmation window will ask you whether you really want to begin a new match, and lets you turn extreme mode on or off before restarting. If you cancel, the current match carries on.  
- **Stop:** Press **Stop Match** to end the current match without finishing it. The board goes back to the preview cards and the options are unlocked again.

While a match is in progress, the theme, difficulty, and extreme mode options are locked. To change them, stop the match first (or choose a new extreme mode setting when restarting).

---

## Additional features

- End-of-game modal with the score and a random fun fact.  
- Visual effects when time is running low.  
- Optional penalty system in extreme mode.  

---

## Contributing

If you want to improve the game, you can:

- Add more themes and images.  
- Add sounds or animations.  
- Improve adaptation to mobile devices.