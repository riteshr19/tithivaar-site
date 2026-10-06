Calendar-data updates for the Tithivaar app live here: `pack.json` and `pack.json.sig`,
produced by `android/tools/content_pack.py sign`. The app reads this folder from
https://tithivaar.riteshrana.engineer/content/v1/.
Never hand-edit pack.json: any change breaks its signature and every app ignores it.
