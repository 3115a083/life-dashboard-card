# Life Dashboard Card

A responsive, dependency-free Home Assistant card for [Life Dashboard](https://github.com/owen282000/life-dashboard-ha) and [Garmin Connect](https://github.com/cyberjunky/home-assistant-garmin_connect).
Fork of [BrainDeLook/health-bridge-dashboard-card](https://github.com/BrainDeLook/health-bridge-dashboard-card), under the original MIT license.

Shows steps, active calories, distance, exercise minutes, sleep, resting heart rate, HRV, oxygen saturation, weight, body fat, lean mass, VO2 max and the last workout. Missing metrics are omitted. Includes English, German and Russian card labels, native theme colors, profile import, entity pickers and responsive charts.

## Installation

Requires Home Assistant 2026.3 or newer, at least one supported integration with synced sensor data, and Recorder for charts. The Life Dashboard source targets the webhook integration, not the separate Postgres/Grafana stack or MQTT discovery.

1. In HACS, open **Custom repositories**.
2. Add `https://github.com/3115a083/life-dashboard-card`, category **Dashboard**.
3. Install **Life Dashboard Card** and refresh the browser.
4. Add a manual card:

```yaml
type: custom:life-dashboard-card
language: de
```

For manual installation, copy `dist/life-dashboard-card.js` to `/config/www/life-dashboard-card.js` and add `/local/life-dashboard-card.js` as a JavaScript module dashboard resource.

The card has its own custom element and filename and can coexist with the original Health Bridge card.

## Garmin Connect

Version 1.1.0 adds [cyberjunky/home-assistant-garmin_connect](https://github.com/cyberjunky/home-assistant-garmin_connect) as a second data source. Update/redownload this card in HACS and refresh the browser before adding:

```yaml
type: custom:life-dashboard-card
source: garmin_connect
language: de
title: Garmin Connect
```

In the graphical editor, select **Data source → Garmin Connect**, then **Quick profile import** to select your account. The import fills the entity fields, replaces the previous source's mapping, and clears its Life Dashboard statistics settings. Each Garmin config entry is a separate profile. Multiple accounts and renamed/translated entity IDs are resolved using the entity registry. With both integrations installed, `source: auto` continues to prefer Life Dashboard.

For a specific account, `user_id` accepts the Garmin config entry ID (or `garmin_connect:<entry_id>`). The editor supplies this automatically. Default English entity IDs such as `sensor.garmin_connect_total_steps` also work without registry access; use manual entity mappings for other names when registry access is unavailable.

| Card metric | Garmin sensor key | Notes |
|---|---|---|
| `steps` | `totalSteps` | Total steps |
| `active_calories` | `activeKilocalories` | kcal |
| `distance` | `totalDistanceMeters` | Respects the sensor's unit |
| `sleep_duration` | `measurableAsleepDurationMinutes`, then `sleepTimeMinutes` | Time asleep preferred; total sleep window is a fallback |
| `sleep_deep_hours` | `deepSleepMinutes` | Converted to hours |
| `sleep_core_hours` | `lightSleepMinutes` | Converted to hours |
| `sleep_rem_hours` | `remSleepMinutes` | Converted to hours |
| `heart_rate` | `latestHeartRate` | Optional, disabled by default in the integration |
| `resting_heart_rate` | `restingHeartRate` | No substitution for current pulse |
| `heart_rate_variability` | `hrvLastNightAvg` | Last night's average, ms |
| `oxygen_saturation` | `latestSpo2`, then `averageSpo2` | Latest reading preferred; daily average is a fallback |
| `respiratory_rate` | `latestRespirationValue`, then `avgSleepRespirationValue` | Latest reading preferred |
| `body_mass` | `weightKg` | Respects the sensor's unit |
| `body_fat_percentage` | `bodyFat` | Percent |
| `vo2_max` | `vo2Max` | Running VO2 max |
| `last_apple_workout` | `lastActivity` | Last completed activity, with duration when available |
| `last_sync_time` | `lastSyncTimestamp` | Last watch sync |

The keys in the middle column are the integration's stable unique-ID suffixes, not entity IDs to paste into YAML. Older seconds-based sleep sensors are supported through their units. The card does not equate muscle mass with lean mass or intensity minutes with daily exercise time. Unsupported/missing metrics are omitted.

Enable **Latest Heart Rate** on the Garmin integration's device/entity page if you want the pulse chart. This is the newest sample uploaded from the watch, not a live stream. The card uses its `measurement_time` attribute where available.

Garmin charts use Recorder sensor history. Sleep minutes and seconds are converted to hours, including historical samples. Daily step/calorie charts show the highest recorded total for each day, so a reset near midnight does not erase the day's activity. A later downward revision may therefore leave the earlier peak in the chart. Sleep and other samples use their measurement time when supplied, otherwise Home Assistant receipt time. Preserved sleep values without a measurement date cannot reconstruct which night they originally describe. History availability depends on Recorder retention and starts when Home Assistant recorded the sensors; the card does not fetch or backfill Garmin cloud history.

You can also replace individual metrics on a Life Dashboard card with Garmin sensors through **Metric entities**. Registered Garmin metrics use Recorder while the remaining Life Dashboard metrics continue using external statistics. An explicit `statistics` override takes precedence if configured.

## Devices and renamed entities

Canonical sensors such as `sensor.my_phone_steps_today` establish a device profile. Select one in the graphical editor's **Quick profile import**, or set the device prefix:

```yaml
type: custom:life-dashboard-card
user_id: my_phone
language: de
step_goal: 10000
calorie_goal: 600
days: 7
```

The first profile alphabetically is used if no device is selected. Missing sensors never fall back to another phone. The entity registry resolves renamed Life Dashboard sensors and the config entry used by its statistics. If registry access is unavailable, use explicit entity overrides and `statistic_entry_id` for historical statistics.

## Configuration

| Option | Default | Meaning |
|---|---|---|
| `title` | localized | Heading |
| `language` | HA language | `auto`, `en`, `de`, `ru` |
| `source` | `auto` | `auto`, `life_dashboard`, or `garmin_connect`; auto prefers Life Dashboard |
| `user_id` | first matching profile | Life Dashboard device prefix/config entry ID, or Garmin account config entry ID |
| `days` | 7 | Activity and sleep chart period, 2 to 31 days |
| `step_goal` | 10000 | Daily step goal |
| `calorie_goal` | 600 | Active calorie goal, kcal |
| `show_activity` | true | Activity chart |
| `show_sleep` | true | Sleep stages |
| `show_heart_rate` | true | Heart rate chart |
| `show_body` | true | Body metrics |
| `entities` | `{}` | Manual metric-to-sensor mapping |
| `statistic_entry_id` | registry | Phone config entry ID, not device registry ID |
| `statistics` | `{}` | Manual metric-to-statistic ID mapping |

The entity mapping keys preserve the original card's configuration API. Life Dashboard uses these sensors after the device prefix:

| Card metric key | Life Dashboard suffix |
|---|---|
| `steps` | `steps_today` |
| `active_calories` | `active_calories_today` |
| `distance` | `distance_today` |
| `exercise_time` | `exercise_today` |
| `last_apple_workout` | `last_workout` |
| `last_sync_time` | `last_health_sync` |
| `sleep_duration` | `last_sleep_asleep`, then `last_sleep_duration` |
| `sleep_deep_hours` | `last_sleep_deep` |
| `sleep_core_hours` | `last_sleep_light` |
| `sleep_rem_hours` | `last_sleep_rem` |
| `body_mass` | `weight` |
| `body_fat_percentage` | `body_fat` |
| `heart_rate`, `resting_heart_rate`, `heart_rate_variability`, `oxygen_saturation`, `respiratory_rate`, `lean_body_mass`, `vo2_max` | same suffix as metric key |

```yaml
type: custom:life-dashboard-card
entities:
  steps: sensor.renamed_steps
  body_mass: sensor.renamed_weight
statistics:
  steps: life_dashboard:your_config_entry_id_steps
```

## History

Life Dashboard stores backfilled data as external statistics. The card uses `life_dashboard:<entry>_<metric>`, daily `change` for steps and active calories, daily `mean` for sleep stages, and hourly `mean` for heart rate. The heart chart therefore shows hourly averages plus current/live measurements, not every original heartbeat reading.

Sleep stages use `sleep_deep`, `sleep_light` and `sleep_rem`. They work from statistics even when the corresponding stage sensors are disabled. No stage data is invented when a phone has not sent it.

Current daily values use the sensor's `date`, sleep uses `night`, and current heart readings use `measured_at` where available. This keeps delayed syncs on their actual date. Tooltip time refers to the measurement or statistic bucket time, falling back to receipt time for sensors without timestamps.

For manual sensors without a resolvable Life Dashboard statistic, Recorder state history is used as a fallback. That history starts when Home Assistant received the states and cannot reconstruct a phone's earlier backfill. An unavailable statistics API is reported in the card. Current values remain available.

Statistics refresh on Home Assistant state updates, at most once every five minutes. For older history, use **Send history** in the Life Dashboard Companion app. See the integration's [sensor and statistics reference](https://github.com/owen282000/life-dashboard-ha/blob/main/docs/entities.md).

## Development

No dependencies or build step:

```sh
npm run check
npm test
```

Automated tests cover rendering, chart interaction, both data sources, account/device separation, renamed sensors, source switching, unit conversion, Recorder history, external statistics, backfill dates and missing values. A live Home Assistant installation is still needed for end-to-end verification.

## License

[MIT](LICENSE). Original card copyright retained. This independent fork is not affiliated with either upstream project.
