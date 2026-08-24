const STORAGE_KEY = 'daymark-goals';
let goals = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let currentView = 'all';

const $ = (selector) => document.querySelector(selector);
const goalInput = $('#goalInput');
const dateInput = $('#dateInput');
const priorityInput = $('#priorityInput');
const taskList = $('#taskList');

dateInput.value = new Date().toISOString().slice(0, 10);
$('#dateLine').textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); render(); }
function formatDate(date) { if (!date) return 'No due date'; return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
function isToday(date) { return date === new Date().toISOString().slice(0, 10); }
function isUpcoming(date) { return date && date > new Date().toISOString().slice(0, 10); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }

function addGoal() {
	const title = goalInput.value.trim();
	if (!title) { goalInput.focus(); showToast('Give your goal a name first'); return; }
	goals.unshift({ id: Date.now(), title, priority: priorityInput.value, due: dateInput.value, completed: false });
	goalInput.value = ''; save(); showToast('Goal added');
}

function filteredGoals() {
	const search = $('#searchInput').value.trim().toLowerCase();
	let visible = goals.filter((goal) => goal.title.toLowerCase().includes(search));
	if (currentView === 'today') visible = visible.filter((goal) => !goal.completed && isToday(goal.due));
	if (currentView === 'upcoming') visible = visible.filter((goal) => !goal.completed && isUpcoming(goal.due));
	if (currentView === 'completed') visible = visible.filter((goal) => goal.completed);
	const sort = $('#sortInput').value;
	return visible.sort((a, b) => sort === 'priority' ? ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) : sort === 'date' ? (a.due || '9999').localeCompare(b.due || '9999') : b.id - a.id);
}

function render() {
	const visible = filteredGoals();
	taskList.innerHTML = visible.map((goal) => `<article class="task-card"><button class="check ${goal.completed ? 'done' : ''}" data-action="toggle" data-id="${goal.id}" aria-label="${goal.completed ? 'Mark incomplete' : 'Mark complete'}">${goal.completed ? '✓' : ''}</button><div class="task-copy ${goal.completed ? 'done' : ''}"><div class="task-title">${escapeHtml(goal.title)}</div><div class="task-meta"><span class="priority ${goal.priority}">${goal.priority} priority</span><span class="due ${goal.due && goal.due < new Date().toISOString().slice(0, 10) && !goal.completed ? 'overdue' : ''}">${formatDate(goal.due)}</span></div></div><button class="delete-button" data-action="delete" data-id="${goal.id}" aria-label="Delete goal">×</button></article>`).join('');
	$('#emptyState').style.display = visible.length ? 'none' : 'block';
	const completed = goals.filter((goal) => goal.completed).length;
	$('#allCount').textContent = goals.filter((goal) => !goal.completed).length; $('#todayCount').textContent = goals.filter((goal) => !goal.completed && isToday(goal.due)).length; $('#upcomingCount').textContent = goals.filter((goal) => !goal.completed && isUpcoming(goal.due)).length; $('#completedCount').textContent = completed;
	const percent = goals.length ? Math.round((completed / goals.length) * 100) : 0; $('#progressPercent').textContent = `${percent}%`; $('.progress-ring').style.background = `conic-gradient(var(--coral) ${percent * 3.6}deg, #e8e9e2 0deg)`;
	$('#viewTitle').textContent = { all: 'All goals', today: 'Today', upcoming: 'Upcoming', completed: 'Completed' }[currentView]; $('#taskSummary').textContent = visible.length ? `${visible.length} goal${visible.length === 1 ? '' : 's'} in view` : 'Your goals, all in one place.';
}
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }

$('#addGoal').addEventListener('click', addGoal); goalInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') addGoal(); }); $('#searchInput').addEventListener('input', render); $('#sortInput').addEventListener('change', render);
document.querySelector('.nav-list').addEventListener('click', (event) => { const button = event.target.closest('[data-view]'); if (!button) return; currentView = button.dataset.view; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button)); render(); });
taskList.addEventListener('click', (event) => { const button = event.target.closest('[data-action]'); if (!button) return; const id = Number(button.dataset.id); const goal = goals.find((item) => item.id === id); if (button.dataset.action === 'toggle') { goal.completed = !goal.completed; showToast(goal.completed ? 'Nice work, goal complete' : 'Goal reopened'); } else { goals = goals.filter((item) => item.id !== id); showToast('Goal deleted'); } save(); });
$('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('warm-mode'); document.body.style.setProperty('--paper', document.body.classList.contains('warm-mode') ? '#f9f2e8' : '#f7f7f3'); });
render();
