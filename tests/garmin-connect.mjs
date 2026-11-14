import './life-dashboard.mjs';
import assert from 'node:assert/strict';
const Card = customElements.get('life-dashboard-card');
const now = new Date();
const yesterday = new Date(now); yesterday.setDate(yesterday.getDate()-1); yesterday.setHours(0,0,0,0);
const entry = '01GARMINA';
const makeState = (value, unit, attributes={}) => ({state:String(value),last_updated:now.toISOString(), attributes:{unit_of_measurement:unit,...attributes}});
const specs = [
  ['sensor.garmin_connect_total_steps','totalSteps',8000,'steps'],
  ['sensor.renamed_calories','activeKilocalories',400,'kcal'],
  ['sensor.renamed_distance','totalDistanceMeters',6200,'m'],
  ['sensor.garmin_connect_sleep_duration','measurableAsleepDurationMinutes',450,'min'],
  ['sensor.renamed_deep','deepSleepMinutes',90,'min'],
  ['sensor.renamed_light','lightSleepMinutes',270,'min'],
  ['sensor.renamed_rem','remSleepMinutes',90,'min'],
  ['sensor.renamed_pulse','latestHeartRate',72,'bpm'],
  ['sensor.renamed_resting','restingHeartRate',54,'bpm'],
  ['sensor.renamed_hrv','hrvLastNightAvg',48,'ms'],
  ['sensor.renamed_oxygen','latestSpo2',98,'%'],
  ['sensor.renamed_respiration','latestRespirationValue',14,'brpm'],
  ['sensor.renamed_weight','weightKg',70,'kg'],
  ['sensor.renamed_fat','bodyFat',18,'%'],
  ['sensor.renamed_vo2','vo2Max',50,'mL/(kg·min)'],
  ['sensor.garmin_connect_last_activity','lastActivity','Morning Run',undefined],
  ['sensor.garmin_connect_last_synced','lastSyncTimestamp',now.toISOString(),undefined],
];
const registry = specs.map(([entity_id,key])=>({entity_id,config_entry_id:entry,platform:'garmin_connect',unique_id:`${entry}_${key}`}));
const states = Object.fromEntries(specs.map(([id,,value,unit])=>[id,makeState(value,unit)]));
states['sensor.renamed_pulse'].attributes.measurement_time = new Date(now-60000).toISOString();
states['sensor.garmin_connect_last_activity'].attributes.duration = 1800;
// A second Garmin account with a missing weight must never borrow the first.
registry.push({entity_id:'sensor.second_steps',config_entry_id:'01GARMINB',platform:'garmin_connect',unique_id:'01GARMINB_totalSteps'});
states['sensor.second_steps']=makeState(1234,'steps');
// Existing Life Dashboard installation alongside Garmin.
states['sensor.phone_steps_today']=makeState(1000,'steps');
registry.push({entity_id:'sensor.phone_steps_today',config_entry_id:'PHONE',platform:'life_dashboard',unique_id:'PHONE_steps_today'});
const requests=[];
const hass={language:'de',states,callWS:async request=>{
  requests.push(request);
  if(request.type==='config/entity_registry/list')return registry;
  throw Error('Garmin must not query Life Dashboard external statistics');
},callApi:async(method,path)=>{
  requests.push({method,path});
  const ids=new URLSearchParams(path.split('?')[1]).get('filter_entity_id').split(',');
  return ids.map(id=>{
    if(id==='sensor.garmin_connect_total_steps') return [
      {entity_id:id,state:'6000',last_updated:new Date(yesterday.getTime()+18*3600000).toISOString(),attributes:{unit_of_measurement:'steps'}},
      {state:'0',last_updated:new Date(yesterday.getTime()+23*3600000).toISOString()},
    ];
    if(id==='sensor.renamed_deep')return [{entity_id:id,state:'120',last_updated:new Date(yesterday.getTime()+10*3600000).toISOString(),attributes:{unit_of_measurement:'min'}}];
    if(id==='sensor.renamed_light')return [{entity_id:id,state:'14400',last_updated:new Date(yesterday.getTime()+10*3600000).toISOString(),attributes:{unit_of_measurement:'s'}}];
    if(id==='sensor.renamed_rem')return [{entity_id:id,state:'unknown',last_updated:now.toISOString()}];
    if(id==='sensor.renamed_pulse')return [{entity_id:id,state:'68',last_updated:now.toISOString(),attributes:{measurement_time:new Date(now-3600000).toISOString()}}];
    return [];
  });
}};
const profiles=Card.discoverProfiles(hass,registry);
assert.equal(profiles.filter(p=>p.source==='garmin_connect').length,2,'no duplicate prefix profile after registry discovery');
const card=new Card();card.setConfig({source:'garmin_connect',days:3});card.hass=hass;
while(card._loadingHistory)await new Promise(r=>setTimeout(r,0));
assert.equal(card._detectUserId(),`garmin_connect:${entry}`);
assert.equal(card._entity('heart_rate'),'sensor.renamed_pulse');
assert.equal(card._entity('exercise_time'),undefined,'intensity minutes are not daily workout minutes');
assert.equal(card._entity('lean_body_mass'),undefined,'muscle mass is not lean body mass');
assert.equal(card._statistic('steps'),undefined);
assert.equal(card._historyError,false);
assert.deepEqual(card._daily('steps').map(d=>d.value),[0,6000,8000]);
assert.deepEqual(card._daily('sleep_deep_hours').map(d=>d.value),[0,2,1.5]);
assert.equal(card._daily('sleep_core_hours')[1].value,4,'historical seconds convert with historical unit');
assert.equal(card._history['sensor.renamed_rem'].length,0,'unknown is never a zero measurement');
assert.equal(card._historyPoints('heart_rate').at(-1).t,new Date(now-60000).getTime());
assert.match(card._format('sleep_duration'),/7,5 <small>h/);
assert.match(card._format('distance'),/6,2 <small>km/);
assert.match(card.shadowRoot.innerHTML,/Morning Run.*30 min/);
assert.match(card.shadowRoot.innerHTML,/data-chart="sleep"/);
assert.equal(requests.filter(r=>r.type==='recorder/statistics_during_period').length,0);
// Auto still chooses the existing Life Dashboard profile when both are present.
const auto=new Card();auto.setConfig({});auto._registry=registry;auto._hass=hass;
assert.equal(auto._entity('steps'),'sensor.phone_steps_today');
// Explicit source/account and canonical alias survive the registry lookup.
card.setConfig({source:'garmin_connect',user_id:'garmin_connect'});
assert.equal(card._entity('steps'),'sensor.garmin_connect_total_steps');
card.setConfig({source:'garmin_connect',user_id:'01GARMINB'});
assert.equal(card._entity('steps'),'sensor.second_steps');
assert.equal(card._entity('body_mass'),undefined);
assert.equal(card._entity('heart_rate'),undefined);
assert.equal(card._liveHeartHistory.length,0);
// A manually selected Garmin metric on a Life Dashboard card routes to Recorder.
card.setConfig({user_id:'phone',entities:{heart_rate:'sensor.renamed_pulse'}});
assert.equal(card._metricSource('heart_rate'),'garmin_connect');
assert.equal(card._statistic('heart_rate'),undefined);
assert.equal(card._statistic('steps'),'life_dashboard:phone_steps');
// Disabled optional pulse is not silently substituted with resting/max pulse.
const noPulse={...hass,states:{...states}};delete noPulse.states['sensor.renamed_pulse'];
assert.equal(Card.discoverProfiles(noPulse,registry).find(p=>p.id===`garmin_connect:${entry}`).entities.heart_rate,undefined);
// English default IDs work without registry permission.
const fallback=Card.discoverProfiles({states:{'sensor.garmin_connect_total_steps':makeState(500,'steps'),'sensor.garmin_connect_deep_sleep':makeState(60,'min')}});
assert.equal(fallback.length,1);
assert.equal(fallback[0].entities.sleep_deep_hours,'sensor.garmin_connect_deep_sleep');
// Old seconds-based entities resolve inside their own registry account.
const oldRegistry=[{entity_id:'sensor.old_sleep',platform:'garmin_connect',config_entry_id:'OLD',unique_id:'legacy_user_deepSleepSeconds'}];
assert.equal(Card.discoverProfiles({states:{'sensor.old_sleep':makeState(5400,'s')}},oldRegistry)[0].entities.sleep_deep_hours,'sensor.old_sleep');
// Editor source change drops mappings/statistics from the previous source.
const editor=Card.getConfigElement();editor.setConfig({source:'life_dashboard',user_id:'phone',entities:{steps:'sensor.phone_steps_today'},statistics:{steps:'life_dashboard:phone_steps'},statistic_entry_id:'PHONE'});
editor._valueChanged({detail:{value:{...editor._config,source:'garmin_connect'}}},profiles);
assert.equal(editor.lastEvent.detail.config.user_id,undefined);
assert.deepEqual(editor.lastEvent.detail.config.entities,{});
editor._valueChanged({detail:{value:{...editor._config,_profile_import:`garmin_connect:${entry}`}}},profiles);
assert.equal(editor.lastEvent.detail.config.source,'garmin_connect');
assert.equal(editor.lastEvent.detail.config.statistic_entry_id,undefined);
assert.deepEqual(editor.lastEvent.detail.config.statistics,{});
assert.equal(editor.lastEvent.detail.config.entities.steps,'sensor.garmin_connect_total_steps');
assert.throws(()=>card.setConfig({source:'typo'}),/source must be/);
console.log('Garmin Connect integration tests passed');
