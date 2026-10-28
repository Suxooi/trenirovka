// Фоновый тренер. Android запускает этот файл примерно раз в 15 минут, даже когда приложение закрыто
// (WorkManager через @capacitor/background-runner). Здесь нет DOM и localStorage: приложение присылает
// снимок событием 'sync', он лежит в CapacitorKV на телефоне. Ключ ИИ попадает сюда, только если человек
// сам включил «ИИ пишет утром», и никуда, кроме выбранного сервиса ИИ, не уходит.
var KV_SNAP = 'coach.snap', KV_INBOX = 'coach.inbox', KV_SENT = 'coach.sent';

function kvGet(k) {
  try { var r = CapacitorKV.get(k); var v = r && typeof r === 'object' ? r.value : r; return v ? JSON.parse(v) : null; }
  catch (e) { return null; }
}
function kvSet(k, v) { CapacitorKV.set(k, JSON.stringify(v)); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function keyOf(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function mins(hhmm) { var q = String(hhmm || '').split(':'); return (+q[0] || 0) * 60 + (+q[1] || 0); }
function notify(id, title, text) {
  CapacitorNotifications.schedule([{ id: id, title: title, body: text.length > 120 ? text.slice(0, 117) + '…' : text, largeBody: text,
    channelId: 'coach', smallIcon: 'ic_stat_notify', autoCancel: true, extra: { tab: 'coach' } }]);
}
function inboxAdd(m) { var l = kvGet(KV_INBOX) || []; l.push(m); while (l.length > 10) l.shift(); kvSet(KV_INBOX, l); }
function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms); })]); }

// утреннее сообщение от ИИ: DeepSeek или Claude по ключу человека; при любой ошибке — заготовка из приложения
async function aiMorning(ai, brief) {
  var user = 'Данные:\n' + ai.ctx + '\n\nЧто сегодня по плану: ' + brief + '\n\nНапиши утреннее сообщение.';
  if (ai.prov === 'ds') {
    var r = await withTimeout(fetch('https://api.deepseek.com/chat/completions', { method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ai.key },
      body: JSON.stringify({ model: ai.model, max_tokens: 300, messages: [{ role: 'system', content: ai.sys }, { role: 'user', content: user }] }) }), 25000);
    var j = await r.json();
    return j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  }
  var r2 = await withTimeout(fetch('https://api.anthropic.com/v1/messages', { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ai.key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: ai.model, max_tokens: 300, system: ai.sys, messages: [{ role: 'user', content: user }] }) }), 25000);
  var j2 = await r2.json();
  return j2 && j2.content && j2.content[0] && j2.content[0].text;
}

addEventListener('sync', function (resolve, reject, args) {
  try { kvSet(KV_SNAP, (args && args.snap) || null); resolve({ ok: true }); } catch (e) { reject(String(e)); }
});
addEventListener('pull', function (resolve) {
  var l = kvGet(KV_INBOX) || []; kvSet(KV_INBOX, []); resolve({ inbox: l });
});
// фоновый запуск: утро (только режим ИИ — без ИИ утреннее уведомление ставит само приложение)
addEventListener('tick', async function (resolve) {
  try {
    var s = kvGet(KV_SNAP), now = new Date(), k = keyOf(now), m = now.getHours() * 60 + now.getMinutes();
    var sent = kvGet(KV_SENT) || {}, day = s && s.days && s.days[k];
    if (s && s.ai && s.morning && day && sent.m !== k && m >= mins(s.morning) && m < mins(s.morning) + 240) {
      sent.m = k; kvSet(KV_SENT, sent);
      var text = '';
      try { text = String((await aiMorning(s.ai, day.brief)) || '').trim(); } catch (e) { text = ''; }
      if (!text) text = day.brief;
      notify(4200 + now.getDate(), s.name || 'Тренер', text);
      inboxAdd({ at: Date.now(), date: k, kind: 'morning', text: text });
    }
    resolve();
  } catch (e) { resolve(); }
});
