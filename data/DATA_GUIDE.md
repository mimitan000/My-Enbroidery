
# Data Guide

Each maker file has this schema:

```json
{
  "maker": "DMC",
  "items": [
    { "number": "100", "hex": "#c0392b" },
    { "number": "101", "hex": "#d35400" }
  ]
}
```

- `number`: floss number as shown in charts (string; can include letters like `Ecru` or `151C`).
- `hex`: an approximate display color used for the yarn-ball preview.

## Adding or Replacing Data
1. Open `data/dmc.json`, `data/cosmo.json`, or `data/olympus.json`.
2. Replace the `items` array with your full list.
3. Keep the file valid JSON (use double quotes).

## Jump Index
The app automatically builds the 100s jump (100 / 200 / 300...) based on leading digits
in `number`. Non-numeric prefixes are handled: it reads the **leading digits** only.
