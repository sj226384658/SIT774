# Weather-Based Activity Finder

A small working prototype for the website feature proposed in SIT774.

## Files

- `index.html` — page structure and user input
- `style.css` — interface layout and responsive styling
- `script.js` — interaction, Fetch API, Weather API, filtering and results

## Feature flow

User Input
→ JavaScript
→ Fetch API
→ Open-Meteo Weather API
→ Weather check
→ Activity filtering
→ Personalised recommendations

## API

This prototype uses the Open-Meteo Weather API. It does not require an API key.

## Run

Open the project through a local web server if possible. The weather request uses `fetch()` to call the external API.

## Scope

The prototype intentionally uses a small local activity dataset rather than a separate Places API. This keeps the implementation small and feasible for a student prototype while still demonstrating an external API and personalised results.
