import './smoke.mjs';
import assert from 'node:assert/strict';
const Card = customElements.get('life-dashboard-card');
const state = (value, attributes = {}) => ({ state: String(value), attributes });
const entry = '01PHONEENTRY';
const registry = [
  ['sensor.phone_steps_today', 'steps_today'],
  ['sensor.renamed_pulse', 'heart_rate'],
  ['sensor.phone_last_sleep_asleep', 'last_sleep_asleep'],
  ['sensor.renamed_sleep', 'sleep_duration'],
].map(([entity_id, key]) => ({ entity_id, unique_id: `${entry}_${key}`, config_entry_id: entry, platform: 'life_dashboard' }));
const now = new Date();
const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(0,0,0,0);
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const states = {
  'sensor.phone_steps_today': state(1200, { date: dateKey(now) }),
  'sensor.renamed_pulse': state(70, { measured_at: new Date(now-60000).toISOString() }),
  'sensor.phone_last_sleep_asleep': state(7, { night: dateKey(yesterday) }),
  'sensor.renamed_sleep': state(8),
  'sensor.other_steps_today': state(9999),
  'sensor.other_weight': state(90),
  'sensor.steps_healthbridge': state(123),
  'sensor.unrelated_heart_rate': state(99),
};
const profiles = Card.discoverProfiles({states}, registry);
assert.equal(profiles.length, 2);
assert.equal(profiles.find(p=>p.id==='phone').entities.heart_rate, 'sensor.renamed_pulse');
assert.equal(profiles.find(p=>p.id==='phone').entities.sleep_duration, 'sensor.phone_last_sleep_asleep');
const requests = [];
const hass = {language:'de', states,
  callApi: async()=>{throw Error('Life Dashboard backfill must use statistics');},
  callWS: async request => {
    requests.push(request);
    if (request.type==='config/entity_registry/list') return registry;
    const result = {};
    for (const id of request.statistic_ids) {
      if (id.endsWith('_steps')) result[id] = [{start:yesterday.getTime(), change:4321}, {start:now.getTime(), change:null}];
      else if (id.endsWith('_sleep_deep')) result[id] = [{start:yesterday.getTime(), mean:1.5}];
      else if (id.endsWith('_sleep_light')) result[id] = [{start:yesterday.getTime(), mean:4}];
      else if (id.endsWith('_sleep_rem')) result[id] = [{start:yesterday.getTime(), mean:1.5}];
      else if (id.endsWith('_heart_rate')) result[id] = [{start:now.getTime()-3600000, mean:65}];
    }
    return result;
  },
};
const card = new Card(); card.setConfig({user_id:'phone', days:3}); card.hass=hass;
while(card._loadingHistory) await new Promise(resolve=>setTimeout(resolve,0));
assert.equal(card._entity('heart_rate'), 'sensor.renamed_pulse');
assert.equal(card._entity('body_mass'), undefined, 'never borrow another phone weight');
assert.equal(card._historyError, false);
assert.equal(card._statistic('steps'), 'life_dashboard:01phoneentry_steps');
assert.deepEqual(card._daily('steps').map(d=>[d.value,d.has]), [[0,false],[4321,true],[1200,true]]);
assert.deepEqual(card._daily('sleep_deep_hours').map(d=>d.value),[0,1.5,0]);
assert.match(card.shadowRoot.innerHTML,/Schlafphasen/);
assert.match(card.shadowRoot.innerHTML,/Gesundheit/);
assert.match(card.shadowRoot.innerHTML,/data-chart="sleep"/);
assert.ok(requests.some(r=>r.period==='day' && r.types[0]==='change'));
assert.ok(requests.some(r=>r.period==='hour' && r.types[0]==='mean'));
assert.ok(requests.some(r=>r.period==='day' && r.statistic_ids.some(id=>id.endsWith('sleep_deep'))));
const measured = card._historyPoints('heart_rate').at(-1);
assert.equal(measured.t, new Date(states['sensor.renamed_pulse'].attributes.measured_at).getTime());
// A complete rename still resolves from the entity registry.
const renamed = Card.discoverProfiles({states:{'sensor.renamed_sleep':state(8)}},registry);
assert.equal(renamed[0].id, entry);
assert.equal(renamed[0].entities.sleep_duration,'sensor.renamed_sleep');
// A stale day is displayed on that day, not on its sync/receipt date.
card._hass = {...hass,states:{...states,'sensor.phone_steps_today':state(100,{date:dateKey(yesterday)})}};
card._history={};
assert.deepEqual(card._daily('steps').map(d=>d.value),[0,100,0]);
card._hass = {...hass,states:{...states,'sensor.phone_steps_today':state('unknown')}};
assert.equal(card._numeric('steps'),null);
assert.equal(card._historyPoints('steps').length,0);
// Profile switches clear live readings and do not resolve the previous device.
card.setConfig({user_id:'other'});
assert.equal(card._entity('heart_rate'),undefined);
assert.equal(card._liveHeartHistory.length,0);
assert.equal(card._statistic('heart_rate'),undefined);
// Out-of-order edits use the most recent correction, even when it reduces a day.
card.setConfig({user_id:'phone'}); card._hass=hass;
card._history={'sensor.phone_steps_today':[{t:yesterday.getTime(),v:5000},{t:yesterday.getTime()+3600000,v:4000}]};
assert.equal(card._daily('steps').find(d=>dateKey(d.date)===dateKey(yesterday)).value,4000);
console.log('Life Dashboard integration tests passed');
