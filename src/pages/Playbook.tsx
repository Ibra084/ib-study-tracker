import {useEffect} from 'react';
import {useLocation,Link} from 'react-router-dom';
import {strategies} from '../lib/content';
import {PageHeading,Source} from '../components/Ui';
export default function Playbook(){
 const {hash}=useLocation();
 useEffect(()=>{if(hash)document.getElementById(hash.slice(1))?.scrollIntoView({block:'start'});},[hash]);
 return <>
 <PageHeading eyebrow="What the research says" title="Study playbook" lead="Methods ranked by the strength of the evidence behind them, with steps you can use today."/>
 <div className="evidence-key" aria-label="Evidence levels"><span className="evidence evidence-strong">Strong</span> consistent results across many studies and ages <span className="evidence evidence-moderate">Moderate</span> good results, narrower evidence <span className="evidence evidence-low">Low</span> feels useful, rarely helps alone</div>
 <div className="playbook-grid">{strategies.map(s=><article className={`card strategy${s.evidence==='Low'?' strategy-low':''}`} id={s.id} key={s.id}>
 <div className="card-heading"><h2>{s.name}</h2><span className={`evidence evidence-${s.evidence.toLowerCase()}`}>{s.evidence}</span></div>
 <p>{s.summary}</p><ol className="steps">{s.steps.map(step=><li key={step}>{step}</li>)}</ol>
 <div className="strategy-foot"><span><strong>Best for:</strong> {s.for}</span><Source href={s.source.href}>{s.source.label}</Source></div>
 {s.id==='spacing'&&<Link className="text-link" to="/review">Open your review queue</Link>}{s.id==='error-log'&&<Link className="text-link" to="/sat">Open the SAT error log</Link>}{s.id==='plans'&&<Link className="text-link" to="/">Plan today</Link>}
 </article>)}</div>
 </>;
}
