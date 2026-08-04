const screens = [
  {id:'01',category:'desktop',title:'Project Dashboard',src:'desktop/01-project-dashboard.png',route:'/projects',description:'Project health, screening volume, anomaly summary, and agent status.'},
  {id:'02',category:'desktop',title:'Screening Consent',src:'desktop/02-screening-consent.png',route:'/screen/:screeningToken (before consent)',description:'Explicit research consent, privacy constraints, and screening entry.'},
  {id:'03',category:'desktop',title:'Audience Player',src:'desktop/03-audience-player.png',route:'/screen/:screeningToken (after consent)',description:'Consented audience playback and structured response capture.'},
  {id:'04',category:'desktop',title:'Response Timeline',src:'desktop/04-response-timeline.png',route:'/projects/:projectId/experiments/:experimentId/finding',description:'Primary analysis workspace with synchronized player, response cliff, and approval rail.'},
  {id:'05',category:'desktop',title:'Moment Evidence',src:'desktop/05-moment-evidence.png',route:'/projects/:projectId/experiments/:experimentId/evidence',description:'Evidence records, cohort comparison, uncertainty, and ClickHouse MCP trace.'},
  {id:'06',category:'desktop',title:'Edit Hypothesis',src:'desktop/06-edit-hypothesis.png',route:'/projects/:projectId/experiments/:experimentId/hypothesis',description:'Agent proposal with observation, rationale, forecast, confounders, and human review.'},
  {id:'07',category:'desktop',title:'Create A/B Test',src:'desktop/07-create-ab-test.png',route:'/projects/:projectId/experiments/:experimentId/test',description:'Control/variant setup, sample design, guardrails, and approval-gated launch.'},
  {id:'08',category:'desktop',title:'Experiment Results',src:'desktop/08-experiment-results.png',route:'/projects/:projectId/experiments/:experimentId/results',description:'Clearly simulated results, confidence intervals, cohorts, and query evidence.'},
  {id:'00',category:'mobile',title:'Mobile Workflow Composite',src:'mobile/00-mobile-workflow-composite.png',route:'390px route set',description:'Canonical three-state mobile composition approved in the Idea Lab.'},
  {id:'09',category:'mobile',title:'Mobile Finding',src:'mobile/09-mobile-finding.png',route:'…/:experimentId/finding · 390px',description:'Touch-first finding route with video, live chart, response cliff, and evidence CTA.'},
  {id:'10',category:'mobile',title:'Mobile Evidence',src:'mobile/10-mobile-evidence.png',route:'…/:experimentId/evidence · 390px',description:'Mobile filmstrip, evidence semantics, cohorts, MCP activity, and hypothesis preview.'},
  {id:'11',category:'mobile',title:'Mobile A/B Test',src:'mobile/11-mobile-test.png',route:'…/:experimentId/test · 390px',description:'Stacked cut comparison, forecast, explicit approval, and locked launch state.'},
  {id:'12',category:'system',title:'Design System Board',src:'system/12-design-system-board.png',route:'tokens + components',description:'Color, type, spacing, grids, controls, charts, navigation, and accessibility rules.'},
  {id:'13',category:'system',title:'Product State Board',src:'system/13-state-reference-board.png',route:'loading + edge states',description:'Loading, empty, failure, agent, approval, experiment, and outcome states.'}
];

const grid=document.querySelector('#screen-grid');
const search=document.querySelector('#search');
const filters=[...document.querySelectorAll('.filter')];
const empty=document.querySelector('#empty-state');
const viewer=document.querySelector('#viewer');
let activeFilter='all';
let visible=[...screens];
let currentIndex=0;

function render(){
  const query=search.value.trim().toLowerCase();
  visible=screens.filter(screen=>(activeFilter==='all'||screen.category===activeFilter)&&`${screen.title} ${screen.route} ${screen.description}`.toLowerCase().includes(query));
  grid.innerHTML=visible.map((screen,index)=>`<article class="card ${screen.category}"><button class="preview" data-index="${index}" aria-label="View ${screen.title} full screen"><img src="${screen.src}" alt="${screen.title} reference" loading="lazy"></button><div class="card-body"><div class="card-meta"><span>${screen.id} · ${screen.category}</span><span>${screen.route}</span></div><h3>${screen.title}</h3><p>${screen.description}</p></div></article>`).join('');
  empty.hidden=visible.length!==0;
  grid.querySelectorAll('.preview').forEach(button=>button.addEventListener('click',()=>openViewer(Number(button.dataset.index))));
}

function openViewer(index){currentIndex=index;updateViewer();viewer.showModal();document.body.style.overflow='hidden'}
function updateViewer(){const screen=visible[currentIndex];if(!screen)return;document.querySelector('#viewer-image').src=screen.src;document.querySelector('#viewer-image').alt=`${screen.title} full-resolution reference`;document.querySelector('#viewer-index').textContent=`${screen.id} / ${String(visible.length).padStart(2,'0')}`;document.querySelector('#viewer-title').textContent=screen.title;document.querySelector('#viewer-description').textContent=screen.description;document.querySelector('#open-original').href=screen.src}
function closeViewer(){viewer.close();document.body.style.overflow=''}
function move(direction){currentIndex=(currentIndex+direction+visible.length)%visible.length;updateViewer()}

filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(item=>item.classList.remove('active'));button.classList.add('active');activeFilter=button.dataset.filter;render()}));
search.addEventListener('input',render);
document.querySelector('#close-viewer').addEventListener('click',closeViewer);
document.querySelector('#previous').addEventListener('click',()=>move(-1));
document.querySelector('#next').addEventListener('click',()=>move(1));
viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer()});
document.addEventListener('keydown',event=>{if(!viewer.open)return;if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1)});
render();
