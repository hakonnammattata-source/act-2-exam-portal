const startPanel = document.getElementById('startPanel');
const examPanel = document.getElementById('examPanel');
const resultPanel = document.getElementById('resultPanel');
const examForm = document.getElementById('examForm');
const timerEl = document.getElementById('timer');
const answeredCount = document.getElementById('answeredCount');
let secondsLeft = 60 * 60;
let timerId = null;
let startedAt = null;
let submitted = false;

function renderQuestions(){
  examForm.innerHTML = EXAM.questions.map((q, i) => `
    <article class="question" id="q${q.id}">
      <h3>${q.id}. ${q.prompt}</h3>
      ${q.graph || ''}
      <div>${q.options.map((o, oi) => `
        <label class="option"><input type="radio" name="q${q.id}" value="${oi}"> <strong>${o.label}.</strong> ${o.text}</label>
      `).join('')}</div>
    </article>
  `).join('');
  examForm.addEventListener('change', () => {
    const count = EXAM.questions.filter(q => examForm.querySelector(`input[name=q${q.id}]:checked`)).length;
    answeredCount.textContent = count;
  });
}

function updateTimer(){
  const m = Math.floor(secondsLeft/60).toString().padStart(2,'0');
  const s = (secondsLeft%60).toString().padStart(2,'0');
  timerEl.textContent = `${m}:${s}`;
  if(secondsLeft <= 300) timerEl.style.background = '#fef3f2';
  if(secondsLeft <= 0){ submitExam(false); return; }
  secondsLeft--;
}

function startExam(){
  const name = document.getElementById('studentName').value.trim();
  if(!name){ alert('Please enter the student name.'); return; }
  startPanel.classList.add('hidden');
  examPanel.classList.remove('hidden');
  startedAt = Date.now();
  renderQuestions();
  updateTimer();
  timerId = setInterval(updateTimer, 1000);
  window.scrollTo({top:0, behavior:'smooth'});
}

async function submitExam(early=true){
  if(submitted) return;
  if(early && !confirm('Submit the exam now? You will not be able to change answers afterward.')) return;
  submitted = true;
  clearInterval(timerId);
  const results = EXAM.questions.map(q => {
    const chosen = examForm.querySelector(`input[name=q${q.id}]:checked`);
    const selected = chosen ? Number(chosen.value) : null;
    return {
      number:q.id,
      correct:selected === q.answer,
      selected,
      selectedText:selected === null ? '' : `${q.options[selected].label}. ${q.options[selected].text.replace(/<[^>]+>/g,'')}`,
      correctText:`${q.options[q.answer].label}. ${q.options[q.answer].text.replace(/<[^>]+>/g,'')}`,
      prompt:q.prompt.replace(/<[^>]+>/g,'')
    };
  });
  const score = results.filter(r => r.correct).length;
  const elapsedSeconds = Math.round((Date.now()-startedAt)/1000);
  const elapsed = `${Math.floor(elapsedSeconds/60)}m ${elapsedSeconds%60}s`;

  examPanel.classList.add('hidden');
  resultPanel.classList.remove('hidden');
  document.getElementById('scoreBox').textContent = `Score: ${score}/50 (${Math.round(score/50*100)}%) · Time used: ${elapsed}`;
  document.getElementById('review').innerHTML = results.map((r, idx) => `
    <div class="review-item ${r.correct?'correct':'wrong'}">
      <strong>Question ${r.number}: ${r.correct?'Correct':'Wrong'}</strong>
      <p>${EXAM.questions[idx].prompt}</p>
      <p><strong>Your answer:</strong> ${r.selectedText || 'No answer'}</p>
      <p><strong>Correct answer:</strong> ${r.correctText}</p>
      <p><strong>Explanation:</strong> ${EXAM.questions[idx].explanation}</p>
    </div>
  `).join('');

  const payload = {
    examTitle:EXAM.title, score, total:50, results, elapsed,
    submittedEarly: early,
    student:{
      name:document.getElementById('studentName').value.trim(),
      email:document.getElementById('studentEmail').value.trim(),
      phone:document.getElementById('studentPhone').value.trim()
    }
  };
  try{
    const response = await fetch('/api/submit', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const data = await response.json();
    document.getElementById('emailStatus').textContent = data.message;
  }catch(e){
    document.getElementById('emailStatus').textContent = 'The review is saved on screen, but the email service could not be reached.';
  }
  window.scrollTo({top:0, behavior:'smooth'});
}

document.getElementById('startBtn').addEventListener('click', startExam);
document.getElementById('submitBtn').addEventListener('click', () => submitExam(true));
