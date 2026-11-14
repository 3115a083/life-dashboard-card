/* Life Dashboard Card v1.1.0
 * A dependency-free Lovelace card for owen282000/life-dashboard-ha.
 * MIT License
 */

const HB_VERSION = "1.1.0";
const HB_METRICS = [
  "last_sync_time", "last_apple_workout", "steps", "active_calories",
  "exercise_time", "distance", "sleep_duration", "sleep_deep_hours",
  "sleep_core_hours", "sleep_rem_hours", "resting_heart_rate", "heart_rate",
  "heart_rate_variability", "oxygen_saturation", "respiratory_rate",
  "body_mass", "body_fat_percentage", "lean_body_mass", "vo2_max",
  "cardio_recovery", "mindful_minutes", "time_in_daylight",
];

// Public metric keys stay compatible with the original card's entity overrides.
const LD_SENSORS = {
  last_sync_time: ["last_health_sync"], last_apple_workout: ["last_workout"],
  steps: ["steps_today"], active_calories: ["active_calories_today"],
  exercise_time: ["exercise_today"], distance: ["distance_today"],
  sleep_duration: ["last_sleep_asleep", "last_sleep_duration"],
  sleep_deep_hours: ["last_sleep_deep"], sleep_core_hours: ["last_sleep_light"],
  sleep_rem_hours: ["last_sleep_rem"], body_mass: ["weight"],
  body_fat_percentage: ["body_fat"],
  ...Object.fromEntries(["resting_heart_rate", "heart_rate", "heart_rate_variability",
    "oxygen_saturation", "respiratory_rate", "lean_body_mass", "vo2_max"].map(key => [key, [key]])),
};
const LD_STATISTICS = {
  steps: "steps", active_calories: "active_calories", heart_rate: "heart_rate",
  sleep_deep_hours: "sleep_deep", sleep_core_hours: "sleep_light", sleep_rem_hours: "sleep_rem",
};
const LD_SUMS = new Set(["steps", "active_calories"]);

// Garmin API keys are stable even when Home Assistant entity IDs are renamed
// or translated. Ordered candidates prefer the actual/latest measurement.
const GC_SENSORS = {
  last_sync_time: [["lastSyncTimestamp", "last_synced"]],
  last_apple_workout: [["lastActivity", "last_activity"]],
  steps: [["totalSteps", "total_steps"]],
  active_calories: [["activeKilocalories", "active_calories"]],
  distance: [["totalDistanceMeters", "total_distance"]],
  sleep_duration: [["measurableAsleepDurationMinutes", "sleep_duration"], ["sleepTimeMinutes", "total_sleep_duration"], ["sleepTimeSeconds", "total_sleep_duration"]],
  sleep_deep_hours: [["deepSleepMinutes", "deep_sleep"], ["deepSleepSeconds", "deep_sleep"]],
  sleep_core_hours: [["lightSleepMinutes", "light_sleep"], ["lightSleepSeconds", "light_sleep"]],
  sleep_rem_hours: [["remSleepMinutes", "rem_sleep"], ["remSleepSeconds", "rem_sleep"]],
  heart_rate: [["latestHeartRate", "latest_heart_rate"]],
  resting_heart_rate: [["restingHeartRate", "resting_heart_rate"]],
  heart_rate_variability: [["hrvLastNightAvg", "hrv_last_night_avg"]],
  oxygen_saturation: [["latestSpo2", "latest_spo2"], ["averageSpo2", "avg_spo2"]],
  respiratory_rate: [["latestRespirationValue", "latest_respiration"], ["avgSleepRespirationValue", "avg_sleep_respiration"]],
  body_mass: [["weightKg", "weight"], ["weight", "weight"]],
  body_fat_percentage: [["bodyFat", "body_fat"]],
  vo2_max: [["vo2Max", "vo2_max"]],
};
const CARD_SOURCES = new Set(["auto", "life_dashboard", "garmin_connect"]);

const HB_TRANSLATIONS = {
  en: {
    title: "Health overview", synced: "Synced", noData: "No Life Dashboard or Garmin Connect sensors found",
    noDataHint: "Sync Life Dashboard or Garmin Connect, then select a source/profile or configure entities.",
    activity: "Activity · 7 days", sleep: "Sleep stages · 7 days", heart: "Heart rate · 24 hours",
    steps: "Steps", calories: "Active calories", exercise: "Exercise", distance: "Distance",
    sleepDuration: "Sleep", deep: "Deep", core: "Light", rem: "REM",
    restingHeartRate: "Resting HR", oxygen: "SpO₂", hrv: "HRV", respiratory: "Respiratory rate",
    weight: "Weight", bodyFat: "Body fat", leanMass: "Lean mass", vo2: "VO₂ max",
    recovery: "Cardio recovery", workout: "Latest workout", today: "Today",
    switchChart: "Switch chart",
    historyUnavailable: "History is unavailable. Current values will keep working.", user: "Profile", received: "Time",
  },
  ru: {
    title: "Здоровье", synced: "Синхронизация", noData: "Сенсоры Life Dashboard не найдены",
    noDataHint: "Выполните первую синхронизацию Life Dashboard Companion или задайте user_id/entities в YAML.",
    activity: "Активность · 7 дней", sleep: "Фазы сна · 7 дней", heart: "Пульс · 24 часа",
    steps: "Шаги", calories: "Активные калории", exercise: "Тренировка", distance: "Дистанция",
    sleepDuration: "Сон", deep: "Глубокий", core: "Основной", rem: "REM",
    restingHeartRate: "Пульс в покое", oxygen: "SpO₂", hrv: "HRV", respiratory: "Частота дыхания",
    weight: "Вес", bodyFat: "Жир", leanMass: "Безжировая масса", vo2: "VO₂ max",
    recovery: "Восстановление", workout: "Последняя тренировка", today: "Сегодня",
    switchChart: "Переключить график",
    historyUnavailable: "История недоступна. Текущие значения продолжат работать.", user: "Профиль", received: "Получено",
  },
};

HB_TRANSLATIONS.de = {
  ...HB_TRANSLATIONS.en, title: "Gesundheit", synced: "Synchronisiert", noData: "Keine Life-Dashboard- oder Garmin-Sensoren gefunden",
  noDataHint: "Life Dashboard oder Garmin Connect synchronisieren, dann Datenquelle und Profil auswählen.",
  activity: "Aktivität", sleep: "Schlafphasen", heart: "Herzfrequenz · 24 Stunden", steps: "Schritte",
  calories: "Aktive Kalorien", exercise: "Training", distance: "Distanz", sleepDuration: "Schlaf",
  deep: "Tief", core: "Leicht", rem: "REM", restingHeartRate: "Ruhepuls", respiratory: "Atemfrequenz",
  weight: "Gewicht", bodyFat: "Körperfett", leanMass: "Magermasse", workout: "Letztes Training",
  today: "Heute", switchChart: "Diagramm wechseln", user: "Gerät", received: "Zeitpunkt",
  historyUnavailable: "Verlauf nicht verfügbar. Aktuelle Werte werden weiterhin angezeigt.",
};

const HB_EDITOR_LABELS = {
  en: {
    title: "Title", language: "Language", user_id: "Device prefix / profile ID", source: "Data source",
    days: "History period", step_goal: "Daily step goal", calorie_goal: "Daily active calorie goal",
    show_activity: "Show activity chart", show_sleep: "Show sleep chart",
    show_heart_rate: "Show heart-rate chart", show_body: "Show body metrics",
    last_sync_time: "Last synchronization", last_apple_workout: "Latest workout",
    steps: "Steps", active_calories: "Active calories", exercise_time: "Exercise time",
    distance: "Distance", sleep_duration: "Sleep duration", sleep_deep_hours: "Deep sleep",
    sleep_core_hours: "Light sleep", sleep_rem_hours: "REM sleep",
    resting_heart_rate: "Resting heart rate", heart_rate: "Heart rate",
    heart_rate_variability: "Heart-rate variability", oxygen_saturation: "Oxygen saturation",
    respiratory_rate: "Respiratory rate", body_mass: "Body mass",
    body_fat_percentage: "Body-fat percentage", lean_body_mass: "Lean body mass",
    vo2_max: "VO₂ max", cardio_recovery: "Cardio recovery",
    mindful_minutes: "Mindful minutes", time_in_daylight: "Time in daylight",
  },
  ru: {
    title: "Заголовок", language: "Язык", user_id: "Суффикс профиля Life Dashboard",
    days: "Период истории", step_goal: "Дневная цель шагов", calorie_goal: "Дневная цель активных калорий",
    show_activity: "Показывать график активности", show_sleep: "Показывать график сна",
    show_heart_rate: "Показывать график пульса", show_body: "Показывать состав тела",
    last_sync_time: "Последняя синхронизация", last_apple_workout: "Последняя тренировка",
    steps: "Шаги", active_calories: "Активные калории", exercise_time: "Время тренировки",
    distance: "Дистанция", sleep_duration: "Продолжительность сна", sleep_deep_hours: "Глубокий сон",
    sleep_core_hours: "Основной сон", sleep_rem_hours: "REM-сон",
    resting_heart_rate: "Пульс в покое", heart_rate: "Пульс",
    heart_rate_variability: "Вариабельность пульса", oxygen_saturation: "Насыщение кислородом",
    respiratory_rate: "Частота дыхания", body_mass: "Масса тела",
    body_fat_percentage: "Процент жира", lean_body_mass: "Безжировая масса",
    vo2_max: "VO₂ max", cardio_recovery: "Кардиовосстановление",
    mindful_minutes: "Осознанные минуты", time_in_daylight: "Время при дневном свете",
  },
};

class LifeDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._history = {};
    this._registry = [];
    this._historyKey = "";
    this._historyAt = 0;
    this._historyError = false;
    this._loadingHistory = false;
    this._renderSignature = "";
    this._historyDataSignature = "";
    this._liveHeartHistory = [];
    this._expandedChart = null;
    this._chartStateKey = "";
  }

  setConfig(config) {
    this.config = {
      title: undefined,
      source: "auto",
      user_id: undefined,
      statistic_entry_id: undefined,
      statistics: {},
      language: undefined,
      days: 7,
      show_activity: true,
      show_sleep: true,
      show_heart_rate: true,
      show_body: true,
      step_goal: 10000,
      calorie_goal: 600,
      entities: {},
      ...config,
    };
    if (!CARD_SOURCES.has(this.config.source)) throw new Error("source must be auto, life_dashboard, or garmin_connect");
    if (!this.config.entities || typeof this.config.entities !== "object" || Array.isArray(this.config.entities)) {
      throw new Error("entities must be a mapping of metric names to entity IDs");
    }
    this._configGeneration = (this._configGeneration || 0) + 1;
    this._history = {};
    this._liveHeartHistory = [];
    this._historyDataSignature = "";
    this._historyKey = "";
    this._renderSignature = this._relevantStateSignature();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._captureHeartRate();
    const signature = this._relevantStateSignature();
    if (signature !== this._renderSignature) {
      this._renderSignature = signature;
      this._render();
    }
    this._scheduleHistory();
  }

  static getStubConfig() {
    return {
      title: "Life Dashboard", language: "auto", days: 7,
      step_goal: 10000, calorie_goal: 600,
      show_activity: true, show_sleep: true, show_heart_rate: true, show_body: true,
      entities: {},
    };
  }

  static getConfigElement() {
    return document.createElement("life-dashboard-card-editor");
  }

  static discoverProfiles(hass, registry = []) {
    const states = hass?.states || {};
    const profiles = new Map();
    // Only distinctive Life Dashboard suffixes establish a device. Generic weight
    // or heart-rate entities alone must never pull in another integration.
    for (const entity of Object.keys(states).sort()) {
      const match = /^sensor\.(.+)_(steps_today|last_health_sync|last_sleep_asleep|last_sleep_duration|exercise_today)$/.exec(entity);
      if (match) profiles.set(match[1], { id: match[1], entities: {} });
    }
    for (const profile of profiles.values()) {
      for (const [metric, suffixes] of Object.entries(LD_SENSORS)) {
        const entity = suffixes.map(suffix => `sensor.${profile.id}_${suffix}`).find(id => states[id]);
        if (entity) profile.entities[metric] = entity;
      }
    }
    const entries = new Map();
    for (const entity of registry) {
      if (entity.platform !== "life_dashboard" || !entity.config_entry_id || !states[entity.entity_id]) continue;
      const entry = entity.config_entry_id;
      if (!entries.has(entry)) entries.set(entry, []);
      entries.get(entry).push(entity);
    }
    for (const [entry, entities] of entries) {
      const existing = [...profiles.values()].find(profile => entities.some(e => Object.values(profile.entities).includes(e.entity_id)));
      const profile = existing || { id: entry, entities: {} };
      profile.entry_id = entry.toLowerCase();
      for (const [metric, suffixes] of Object.entries(LD_SENSORS)) {
        const entity = suffixes.map(suffix => entities.find(e => e.unique_id === `${entry}_${suffix === "last_sleep_duration" ? "sleep_duration" : suffix}`)).find(Boolean);
        if (entity) profile.entities[metric] = entity.entity_id;
      }
      profiles.set(profile.id, profile);
    }
    const garminEntries = new Map();
    for (const entity of registry) {
      if (entity.platform !== "garmin_connect" || !entity.config_entry_id || !states[entity.entity_id]) continue;
      if (!garminEntries.has(entity.config_entry_id)) garminEntries.set(entity.config_entry_id, []);
      garminEntries.get(entity.config_entry_id).push(entity);
    }
    const registeredGarmin = new Set();
    for (const [entry, entities] of garminEntries) {
      const mapped = {};
      for (const [metric, candidates] of Object.entries(GC_SENSORS)) {
        const entity = candidates.map(([key]) => entities.find(e => e.unique_id?.endsWith(`_${key}`))).find(Boolean)
          || candidates.map(([,suffix]) => entities.find(e => e.entity_id.endsWith(`_${suffix}`))).find(Boolean);
        if (entity) { mapped[metric] = entity.entity_id; registeredGarmin.add(entity.entity_id); }
      }
      if (!Object.keys(mapped).length) continue;
      const anchor = mapped.steps || mapped.last_sync_time || Object.values(mapped)[0];
      const label = states[anchor]?.attributes?.friendly_name || "Garmin Connect";
      profiles.set(`garmin_connect:${entry}`, {
        id: `garmin_connect:${entry}`, source: "garmin_connect", label: `Garmin Connect: ${label}`,
        aliases: [...new Set(Object.entries(mapped).flatMap(([metric, id]) => GC_SENSORS[metric]
          .filter(([,suffix]) => id.endsWith(`_${suffix}`)).map(([,suffix]) => id.slice(7, -suffix.length - 1))))],
        entities: mapped,
      });
    }
    for (const entity of Object.keys(states).sort()) {
      const match = /^sensor\.(garmin_connect(?:_[a-z0-9]+)*)_total_steps$/.exec(entity);
      if (!match || registeredGarmin.has(entity)) continue;
      // Once registry data identifies a different integration, never claim it.
      const registered = registry.find(item => item.entity_id === entity);
      if (registered && registered.platform !== "garmin_connect") continue;
      const prefix = match[1], mapped = {};
      for (const [metric, candidates] of Object.entries(GC_SENSORS)) {
        const id = candidates.map(([, suffix]) => `sensor.${prefix}_${suffix}`).find(id => states[id]);
        if (id) mapped[metric] = id;
      }
      profiles.set(`garmin_connect:${prefix}`, {
        id: `garmin_connect:${prefix}`, source: "garmin_connect", label: `Garmin Connect: ${prefix}`, entities: mapped,
      });
    }
    return [...profiles.values()].map(profile => ({ ...profile, count: Object.keys(profile.entities).length }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  static getConfigForm() {
    const lang = (globalThis.navigator?.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
    const labels = HB_EDITOR_LABELS[lang];
    const entityFields = [...new Set([...Object.keys(LD_SENSORS), ...Object.keys(GC_SENSORS)])].map((name) => ({
      name,
      selector: { entity: { filter: { domain: "sensor" } } },
    }));
    return {
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "source", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Automatic (Life Dashboard preferred)" },
          { value: "life_dashboard", label: "Life Dashboard" },
          { value: "garmin_connect", label: "Garmin Connect" },
        ] } } },
        {
          name: "language", default: "auto",
          selector: { select: { mode: "dropdown", options: [
            { value: "auto", label: lang === "ru" ? "Автоматически" : "Automatic" },
            { value: "en", label: "English" },
            { value: "de", label: "Deutsch" },
            { value: "ru", label: "Русский" },
          ] } },
        },
        { name: "user_id", selector: { text: {} } },
        { name: "statistic_entry_id", selector: { text: {} } },
        {
          type: "grid", name: "", flatten: true, column_min_width: "160px",
          schema: [
            { name: "days", default: 7, selector: { number: { min: 2, max: 31, step: 1, mode: "box", unit_of_measurement: lang === "ru" ? "дн." : "days" } } },
            { name: "step_goal", default: 10000, selector: { number: { min: 1, max: 100000, step: 500, mode: "box", unit_of_measurement: lang === "ru" ? "шагов" : "steps" } } },
            { name: "calorie_goal", default: 600, selector: { number: { min: 1, max: 10000, step: 50, mode: "box", unit_of_measurement: "kcal" } } },
          ],
        },
        {
          type: "expandable", name: "", flatten: true, expanded: true,
          title: lang === "ru" ? "Отображаемые разделы" : "Visible sections", icon: "mdi:view-dashboard-outline",
          schema: [
            { name: "show_activity", default: true, selector: { boolean: {} } },
            { name: "show_sleep", default: true, selector: { boolean: {} } },
            { name: "show_heart_rate", default: true, selector: { boolean: {} } },
            { name: "show_body", default: true, selector: { boolean: {} } },
          ],
        },
        {
          type: "expandable", name: "entities", flatten: false,
          title: lang === "ru" ? "Сущности показателей" : "Metric entities", icon: "mdi:database-edit-outline",
          schema: entityFields,
        },
      ],
      computeLabel: (schema) => schema.name === "statistic_entry_id" ? "Life Dashboard config entry ID (optional)" : labels[schema.name] || schema.name,
      computeHelper: (schema) => schema.name === "user_id"
        ? (lang === "ru" ? "Оставьте пустым для автоматического определения" : "Leave empty for automatic discovery")
        : undefined,
      assertConfig: (config) => {
        if (config.entities !== undefined && (!config.entities || typeof config.entities !== "object" || Array.isArray(config.entities))) {
          throw new Error("entities must be a mapping of metric names to entity IDs");
        }
      },
    };
  }

  getCardSize() { return 12; }

  getGridOptions() {
    return { columns: 12, min_columns: 4 };
  }

  _lang() {
    const configured = this.config?.language;
    const value = ((configured && configured !== "auto" ? configured : this._hass?.language) || "en").toLowerCase();
    return value.startsWith("de") ? "de" : value.startsWith("ru") ? "ru" : "en";
  }

  _t(key) { return HB_TRANSLATIONS[this._lang()][key] || HB_TRANSLATIONS.en[key] || key; }

  _profiles() {
    if (this._profileStates !== this._hass?.states || this._profileRegistry !== this._registry) {
      this._profileStates = this._hass?.states; this._profileRegistry = this._registry;
      this._cachedProfiles = LifeDashboardCard.discoverProfiles(this._hass, this._registry);
    }
    return this._cachedProfiles || [];
  }

  _selectedProfile() {
    const source = this.config?.source || "auto";
    const profiles = this._profiles().filter(profile => source === "auto" || (profile.source || "life_dashboard") === source);
    if (this.config?.user_id) {
      const id = String(this.config.user_id);
      return profiles.find(profile => profile.id === id || (profile.source === "garmin_connect" && (profile.id === `garmin_connect:${id}` || profile.aliases?.includes(id.replace(/^garmin_connect:/, "")))));
    }
    return profiles.find(profile => !profile.source) || profiles[0];
  }

  _detectUserId() { return this._selectedProfile()?.id || String(this.config?.user_id || ""); }

  _metricSource(metric) {
    const entity = this._entity(metric);
    const registered = this._registry?.find(item => item.entity_id === entity);
    if (registered) return registered.platform;
    const owner = this._profiles().find(profile => Object.values(profile.entities).includes(entity));
    if (owner) return owner.source || "life_dashboard";
    return this.config?.entities?.[metric] ? "manual" : this._selectedProfile()?.source || "life_dashboard";
  }

  _normalize(metric, value, state) {
    const numeric = Number(value);
    if (metric !== "sleep_duration" && !metric.startsWith("sleep_")) return numeric;
    const unit = state?.attributes?.unit_of_measurement || this._state(metric)?.attributes?.unit_of_measurement;
    if (["min", "minutes"].includes(unit)) return numeric / 60;
    if (["s", "sec", "seconds"].includes(unit)) return numeric / 3600;
    if (unit === "ms") return numeric / 3600000;
    return numeric;
  }

  _entity(metric) {
    const explicit = this.config?.entities?.[metric];
    if (explicit) return explicit;
    return this._selectedProfile()?.entities[metric];
  }

  _statistic(metric) {
    const override = this.config?.statistics?.[metric];
    if (override) return override;
    if (this._metricSource(metric) === "garmin_connect" || this.config?.source === "garmin_connect") return undefined;
    const entity = this._entity(metric);
    const registered = this._registry?.find(item => item.entity_id === entity && item.platform === "life_dashboard");
    const entry = this.config?.statistic_entry_id || registered?.config_entry_id;
    const profileEntry = this._selectedProfile()?.entry_id;
    const selectedEntry = entry || (!this.config?.entities?.[metric] ? profileEntry : undefined);
    return selectedEntry && LD_STATISTICS[metric] ? `life_dashboard:${String(selectedEntry).toLowerCase()}_${LD_STATISTICS[metric]}` : undefined;
  }

  _currentTime(metric, state) {
    const attrs = state?.attributes || {};
    const day = attrs.night || attrs.date;
    if (metric !== "heart_rate" && day) return new Date(`${day}T12:00:00`).getTime();
    const raw = attrs.measured_at || attrs.measurement_time || state?.last_changed || state?.last_updated || state?.lc || state?.lu || Date.now();
    return typeof raw === "number" ? raw * (raw < 1e12 ? 1000 : 1) : new Date(raw).getTime();
  }

  _state(metric) {
    const id = this._entity(metric);
    return id ? this._hass?.states?.[id] : undefined;
  }

  _numeric(metric) {
    const state = this._state(metric);
    if (!state || ["", "unknown", "unavailable", "none"].includes(state.state)) return null;
    const value = Number(state.state);
    return Number.isFinite(value) ? value : null;
  }

  _availableMetrics() {
    return HB_METRICS.filter((metric) => this._state(metric));
  }

  _relevantStateSignature() {
    if (!this.config || !this._hass) return "";
    const values = [this._lang()];
    for (const metric of HB_METRICS) {
      const entityId = this._entity(metric) || "";
      const state = entityId ? this._hass.states[entityId] : undefined;
      values.push(entityId, state?.state ?? "", state?.attributes ?? {}, state?.last_updated ?? "");
    }
    return JSON.stringify(values);
  }

  _historySignature(history) {
    return JSON.stringify(Object.keys(history).sort().map((entityId) => [entityId, history[entityId]]));
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  _format(metric) {
    const state = this._state(metric);
    if (!state || ["unknown", "unavailable", "none", ""].includes(state.state)) return "—";
    let value = this._normalize(metric, state.state, state);
    let unit = state.attributes.unit_of_measurement || "";
    if (metric === "sleep_duration" || metric.startsWith("sleep_")) unit = "h";
    if (!Number.isFinite(value)) return this._escape(state.state);
    if (metric === "distance" && unit === "m" && value >= 1000) {
      value /= 1000; unit = "km";
    }
    const maximumFractionDigits = Math.abs(value) >= 100 ? 0 : Math.abs(value) >= 10 ? 1 : 2;
    const formatted = new Intl.NumberFormat(this._lang(), { maximumFractionDigits }).format(value);
    return `${formatted}${unit ? ` <small>${this._escape(unit)}</small>` : ""}`;
  }

  _relativeDate(raw) {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw || "—";
    const delta = (date.getTime() - Date.now()) / 1000;
    const formatter = new Intl.RelativeTimeFormat(this._lang(), { numeric: "auto" });
    if (Math.abs(delta) < 3600) return formatter.format(Math.round(delta / 60), "minute");
    if (Math.abs(delta) < 86400) return formatter.format(Math.round(delta / 3600), "hour");
    return new Intl.DateTimeFormat(this._lang(), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  }

  _metric(metric, label, icon, tone) {
    const entity = this._entity(metric);
    if (!entity) return "";
    return `<button class="metric ${tone}" data-entity="${this._escape(entity)}" aria-label="${this._escape(label)}">
      <span class="metric-icon"><ha-icon icon="${icon}"></ha-icon></span>
      <span class="metric-copy"><span class="metric-value">${this._format(metric)}</span><span class="metric-label">${this._escape(label)}</span></span>
    </button>`;
  }

  _styles() {
    return `<style>
      :host { display:block; container-type:inline-size; overflow-anchor:none; --hb-blue:#4c8dff; --hb-orange:#ff8a4c; --hb-red:#f05b67; --hb-cyan:#35b9c7; --hb-indigo:#6d66d8; }
      ha-card { overflow:hidden; padding:14px; color:var(--primary-text-color); background:var(--ha-card-background,var(--card-background-color)); }
      * { box-sizing:border-box; }
      .header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
      h1 { margin:0; font-size:20px; line-height:1.2; letter-spacing:-.025em; }
      .eyebrow { display:flex; gap:7px; align-items:center; margin-top:5px; color:var(--secondary-text-color); font-size:12px; }
      .sync-dot { width:7px; height:7px; border-radius:50%; background:#4caf72; box-shadow:0 0 0 4px color-mix(in srgb,#4caf72 16%,transparent); }
      .user-chip { padding:6px 9px; border-radius:999px; background:var(--secondary-background-color); color:var(--secondary-text-color); font-size:11px; white-space:nowrap; }
      .metrics { display:grid; grid-template-columns:repeat(auto-fit,minmax(132px,1fr)); gap:8px; }
      .metric { appearance:none; border:1px solid var(--divider-color); border-radius:13px; min-height:70px; padding:10px; background:color-mix(in srgb,var(--card-background-color) 94%,var(--hb-color)); color:var(--primary-text-color); display:flex; align-items:center; gap:9px; text-align:left; cursor:pointer; font:inherit; transition:transform .15s ease,border-color .15s ease; }
      .metric:hover { transform:translateY(-1px); border-color:color-mix(in srgb,var(--hb-color) 50%,var(--divider-color)); }
      .metric:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
      .metric-icon { width:32px; height:32px; flex:0 0 32px; display:grid; place-items:center; border-radius:10px; color:var(--hb-color); background:color-mix(in srgb,var(--hb-color) 14%,transparent); }
      .metric-copy { min-width:0; display:flex; flex-direction:column; }
      .metric-value { font-size:17px; line-height:1.15; font-weight:700; white-space:nowrap; }
      .metric-value small { font-size:10px; font-weight:600; color:var(--secondary-text-color); }
      .metric-label { margin-top:3px; color:var(--secondary-text-color); font-size:11px; line-height:1.2; overflow-wrap:anywhere; }
      .blue{--hb-color:var(--hb-blue)} .orange{--hb-color:var(--hb-orange)} .red{--hb-color:var(--hb-red)} .cyan{--hb-color:var(--hb-cyan)} .indigo{--hb-color:var(--hb-indigo)} .green{--hb-color:#4caf72}
      .goal { margin:10px 2px 0; }
      .goal-row { display:flex; justify-content:space-between; margin-bottom:5px; color:var(--secondary-text-color); font-size:11px; }
      .goal-track { height:6px; overflow:hidden; border-radius:99px; background:var(--secondary-background-color); }
      .goal-fill { height:100%; border-radius:inherit; background:linear-gradient(90deg,var(--hb-blue),var(--hb-cyan)); transition:width .3s ease; }
      .workout { margin-top:10px; display:flex; align-items:flex-start; gap:9px; border-radius:12px; padding:10px 12px; background:var(--secondary-background-color); }
      .workout ha-icon { color:var(--hb-orange); margin-top:1px; }
      .workout strong { display:block; font-size:12px; margin-bottom:3px; }
      .workout span { color:var(--secondary-text-color); font-size:13px; }
      .charts { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr)); gap:10px; margin-top:12px; }
      .chart { min-width:0; border:1px solid var(--divider-color); border-radius:13px; padding:11px; }
      .chart.wide { grid-column:1/-1; }
      .chart-title { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; font-size:15px; font-weight:700; }
      .chart-toggle { appearance:none; width:100%; margin:0; padding:0; border:0; background:none; color:inherit; font:inherit; text-align:left; cursor:pointer; }
      .chart-toggle:focus-visible { outline:2px solid var(--primary-color); outline-offset:5px; border-radius:5px; }
      .chart-heading { display:flex; align-items:center; gap:7px; min-width:0; }
      .chart-chevron { width:18px; height:18px; flex:0 0 18px; color:var(--secondary-text-color); transition:transform .2s ease; }
      .chart-toggle[aria-expanded="true"] .chart-chevron { transform:rotate(180deg); }
      .chart-body { margin-top:6px; }
      .chart-body[hidden] { display:none; }
      .legend { display:flex; gap:10px; flex-wrap:wrap; color:var(--secondary-text-color); font-size:12px; font-weight:500; }
      .legend i { display:inline-block; width:8px; height:8px; margin-right:4px; border-radius:50%; background:var(--dot); }
      svg { display:block; width:100%; height:auto; overflow:visible; }
      .axis { fill:var(--secondary-text-color); font-size:12px; }
      .chart-sample { outline:none; cursor:help; }
      .chart-sample .chart-hit { fill:transparent; pointer-events:all; }
      .chart-tooltip { opacity:0; pointer-events:none; transition:opacity .12s ease; }
      .chart-sample:hover .chart-tooltip,.chart-sample:focus .chart-tooltip,.chart-sample:focus-visible .chart-tooltip { opacity:1; }
      .chart-tooltip rect { fill:var(--ha-card-background,var(--card-background-color)); stroke:var(--divider-color); stroke-width:1; }
      .chart-tooltip .tooltip-value { fill:var(--primary-text-color); font-size:16px; font-weight:700; }
      .chart-tooltip .tooltip-time { fill:var(--secondary-text-color); font-size:14px; }
      .grid-line { stroke:var(--divider-color); stroke-width:1; }
      .empty { padding:34px 12px; text-align:center; }
      .empty ha-icon { width:46px; height:46px; color:var(--secondary-text-color); }
      .empty h2 { margin:12px 0 7px; font-size:18px; }
      .empty p,.history-error { color:var(--secondary-text-color); font-size:12px; }
      .history-error { margin-top:12px; text-align:center; }
      @container (max-width:600px) { .charts{grid-template-columns:1fr}.chart.wide{grid-column:auto} }
      @container (max-width:430px) { ha-card{padding:12px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.user-chip{display:none}.metric{min-height:66px;padding:9px}.chart{padding:10px} }
      @container (max-width:300px) { .metrics{grid-template-columns:1fr}.header{display:block} }
    </style>`;
  }

  _render() {
    if (!this.config || !this._hass || !this.shadowRoot) return;
    const metrics = this._availableMetrics();
    if (!metrics.length) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="empty"><ha-icon icon="mdi:heart-pulse"></ha-icon><h2>${this._t("noData")}</h2><p>${this._t("noDataHint")}</p></div></ha-card>`;
      return;
    }
    const sync = this._state("last_sync_time")?.state;
    const user = this._detectUserId();
    const stepValue = this._numeric("steps") || 0;
    const goal = Math.max(1, Number(this.config.step_goal) || 10000);
    const goalPercent = Math.min(100, Math.max(0, stepValue / goal * 100));
    const workoutState = this._state("last_apple_workout");
    const workout = workoutState?.state;
    const workoutAttrs = workoutState?.attributes || {};
    const workoutMinutes = workoutAttrs.duration_minutes != null ? Number(workoutAttrs.duration_minutes)
      : workoutAttrs.duration != null ? Number(workoutAttrs.duration) / 60 : NaN;
    const workoutDetail = Number.isFinite(workoutMinutes) ? ` · ${new Intl.NumberFormat(this._lang(), { maximumFractionDigits: 1 }).format(workoutMinutes)} min` : "";
    const cards = [
      this._metric("steps", this._t("steps"), "mdi:walk", "blue"),
      this._metric("active_calories", this._t("calories"), "mdi:fire", "orange"),
      this._metric("exercise_time", this._t("exercise"), "mdi:run-fast", "green"),
      this._metric("distance", this._t("distance"), "mdi:map-marker-distance", "cyan"),
      this._metric("sleep_duration", this._t("sleepDuration"), "mdi:sleep", "indigo"),
      this._metric("resting_heart_rate", this._t("restingHeartRate"), "mdi:heart", "red"),
      this._metric("oxygen_saturation", this._t("oxygen"), "mdi:lungs", "cyan"),
      this._metric("heart_rate_variability", this._t("hrv"), "mdi:waves", "green"),
    ].filter(Boolean).join("");
    const bodyCards = this.config.show_body ? [
      this._metric("body_mass", this._t("weight"), "mdi:weight-kilogram", "blue"),
      this._metric("body_fat_percentage", this._t("bodyFat"), "mdi:human-handsup", "orange"),
      this._metric("lean_body_mass", this._t("leanMass"), "mdi:dumbbell", "green"),
      this._metric("vo2_max", this._t("vo2"), "mdi:lungs", "cyan"),
    ].filter(Boolean).join("") : "";
    const hasActivityChart = this.config.show_activity && (this._entity("steps") || this._entity("active_calories"));
    const hasHeartChart = this.config.show_heart_rate && this._entity("heart_rate");
    this._prepareChartState(user, Boolean(hasActivityChart), Boolean(hasHeartChart));
    const charts = [
      hasActivityChart ? this._activityChart() : "",
      this.config.show_sleep && (this._entity("sleep_deep_hours") || this._entity("sleep_core_hours") || this._entity("sleep_rem_hours") || this._statistic("sleep_deep_hours")) ? this._sleepChart() : "",
      hasHeartChart ? this._heartChart() : "",
    ].filter(Boolean).join("");
    this.shadowRoot.innerHTML = `${this._styles()}<ha-card>
      <div class="header"><div><h1>${this._escape(this.config.title || this._t("title"))}</h1>
        ${sync && !["unknown","unavailable"].includes(sync) ? `<div class="eyebrow"><i class="sync-dot"></i>${this._t("synced")}: ${this._escape(this._relativeDate(sync))}</div>` : ""}
      </div>${user ? `<div class="user-chip">${this._t("user")}: ${this._escape(user)}</div>` : ""}</div>
      <div class="metrics">${cards}${bodyCards}</div>
      ${this._entity("steps") ? `<div class="goal"><div class="goal-row"><span>${this._t("steps")}</span><span>${new Intl.NumberFormat(this._lang()).format(stepValue)} / ${new Intl.NumberFormat(this._lang()).format(goal)}</span></div><div class="goal-track"><div class="goal-fill" style="width:${goalPercent}%"></div></div></div>` : ""}
      ${workout && !["unknown","unavailable","none"].includes(workout) ? `<div class="workout"><ha-icon icon="mdi:run"></ha-icon><div><strong>${this._t("workout")}</strong><span>${this._escape(workout.replaceAll("_", " "))}${this._escape(workoutDetail)}</span></div></div>` : ""}
      ${charts ? `<div class="charts">${charts}</div>` : ""}
      ${this._historyError ? `<div class="history-error">${this._t("historyUnavailable")}</div>` : ""}
    </ha-card>`;
    this.shadowRoot.querySelectorAll("[data-entity]").forEach((element) => {
      element.addEventListener("click", () => this._moreInfo(element.dataset.entity));
    });
    this.shadowRoot.querySelectorAll("[data-chart-toggle]").forEach((element) => {
      element.addEventListener("click", () => this._toggleChart(element.dataset.chartToggle));
    });
  }

  _prepareChartState(user, hasActivity, hasHeart) {
    const key = `life-dashboard-card:expanded:${user || "default"}`;
    if (key !== this._chartStateKey) {
      this._chartStateKey = key;
      let saved = null;
      try { saved = globalThis.localStorage?.getItem(key); } catch (_) { /* Storage can be disabled. */ }
      this._expandedChart = ["activity", "heart"].includes(saved) ? saved : "activity";
    }
    if (this._expandedChart === "activity" && !hasActivity && hasHeart) this._expandedChart = "heart";
    if (this._expandedChart === "heart" && !hasHeart && hasActivity) this._expandedChart = "activity";
  }

  _toggleChart(chart) {
    if (!["activity", "heart"].includes(chart)) return;
    const hasActivity = this.config.show_activity && (this._entity("steps") || this._entity("active_calories"));
    const hasHeart = this.config.show_heart_rate && this._entity("heart_rate");
    if (!hasActivity || !hasHeart) return;
    this._expandedChart = this._expandedChart === "activity" ? "heart" : "activity";
    try { globalThis.localStorage?.setItem(this._chartStateKey, this._expandedChart); } catch (_) { /* Storage can be disabled. */ }
    this.shadowRoot.querySelectorAll("[data-chart-toggle]").forEach((element) => {
      const expanded = element.dataset.chartToggle === this._expandedChart;
      element.setAttribute("aria-expanded", String(expanded));
      const body = element.nextElementSibling;
      if (body?.classList.contains("chart-body")) body.hidden = !expanded;
    });
  }

  _collapsibleChart(kind, title, legend, svg, wide = false) {
    const expanded = this._expandedChart === kind;
    const action = this._t("switchChart");
    return `<section class="chart collapsible${wide ? " wide" : ""}">
      <button type="button" class="chart-title chart-toggle" data-chart-toggle="${kind}" aria-expanded="${expanded}" aria-label="${this._escape(`${action}: ${title}`)}">
        <span class="chart-heading"><span>${title}</span><ha-icon class="chart-chevron" icon="mdi:chevron-down"></ha-icon></span>${legend}
      </button>
      <div class="chart-body"${expanded ? "" : " hidden"}>${svg}</div>
    </section>`;
  }

  _moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
  }

  _historyPoints(metric) {
    const entity = this._entity(metric) || this._statistic(metric);
    const points = entity ? [...(this._history[entity] || [])] : [];
    if (metric === "heart_rate" && entity === this._liveHeartEntity) points.push(...this._liveHeartHistory);
    const state = this._state(metric);
    const currentValue = this._normalize(metric, state?.state, state);
    if (state && !["unknown", "unavailable", "", "none"].includes(state.state) && Number.isFinite(currentValue)) {
      const parsedTime=this._currentTime(metric, state);
      points.push({ t:Number.isFinite(parsedTime)?parsedTime:Date.now(), v:currentValue });
    }
    const unique = new Map();
    points
      .filter((point) => Number.isFinite(point.t) && Number.isFinite(point.v))
      .sort((a, b) => a.t - b.t)
      .forEach((point) => unique.set(`${point.t}:${point.v}`, point));
    return [...unique.values()];
  }

  _captureHeartRate() {
    const state = this._state("heart_rate");
    const value = Number(state?.state);
    if (!state || ["", "unknown", "unavailable", "none"].includes(state.state) || !Number.isFinite(value)) return;
    const entity = this._entity("heart_rate");
    if (entity !== this._liveHeartEntity) { this._liveHeartHistory = []; this._liveHeartEntity = entity; }
    const parsedTime = this._currentTime("heart_rate", state);
    const time = Number.isFinite(parsedTime) ? parsedTime : Date.now();
    const last = this._liveHeartHistory[this._liveHeartHistory.length - 1];
    if (!last || last.v !== value || last.t !== time) this._liveHeartHistory.push({ t: time, v: value });
    const cutoff = Date.now() - 86400000;
    this._liveHeartHistory = this._liveHeartHistory.filter((point) => point.t >= cutoff);
  }

  _daily(metric) {
    const days = Math.max(2, Math.min(31, Number(this.config.days) || 7));
    const result = [];
    const index = new Map();
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = new Date(); date.setHours(0,0,0,0); date.setDate(date.getDate() - offset);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const item = { date, value: 0, has: false, t: null }; index.set(key, item); result.push(item);
    }
    const usePeak = this._metricSource(metric) === "garmin_connect" && LD_SUMS.has(metric);
    for (const point of this._historyPoints(metric)) {
      const date = new Date(point.t);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const item = index.get(key);
      if (item && Number.isFinite(point.v) && (!item.has || (usePeak ? point.v >= item.value : point.t >= item.t))) { item.value=point.v; item.t=point.t; item.has=true; }
    }
    return result;
  }

  _historyTitle(kind) {
    const days=Math.max(2,Math.min(31,Number(this.config.days)||7));
    if(this._lang()==="de") return `${kind==="activity"?"Aktivität":"Schlafphasen"} · ${days} Tage`;
    if(this._lang()!=="ru") return `${kind==="activity"?"Activity":"Sleep stages"} · ${days} ${days===1?"day":"days"}`;
    const category=new Intl.PluralRules("ru").select(days);
    const dayWord=category==="one"?"день":category==="few"?"дня":"дней";
    return `${kind==="activity"?"Активность":"Фазы сна"} · ${days} ${dayWord}`;
  }

  _activityChart() {
    const steps = this._daily("steps"), calories = this._daily("active_calories");
    const width = 560, height = 210, left = 40, right = 42, top = 12, bottom = 32;
    const plotW = width-left-right, plotH = height-top-bottom, slot = plotW/steps.length;
    const stepGoal = Math.max(1, Number(this.config.step_goal) || 10000);
    const calorieGoal = Math.max(1, Number(this.config.calorie_goal) || 600);
    const maxSteps = Math.max(stepGoal, Math.ceil(Math.max(0,...steps.map((x)=>x.value))/1000)*1000);
    const maxCal = Math.max(calorieGoal, Math.ceil(Math.max(0,...calories.map((x)=>x.value))/100)*100);
    const bars = steps.map((item,i)=>{const h=item.has?item.value/maxSteps*plotH:0,x=left+i*slot+slot*.18,y=top+plotH-h,barWidth=slot*.48;const mark=`<rect class="step-bar" x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="var(--hb-blue)" opacity=".85"/>`;return item.has?this._chartSample(item,x+barWidth/2,y,width,`${item.value.toFixed(0)} ${this._t("steps")}`,"activity-step",mark):mark;}).join("");
    const linePoints = calories.map((item,i)=>`${left+i*slot+slot*.5},${top+plotH-(item.has?item.value/maxCal*plotH:0)}`).join(" ");
    const dots = calories.map((item,i)=>{if(!item.has)return "";const x=left+i*slot+slot*.5,y=top+plotH-item.value/maxCal*plotH;const mark=`<circle class="chart-hit" cx="${x}" cy="${y}" r="11"/><circle class="calorie-point" cx="${x}" cy="${y}" r="4" fill="var(--hb-orange)"/>`;return this._chartSample(item,x,y,width,`${item.value.toFixed(0)} kcal`,"activity-calorie",mark);}).join("");
    const legend = `<span class="legend"><span><i style="--dot:var(--hb-blue)"></i>${this._t("steps")}</span><span><i style="--dot:var(--hb-orange)"></i>kcal</span></span>`;
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img">${this._dualGrid(width,height,left,right,top,bottom,maxSteps,maxCal)}${bars}<polyline points="${linePoints}" fill="none" stroke="var(--hb-orange)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}${this._dayLabels(steps,width,height,left,right)}</svg>`;
    return this._collapsibleChart("activity", this._historyTitle("activity"), legend, svg);
  }

  _sleepChart() {
    const deep=this._daily("sleep_deep_hours"), core=this._daily("sleep_core_hours"), rem=this._daily("sleep_rem_hours");
    const width=560,height=210,left=36,right=14,top=12,bottom=32,plotW=width-left-right,plotH=height-top-bottom,slot=plotW/deep.length;
    const totals=deep.map((x,i)=>(x.has?x.value:0)+(core[i].has?core[i].value:0)+(rem[i].has?rem[i].value:0));
    const max=Math.max(10,Math.ceil(Math.max(...totals)));
    const colors=["#3949ab","#7986cb","#26c6da"];
    let bars="";
    deep.forEach((_,i)=>{ let y=top+plotH; [deep[i],core[i],rem[i]].forEach((item,j)=>{ const h=(item.has?item.value:0)/max*plotH; y-=h; bars+=`<rect x="${left+i*slot+slot*.2}" y="${y}" width="${slot*.6}" height="${Math.max(0,h)}" rx="${j===2?3:0}" fill="${colors[j]}"><title>${item.value.toFixed(1)} h</title></rect>`; }); });
    return `<section class="chart" data-chart="sleep"><div class="chart-title"><span>${this._historyTitle("sleep")}</span><span class="legend"><span><i style="--dot:${colors[0]}"></i>${this._t("deep")}</span><span><i style="--dot:${colors[1]}"></i>${this._t("core")}</span><span><i style="--dot:${colors[2]}"></i>${this._t("rem")}</span></span></div><svg viewBox="0 0 ${width} ${height}" role="img">${this._grid(width,height,left,right,top,bottom,max)}${bars}${this._dayLabels(deep,width,height,left,right)}</svg></section>`;
  }

  _heartChart() {
    const points=this._historyPoints("heart_rate").filter((p)=>p.t>=Date.now()-86400000).sort((a,b)=>a.t-b.t);
    if (!points.length) return "";
    // Use the same coordinate system as the activity chart so axes, labels,
    // markers and tooltips have the same visible size in both expanded blocks.
    const width=560,height=210,left=40,right=42,top=12,bottom=32,plotW=width-left-right,plotH=height-top-bottom;
    const values=points.map((p)=>p.v),min=Math.max(30,Math.floor(Math.min(...values)/10)*10-10),max=Math.max(min+20,Math.ceil(Math.max(...values)/10)*10+10);
    const start=Date.now()-86400000,end=Date.now();
    const current=points[points.length-1],currentY=top+plotH-(current.v-min)/(max-min)*plotH;
    const hasHistory=points.length>1;
    const measured=points.map((point)=>({x:Math.max(left,Math.min(left+plotW,left+(point.t-start)/(end-start)*plotW)),y:top+plotH-(point.v-min)/(max-min)*plotH}));
    const tracePoints=hasHistory?measured:[{x:left,y:currentY},{x:left+plotW,y:currentY}];
    const trace=this._heartTracePath(tracePoints);
    const centerY=top+plotH/2;
    const historyMarkers=hasHistory?points.slice(0,-1).map((point,index)=>this._heartMarker(point,measured[index].x,measured[index].y,width)).join(""):"";
    const currentX=hasHistory?measured[measured.length-1].x:left+plotW;
    const currentMarker=`${this._heartMarker(current,currentX,currentY,width)}<text class="axis" x="${currentX-8}" y="${Math.max(top+10,currentY-9)}" text-anchor="end" style="fill:var(--hb-red)">${current.v.toFixed(0)} bpm</text>`;
    const legend = `<span class="legend"><span><i style="--dot:var(--hb-red)"></i>bpm</span></span>`;
    const svg = `<svg viewBox="0 0 ${width} ${height}" role="img" data-current-only="${!hasHistory}" data-interpolation="linear">${this._grid(width,height,left,right,top,bottom,max,min)}<line class="heart-center" x1="${left}" x2="${left+plotW}" y1="${centerY}" y2="${centerY}" stroke="var(--secondary-text-color)" stroke-width="1.5" stroke-dasharray="5 7" opacity=".5"/><path class="heart-trace" d="${trace}" fill="none" stroke="var(--hb-red)" stroke-width="3"${hasHistory?"":` stroke-dasharray="10 7"`} stroke-linejoin="round" stroke-linecap="round"/>${historyMarkers}${currentMarker}<text class="axis" x="${left}" y="${height-6}">24h</text><text class="axis" x="${left+plotW}" y="${height-6}" text-anchor="end">${this._t("today")}</text></svg>`;
    return this._collapsibleChart("heart", this._t("heart"), legend, svg, true);
  }

  _heartTracePath(points) {
    if (!points.length) return "";
    return points.map((point,index)=>`${index?"L":"M"} ${point.x},${point.y}`).join(" ");
  }

  _heartMarker(point,x,y,width) {
    const mark=`<circle class="chart-hit" cx="${x}" cy="${y}" r="12"/>`;
    return this._chartSample(point,x,y,width,`${point.v.toFixed(0)} bpm`,"heart-sample",mark);
  }

  _chartSample(point,x,y,width,valueLabel,className,mark) {
    const time=new Intl.DateTimeFormat(this._lang(),{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(point.t));
    const received=`${this._t("received")}: ${time}`;
    const tooltipWidth=220,tooltipHeight=50;
    const tooltipX=x>width-tooltipWidth-12?x-tooltipWidth-11:x+11,tooltipY=y<68?y+12:y-tooltipHeight-10;
    const valueY=19,timeY=41,textX=12;
    const label=`${valueLabel}, ${received}`;
    return `<g class="chart-sample ${className}" tabindex="0" role="img" aria-label="${this._escape(label)}">${mark}<g class="chart-tooltip" data-tooltip-size="normal" transform="translate(${tooltipX} ${tooltipY})"><rect width="${tooltipWidth}" height="${tooltipHeight}" rx="10"/><text class="tooltip-value" x="${textX}" y="${valueY}">${this._escape(valueLabel)}</text><text class="tooltip-time" x="${textX}" y="${timeY}">${this._escape(received)}</text></g></g>`;
  }

  _grid(width,height,left,right,top,bottom,max,min=0) {
    const plotH=height-top-bottom, parts=[];
    for(let i=0;i<=3;i++){const y=top+plotH*i/3,value=max-(max-min)*i/3;parts.push(`<line class="grid-line" x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text class="axis" x="${left-5}" y="${y+3}" text-anchor="end">${value>=1000?`${(value/1000).toFixed(value>=10000?0:1)}k`:value.toFixed(0)}</text>`);} return parts.join("");
  }

  _dualGrid(width,height,left,right,top,bottom,maxLeft,maxRight) {
    const plotH=height-top-bottom,parts=[];
    for(let i=0;i<=3;i++){
      const y=top+plotH*i/3,leftValue=maxLeft*(1-i/3),rightValue=maxRight*(1-i/3);
      const leftLabel=leftValue>=1000?`${(leftValue/1000).toFixed(leftValue>=10000?0:1)}k`:leftValue.toFixed(0);
      parts.push(`<line class="grid-line" x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text class="axis" data-axis="steps" x="${left-5}" y="${y+3}" text-anchor="end" style="fill:var(--hb-blue)">${leftLabel}</text><text class="axis" data-axis="calories" x="${width-right+5}" y="${y+3}" style="fill:var(--hb-orange)">${rightValue.toFixed(0)}</text>`);
    }
    return parts.join("");
  }

  _dayLabels(days,width,height,left,right) {
    const slot=(width-left-right)/days.length,fmt=new Intl.DateTimeFormat(this._lang(),{weekday:"short"});
    return days.map((item,i)=>`<text class="axis" x="${left+i*slot+slot/2}" y="${height-7}" text-anchor="middle">${this._escape(fmt.format(item.date))}</text>`).join("");
  }

  _scheduleHistory() {
    if (!this._hass || !this.config || this._loadingHistory) return;
    const metrics=["steps","active_calories","sleep_deep_hours","sleep_core_hours","sleep_rem_hours","heart_rate"];
    const entities=[...new Set(metrics.map((m)=>this._entity(m)).filter(Boolean))];
    if (!entities.length && (this._registryLoaded || !this._hass.callWS)) return;
    const key=`${this.config.source}|${this._detectUserId()}|${entities.join(",")}|${this.config.days}|${JSON.stringify(this.config.statistics || {})}|${this.config.statistic_entry_id || ""}`;
    if (key===this._historyKey && Date.now()-this._historyAt<300000) return;
    this._loadHistory(entities,key);
  }

  async _loadHistory(entities, key) {
    const generation = this._configGeneration;
    this._loadingHistory = true;
    let failed = false;
    const history = {};
    try {
      if (!this._registryLoaded && this._hass.callWS) {
        try {
          this._registry = await this._hass.callWS({ type: "config/entity_registry/list" });
          this._registryLoaded = true;
        } catch { /* Manual mappings and canonical device prefixes still work. */ }
      }
      const days = Math.max(2, Math.min(31, Number(this.config.days) || 7));
      const startDate = new Date(); startDate.setHours(0,0,0,0); startDate.setDate(startDate.getDate() - days + 1);
      const start = startDate.toISOString(), end = new Date().toISOString();
      const metrics = Object.keys(LD_STATISTICS);
      const groups = [metrics.filter(m => LD_SUMS.has(m)), metrics.filter(m => m.startsWith("sleep_")), ["heart_rate"]];
      // Request change for cumulative daily totals; mean for sleep and heart rate.
      await Promise.all(groups.map(async group => {
        const selected = group.map(metric => ({ metric, id: this._statistic(metric) })).filter(item => item.id);
        if (!selected.length) return;
        try {
          const sums = LD_SUMS.has(group[0]);
          const response = await this._hass.callWS({ type: "recorder/statistics_during_period",
            start_time: start, end_time: end, statistic_ids: [...new Set(selected.map(item => item.id))],
            period: group[0] === "heart_rate" ? "hour" : "day", types: [sums ? "change" : "mean"] });
          for (const {metric, id} of selected) {
            const target = this._entity(metric) || id;
            history[target] = (response[id] || []).filter(row => row[sums ? "change" : "mean"] != null).map(row => ({
              t: typeof row.start === "number" ? row.start * (row.start < 1e12 ? 1000 : 1) : new Date(row.start).getTime(),
              v: Number(row[sums ? "change" : "mean"]),
            })).filter(point => Number.isFinite(point.t) && Number.isFinite(point.v));
          }
        } catch (error) { failed = true; console.warn("Life Dashboard statistics unavailable", error); }
      }));
      // Recorder is a fallback for manual sensors without an external statistic.
      // Never treat receipt-time history as backfilled Life Dashboard history.
      const fallback = metrics.filter(metric => !this._statistic(metric)).map(metric => this._entity(metric)).filter(Boolean);
      if (fallback.length) {
        try {
          const path = `history/period/${encodeURIComponent(start)}?filter_entity_id=${encodeURIComponent(fallback.join(","))}&end_time=${encodeURIComponent(end)}&minimal_response`;
          const response = await this._hass.callApi("GET", path);
          for (const [index, series] of (response || []).entries()) {
            const entity = series.find(point => point.entity_id)?.entity_id || fallback[index];
            const metric = metrics.find(metric => this._entity(metric) === entity);
            let attributes = {};
            history[entity] = series.map(point => {
              attributes = point.attributes || attributes;
              const value = point.state ?? point.s;
              if (value == null || ["", "unknown", "unavailable", "none"].includes(value)) return null;
              const state = { ...point, attributes };
              return { t: this._currentTime(metric, state), v: this._normalize(metric, value, state) };
            }).filter(point => point && Number.isFinite(point.t) && Number.isFinite(point.v));
          }
        } catch (error) { failed = true; console.warn("Life Dashboard history unavailable", error); }
      }
      if (generation === this._configGeneration) {
        this._history = history; this._historyError = failed;
        this._historyKey = key; this._historyAt = Date.now();
      }
    } finally {
      this._loadingHistory = false;
      if (generation === this._configGeneration) this._render();
      else this._scheduleHistory();
    }
  }

}

class LifeDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._profileSignature = "";
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._registryRequested && hass.callWS) {
      this._registryRequested = true;
      hass.callWS({ type: "config/entity_registry/list" }).then(registry => {
        this._registry = registry; this._render();
      }).catch(() => { /* Prefix discovery remains available. */ });
    }
    const signature = JSON.stringify(LifeDashboardCard.discoverProfiles(hass, this._registry));
    if (signature !== this._profileSignature) {
      this._profileSignature = signature;
      this._render();
    } else if (this._form) {
      this._form.hass = hass;
    }
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  connectedCallback() { this._render(); }

  _render() {
    if (!this._hass || !globalThis.document) return;
    const lang = (this._hass.language || globalThis.navigator?.language || "en").toLowerCase().startsWith("ru") ? "ru" : "en";
    const profiles = LifeDashboardCard.discoverProfiles(this._hass, this._registry).filter(profile => !this._config.source || this._config.source === "auto" || (profile.source || "life_dashboard") === this._config.source);
    const base = LifeDashboardCard.getConfigForm();
    const profileField = {
      name: "_profile_import",
      selector: { select: { mode: "dropdown", options: profiles.map((profile) => ({
        value: profile.id,
        label: `${profile.label || profile.id} (${profile.count} ${lang === "ru" ? "сущн." : "entities"})`,
      })) } },
    };
    this.shadowRoot.innerHTML = `<style>:host{display:block}.profile-note{margin:0 0 10px;padding:10px 12px;border-radius:10px;background:var(--secondary-background-color);color:var(--secondary-text-color);font-size:12px;line-height:1.4}</style><div class="profile-note">${profiles.length ? (lang === "ru" ? "Выберите профиль — найденные сущности автоматически заполнят поля ниже. После импорта любую сущность можно заменить вручную." : "Select a profile to fill the entity fields below automatically. Any imported entity can still be changed manually.") : (lang === "ru" ? "Профили Life Dashboard пока не найдены. Выполните хотя бы одну синхронизацию." : "No matching profiles found yet. Sync Life Dashboard or Garmin Connect, or select another data source.")}</div>`;
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.data = { ...this._config, _profile_import: undefined };
    form.schema = [profileField, ...base.schema];
    form.computeLabel = (schema) => schema.name === "_profile_import"
      ? (lang === "ru" ? "Быстрый импорт профиля" : "Quick profile import")
      : base.computeLabel(schema);
    form.computeHelper = (schema) => schema.name === "_profile_import"
      ? (lang === "ru" ? "Импортирует все доступные сущности выбранного профиля" : "Imports every available entity from the selected profile")
      : base.computeHelper?.(schema);
    form.addEventListener("value-changed", (event) => this._valueChanged(event, profiles));
    this.shadowRoot.appendChild(form);
    this._form = form;
  }

  _valueChanged(event, profiles) {
    const next = { ...(event.detail?.value || this._config) };
    const selected = next._profile_import;
    delete next._profile_import;
    if (!selected && (next.source || "auto") !== (this._config.source || "auto")) {
      delete next.user_id;
      delete next.statistic_entry_id;
      next.entities = {};
      next.statistics = {};
    }
    if (selected) {
      const profile = profiles.find((item) => item.id === selected);
      if (profile) {
        next.user_id = profile.id;
        next.source = profile.source || "life_dashboard";
        next.statistic_entry_id = profile.entry_id;
        next.statistics = {};
        next.entities = { ...profile.entities };
      }
    }
    this._config = next;
    this._render();
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true, composed: true, detail: { config: next },
    }));
  }
}

if (!customElements.get("life-dashboard-card")) {
  customElements.define("life-dashboard-card", LifeDashboardCard);
}
if (!customElements.get("life-dashboard-card-editor")) {
  customElements.define("life-dashboard-card-editor", LifeDashboardCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "life-dashboard-card",
  name: "Life Dashboard Card",
  description: "A responsive health dashboard with built-in activity, sleep and heart-rate charts.",
  preview: true,
  documentationURL: "https://github.com/3115a083/life-dashboard-card",
});

console.info(`%c LIFE-DASHBOARD-CARD %c v${HB_VERSION} `,"color:white;background:#4c8dff;font-weight:700","color:#4c8dff;background:#eaf2ff");
