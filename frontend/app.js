const { useEffect, useMemo, useState } = React;

const BATCHES = [
  { key: "to_school", label: "名额到校", number: "01" },
  { key: "to_district", label: "名额到区", number: "02" },
  { key: "unified", label: "统一招生", number: "03" },
];

async function api(path, options = {}) {
  if (window.ZHONGKAO_STATIC_API) return window.ZHONGKAO_STATIC_API(path, options);
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "服务暂时不可用");
  return data;
}

function probabilityClass(tier) {
  return { "高风险": "danger", "冲": "reach", "稳": "match", "保": "safe" }[tier] || "";
}

function Header() {
  const referenceUrl = window.ZHONGKAO_REPO_URL || "/docs";
  const referenceLabel = window.ZHONGKAO_REPO_URL ? "项目源码 ↗" : "API文档 ↗";
  return <>
    <header className="topbar">
      <a className="brand" href="#top"><span>沪</span><strong>上海中考AI志愿系统</strong></a>
      <nav><a href="#recommendations">学校推荐</a><a href="#wishes">志愿模拟</a><a href={referenceUrl} target="_blank">{referenceLabel}</a></nav>
    </header>
    <div className="demo-banner">2025演示数据推演2026 · 非官方录取结论 · 不构成填报承诺</div>
  </>;
}

function CandidateForm({ districts, middleSchools, form, setForm, onDistrict, onSubmit, loading, error }) {
  return <section className="candidate-card">
    <div className="section-label">STEP 01 · 考生信息</div>
    <h2>先确定你在哪个赛道</h2>
    <p className="muted">区、初中和分数共同决定可报范围。名额到校不是全市通用资格。</p>
    <form onSubmit={onSubmit}>
      <label>所在区
        <select value={form.district} onChange={e => onDistrict(e.target.value)} required>
          <option value="">请选择所在区</option>
          {districts.map(item => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>所在初中
        <select value={form.middle_school_id} onChange={e => setForm({...form, middle_school_id:e.target.value})} disabled={!form.district} required>
          <option value="">请选择示例初中</option>
          {middleSchools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label>中考总分（满分750）
        <div className="score-input"><input type="number" min="0" max="750" step="0.5" value={form.score} onChange={e => setForm({...form, score:e.target.value})} required/><b>分</b></div>
      </label>
      {error && <div className="error-box">{error}</div>}
      <button className="primary" disabled={loading}>{loading ? "正在计算…" : "AI生成志愿建议"}<span>→</span></button>
    </form>
  </section>;
}

function Hero({ result }) {
  const counts = result ? result.schools.reduce((acc, school) => ({...acc, [school.best_tier]:(acc[school.best_tier]||0)+1}), {}) : {};
  return <section className="hero" id="top">
    <div className="hero-copy">
      <span className="eyebrow">SHANGHAI ZHONGKAO · 2026</span>
      <h1>把分数变成<br/><em>有顺序的选择。</em></h1>
      <p>用可解释的 Sigmoid 模型估算概率，把本区、跨区、名额到校和统一招生拆开看，再模拟每一条志愿如何被检索。</p>
      <div className="model-pill"><span>ƒ(x)</span><div><strong>可解释概率，不是黑箱</strong><small>P = 1 / (1 + e<sup>-分差/6</sup>)</small></div></div>
    </div>
    <div className="score-orbit">
      <div className="orbit-ring"></div>
      <div className="score-core"><small>当前分数</small><strong>{result ? result.candidate.score : "—"}</strong><span>/ 750</span></div>
      <div className="orbit-tag tag-one">冲 {counts["冲"] || 0}</div>
      <div className="orbit-tag tag-two">稳 {counts["稳"] || 0}</div>
      <div className="orbit-tag tag-three">保 {counts["保"] || 0}</div>
    </div>
  </section>;
}

function SchoolCard({ school, addWish, wishes }) {
  return <article className="school-card">
    <div className="school-head">
      <div><div className="school-tags"><span>{school.scope}</span><span>{school.type}</span></div><h3>{school.name}</h3><p>{school.district} · 2026趋势修正 {school.trend >= 0 ? "+" : ""}{school.trend}分</p></div>
      <div className={`probability ${probabilityClass(school.best_tier)}`}><strong>{school.best_probability_percent}%</strong><span>最高概率 · {school.best_tier}</span></div>
    </div>
    <div className="batch-list">
      {school.batches.map(batch => {
        const added = wishes[batch.key].some(item => item.id === school.id);
        return <div className="batch-row" key={batch.key}>
          <div><b>{batch.label}</b><small>2025线 {batch.line_2025}　→　2026预测 {batch.predicted_line_2026}</small></div>
          <div className="line-gap"><span className={batch.difference >= 0 ? "positive" : "negative"}>{batch.difference >= 0 ? "+" : ""}{batch.difference}分</span><em className={probabilityClass(batch.tier)}>{batch.tier} · {batch.probability_percent}%</em></div>
          <button onClick={() => addWish(batch.key, school)} disabled={added}>{added ? "已加入" : "+ 加入志愿"}</button>
        </div>;
      })}
    </div>
  </article>;
}

function Recommendations({ result, addWish, wishes }) {
  const [batch, setBatch] = useState("all");
  const [tier, setTier] = useState("all");
  const [query, setQuery] = useState("");
  const schools = useMemo(() => {
    if (!result) return [];
    return result.schools.filter(school =>
      (batch === "all" || school.batches.some(item => item.key === batch)) &&
      (tier === "all" || school.batches.some(item => item.tier === tier)) &&
      (!query || school.name.includes(query) || school.district.includes(query))
    );
  }, [result, batch, tier, query]);
  if (!result) return <section className="empty-preview"><span>02</span><h2>推荐学校会出现在这里</h2><p>先选择所在区、初中并输入分数。</p></section>;
  return <section id="recommendations" className="recommend-section">
    <div className="section-heading"><div><span className="section-label">STEP 02 · AI推荐</span><h2>本区优先，跨区有据</h2><p>{result.candidate.district} · {result.candidate.middle_school_name} · 共找到 {result.schools.length} 所可报学校</p></div><div className="legend"><i className="reach"></i>冲<i className="match"></i>稳<i className="safe"></i>保</div></div>
    <div className="filters">
      <input placeholder="搜索学校或区" value={query} onChange={e => setQuery(e.target.value)}/>
      <select value={batch} onChange={e => setBatch(e.target.value)}><option value="all">全部批次</option>{BATCHES.map(b => <option value={b.key} key={b.key}>{b.label}</option>)}</select>
      <select value={tier} onChange={e => setTier(e.target.value)}><option value="all">全部档位</option><option>冲</option><option>稳</option><option>保</option><option>高风险</option></select>
      <span>{schools.length} 所</span>
    </div>
    <div className="school-grid">{schools.map(school => <SchoolCard key={school.id} school={school} addWish={addWish} wishes={wishes}/>)}</div>
    {!schools.length && <div className="no-result">没有符合当前筛选的学校，请切换批次或档位。</div>}
  </section>;
}

function WishColumn({ batch, items, moveWish, removeWish }) {
  return <div className="wish-column">
    <div className="wish-title"><span>{batch.number}</span><div><h3>{batch.label}</h3><p>按顺序依次检索</p></div><b>{items.length}</b></div>
    <div className="wish-items">
      {items.map((school, index) => <div className="wish-item" key={school.id}><span>{index + 1}</span><div><strong>{school.name}</strong><small>{school.district} · {school.scope}</small></div><div className="wish-actions"><button disabled={index === 0} onClick={() => moveWish(batch.key, index, -1)}>↑</button><button disabled={index === items.length - 1} onClick={() => moveWish(batch.key, index, 1)}>↓</button><button onClick={() => removeWish(batch.key, school.id)}>×</button></div></div>)}
      {!items.length && <div className="wish-empty">从学校推荐中加入志愿</div>}
    </div>
  </div>;
}

function Simulation({ wishes, moveWish, removeWish, onSimulate, loading, simulation, error }) {
  const total = Object.values(wishes).reduce((sum, list) => sum + list.length, 0);
  return <section className="simulation" id="wishes">
    <div className="section-heading light"><div><span className="section-label">STEP 03 · 录取模拟</span><h2>把志愿顺序跑一遍</h2><p>固定按名额到校 → 名额到区 → 统一招生检索；先录取，后续即停止。</p></div><button className="simulate-button" onClick={onSimulate} disabled={!total || loading}>{loading ? "模拟中…" : `开始模拟 · ${total}个志愿`}<span>▶</span></button></div>
    <div className="wish-grid">{BATCHES.map(batch => <WishColumn key={batch.key} batch={batch} items={wishes[batch.key]} moveWish={moveWish} removeWish={removeWish}/>)}</div>
    {error && <div className="error-box dark">{error}</div>}
    {simulation && <div className="simulation-result">
      <div className={`result-verdict ${simulation.admitted ? "admitted" : "not-admitted"}`}><small>模拟结果</small><h3>{simulation.admitted ? `录取：${simulation.result.school_name}` : "本轮未模拟录取"}</h3><p>{simulation.admitted ? `${simulation.result.batch_label} · 第${simulation.result.order}志愿` : "所有已填志愿均未同时满足资格、预测线和演示名额条件。"}</p></div>
      <div className="timeline">{simulation.timeline.map((step, index) => <div className={`timeline-step ${step.passed ? "passed" : "failed"}`} key={`${step.batch}-${step.school_id}-${index}`}><i>{step.passed ? "✓" : index + 1}</i><div><span>{step.batch_label} · 第{step.order}志愿</span><strong>{step.school_name}</strong><p>{step.decision}</p></div><b>{step.score} / {step.predicted_line_2026}</b></div>)}</div>
    </div>}
  </section>;
}

function App() {
  const [districts, setDistricts] = useState([]);
  const [middleSchools, setMiddleSchools] = useState([]);
  const [form, setForm] = useState({district:"", middle_school_id:"", score:"680"});
  const [result, setResult] = useState(null);
  const [wishes, setWishes] = useState({to_school:[], to_district:[], unified:[]});
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [error, setError] = useState("");
  const [simError, setSimError] = useState("");

  useEffect(() => { api("/api/districts").then(data => setDistricts(data.districts)).catch(e => setError(e.message)); }, []);
  async function onDistrict(district) {
    setForm({...form, district, middle_school_id:""}); setResult(null); setSimulation(null); setWishes({to_school:[],to_district:[],unified:[]});
    if (!district) return setMiddleSchools([]);
    try { const data = await api(`/api/middle-schools?district=${encodeURIComponent(district)}`); setMiddleSchools(data.schools); }
    catch (e) { setError(e.message); }
  }
  async function generate(event) {
    event.preventDefault(); setLoading(true); setError(""); setSimulation(null);
    try {
      const data = await api("/api/recommendations", {method:"POST", body:JSON.stringify({...form, score:Number(form.score)})});
      setResult(data); setWishes({to_school:[],to_district:[],unified:[]});
      setTimeout(() => document.querySelector("#recommendations")?.scrollIntoView({behavior:"smooth"}), 50);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  function addWish(batch, school) { setWishes(current => current[batch].some(x => x.id === school.id) ? current : {...current, [batch]:[...current[batch], school]}); }
  function removeWish(batch, id) { setWishes(current => ({...current, [batch]:current[batch].filter(x => x.id !== id)})); }
  function moveWish(batch, index, direction) { setWishes(current => { const list=[...current[batch]]; const target=index+direction; if(target<0||target>=list.length)return current; [list[index],list[target]]=[list[target],list[index]]; return {...current,[batch]:list}; }); }
  async function simulate() {
    setSimLoading(true); setSimError(""); setSimulation(null);
    try {
      const payload = {...form, score:Number(form.score), wishes:Object.fromEntries(Object.entries(wishes).map(([key, list]) => [key, list.map(x => x.id)]))};
      const data = await api("/api/simulate", {method:"POST", body:JSON.stringify(payload)}); setSimulation(data);
    } catch (e) { setSimError(e.message); } finally { setSimLoading(false); }
  }
  return <><Header/><main><Hero result={result}/><div className="main-grid"><CandidateForm {...{districts,middleSchools,form,setForm,onDistrict,onSubmit:generate,loading,error}}/><Recommendations {...{result,addWish,wishes}}/></div>{result && <Simulation {...{wishes,moveWish,removeWish,onSimulate:simulate,loading:simLoading,simulation,error:simError}}/>}</main><footer><strong>上海中考AI志愿系统</strong><p>模型可以解释，选择仍需核验。正式填报请以当年上海市及各区教育部门公布的政策与数据为准。</p></footer></>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
