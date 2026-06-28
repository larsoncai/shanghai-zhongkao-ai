(function () {
  "use strict";

  const DATA = window.ZHONGKAO_DATA;
  const SCHOOL_BY_ID = Object.fromEntries(DATA.schools.map(item => [item.id, item]));
  const MIDDLE_BY_ID = Object.fromEntries(DATA.middle_schools.map(item => [item.id, item]));
  const BATCHES = ["to_school", "to_district", "unified"];
  const DISCLAIMER = "本系统使用2025演示数据推演2026结果，仅供产品演示，不代表官方录取线或录取结论。";

  function validateCandidate(district, middleSchoolId, score) {
    if (!DATA.districts.includes(district)) throw new Error("请选择有效的上海市行政区");
    const middle = MIDDLE_BY_ID[middleSchoolId];
    if (!middle) throw new Error("请选择有效的示例初中");
    if (middle.district !== district) throw new Error("所选初中不属于考生所在区");
    if (!Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 750) throw new Error("中考分数必须在0至750分之间");
    return middle;
  }

  function sigmoid(score, predicted, batch) {
    const base = 1 / (1 + Math.exp(-(score - predicted) / 6));
    const modifier = {to_school: 0.03, to_district: 0.01, unified: 0}[batch];
    return Math.round(Math.max(0.01, Math.min(0.99, base + modifier)) * 10000) / 10000;
  }

  function tier(probability) {
    if (probability < 0.25) return "高风险";
    if (probability < 0.55) return "冲";
    if (probability < 0.80) return "稳";
    return "保";
  }

  function eligibility(school, district, middle, batch) {
    const localOrCross = school.district === district || school.cross_districts.includes(district);
    if (batch === "to_school") {
      const quota = middle.school_quotas[school.id] || 0;
      return {eligible: quota > 0, quota, reason: quota > 0 ? "具备演示到校资格" : "该初中无此校演示到校名额"};
    }
    if (batch === "to_district") {
      const quota = localOrCross ? school.quotas.to_district : 0;
      return {eligible: quota > 0, quota, reason: quota > 0 ? "具备演示到区资格" : "该校未向考生所在区开放演示到区名额"};
    }
    const quota = localOrCross ? school.quotas.unified : 0;
    return {eligible: quota > 0, quota, reason: quota > 0 ? "具备统一招生资格" : "该校不在本区或演示跨区招生范围内"};
  }

  function recommendation(payload) {
    const score = Number(payload.score);
    const middle = validateCandidate(payload.district, payload.middle_school_id, score);
    const schools = DATA.schools.map(school => {
      const batches = BATCHES.map(batch => {
        const status = eligibility(school, payload.district, middle, batch);
        if (!status.eligible) return null;
        const line = school.lines_2025[batch];
        const predicted = line + school.trend;
        const probability = sigmoid(score, predicted, batch);
        return {
          key: batch, label: DATA.batch_labels[batch], line_2025: line,
          predicted_line_2026: predicted, difference: Math.round((score - predicted) * 10) / 10,
          probability, probability_percent: Math.round(probability * 1000) / 10,
          tier: tier(probability), quota: status.quota, eligibility: status.reason
        };
      }).filter(Boolean);
      if (!batches.length) return null;
      const best = [...batches].sort((a, b) => b.probability - a.probability)[0];
      return {
        id: school.id, name: school.name, district: school.district, type: school.type,
        scope: school.district === payload.district ? "本区" : "跨区", trend: school.trend,
        best_probability: best.probability, best_probability_percent: best.probability_percent,
        best_tier: best.tier, batches
      };
    }).filter(Boolean).sort((a, b) => b.best_probability - a.best_probability);
    return {
      candidate: {district: payload.district, middle_school_id: middle.id, middle_school_name: middle.name, score},
      schools, disclaimer: DISCLAIMER
    };
  }

  function simulate(payload) {
    const score = Number(payload.score);
    const middle = validateCandidate(payload.district, payload.middle_school_id, score);
    const timeline = [];
    for (const batch of BATCHES) {
      const schoolIds = payload.wishes[batch] || [];
      if (new Set(schoolIds).size !== schoolIds.length) throw new Error(`${DATA.batch_labels[batch]}志愿中不能重复添加同一学校`);
      for (let index = 0; index < schoolIds.length; index++) {
        const school = SCHOOL_BY_ID[schoolIds[index]];
        if (!school) throw new Error("志愿表中包含不存在的学校");
        const status = eligibility(school, payload.district, middle, batch);
        const predicted = school.lines_2025[batch] + school.trend;
        const passed = status.eligible && status.quota > 0 && score >= predicted;
        let decision = status.reason;
        if (status.eligible && status.quota <= 0) decision = "演示名额已用完";
        else if (status.eligible && score < predicted) decision = `低于2026预测线${Math.round((predicted - score) * 10) / 10}分，继续检索`;
        else if (passed) decision = "达到预测线且有演示名额，模拟录取";
        const step = {
          batch, batch_label: DATA.batch_labels[batch], order: index + 1,
          school_id: school.id, school_name: school.name, score,
          predicted_line_2026: predicted, quota: status.quota,
          eligible: status.eligible, passed, decision
        };
        timeline.push(step);
        if (passed) return {admitted: true, result: step, timeline, disclaimer: DISCLAIMER};
      }
    }
    return {admitted: false, result: null, timeline, disclaimer: DISCLAIMER};
  }

  window.ZHONGKAO_STATIC_API = async function (path, options = {}) {
    if (path === "/api/districts") return {districts: DATA.districts};
    if (path.startsWith("/api/middle-schools")) {
      const district = new URL(path, window.location.href).searchParams.get("district");
      if (!DATA.districts.includes(district)) throw new Error("请选择有效的上海市行政区");
      return {schools: DATA.middle_schools.filter(item => item.district === district).map(item => ({id: item.id, name: item.name}))};
    }
    const payload = JSON.parse(options.body || "{}");
    if (path === "/api/recommendations") return recommendation(payload);
    if (path === "/api/simulate") return simulate(payload);
    throw new Error("静态版不支持该接口");
  };
})();
