# Life Dashboard Card

A responsive, dependency-free Home Assistant card for [Life Dashboard](https://github.com/owen282000/life-dashboard-ha).
Fork of [BrainDeLook/health-bridge-dashboard-card](https://github.com/BrainDeLook/health-bridge-dashboard-card), under the original MIT license.

Shows steps, active calories, distance, exercise minutes, sleep, resting heart rate, HRV, oxygen saturation, weight, body fat, lean mass, VO2 max and the last workout. Missing metrics are omitted. Includes English, German and Russian card labels, native theme colors, profile import, entity pickers and responsive charts.

## Installation

Requires Home Assistant 2026.3 or newer, the Life Dashboard integration with at least one sync, and Recorder for charts. This targets the webhook integration, not the separate Postgres/Grafana stack or MQTT discovery.

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
| `user_id` | first device | Device prefix, or config entry ID for a fully renamed device |
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

Automated tests cover rendering, chart interaction, device separation, renamed sensors, external statistics, backfill dates and missing values. A live Home Assistant installation is still needed for end-to-end verification.

## License

[MIT](LICENSE). Original card copyright retained. This independent fork is not affiliated with either upstream project.
