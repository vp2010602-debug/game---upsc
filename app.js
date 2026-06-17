/* Today Paper Crorepati - clean GitHub Pages version */
(function(){
  "use strict";

  const QUESTIONS = Array.isArray(window.CROREPATI_QUESTIONS) ? window.CROREPATI_QUESTIONS : [];
  const QUESTIONS_PER_GAME = 15;
  const TIMER_SECONDS = 45;
  const USED_KEY = "today_paper_crorepati_used_question_ids_v1";
  const LETTERS = ["A", "B", "C", "D"];
  const PRIZES = [
    "₹1,000", "₹2,000", "₹3,000", "₹5,000", "₹10,000",
    "₹20,000", "₹40,000", "₹80,000", "₹1.6 lakh", "₹3.2 lakh",
    "₹6.4 lakh", "₹12.5 lakh", "₹25 lakh", "₹50 lakh", "₹1 crore"
  ];

  let roundQuestions = [];
  let currentIndex = 0;
  let secondsLeft = TIMER_SECONDS;
  let timerId = null;
  let locked = false;
  let lifelines = { fifty:false, poll:false, flip:false, hint:false };

  const $ = (id) => document.getElementById(id);

  function showScreen(id){
    ["homeScreen", "gameScreen", "resultScreen"].forEach(screenId => $(screenId).classList.remove("active"));
    $(id).classList.add("active");
  }

  function shuffle(items){
    const copy = [...items];
    for(let i = copy.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function difficultyRank(q){
    if(q.difficulty === "Easy") return 1;
    if(q.difficulty === "Hard") return 3;
    return 2;
  }

  function getUsedSet(){
    try { return new Set(JSON.parse(localStorage.getItem(USED_KEY) || "[]")); }
    catch { return new Set(); }
  }

  function saveUsedSet(set){
    try { localStorage.setItem(USED_KEY, JSON.stringify([...set])); }
    catch {}
  }

  function markQuestionUsed(question){
    const used = getUsedSet();
    used.add(question.id);
    saveUsedSet(used);
  }

  function makeRound(){
    let used = getUsedSet();
    let pool = QUESTIONS.filter(q => !used.has(q.id));

    if(pool.length < QUESTIONS_PER_GAME){
      used = new Set();
      saveUsedSet(used);
      pool = [...QUESTIONS];
    }

    const easy = shuffle(pool.filter(q => q.difficulty === "Easy")).slice(0, 5);
    const medium = shuffle(pool.filter(q => q.difficulty === "Medium")).slice(0, 6);
    const hard = shuffle(pool.filter(q => q.difficulty === "Hard")).slice(0, 4);
    let selected = [...easy, ...medium, ...hard];

    if(selected.length < QUESTIONS_PER_GAME){
      const selectedIds = new Set(selected.map(q => q.id));
      selected = selected.concat(shuffle(pool.filter(q => !selectedIds.has(q.id))).slice(0, QUESTIONS_PER_GAME - selected.length));
    }

    return selected.sort((a,b) => difficultyRank(a) - difficultyRank(b)).slice(0, QUESTIONS_PER_GAME);
  }

  function buildPrizeLadder(){
    $("prizeLadder").innerHTML = PRIZES.map((amount, i) => {
      const current = i === currentIndex ? " current" : "";
      const safe = [4, 9, 14].includes(i) ? " safe" : "";
      return `<div class="ladder-step${current}${safe}"><span>${i + 1}</span><b>${amount}</b></div>`;
    }).join("");
  }

  function startTimer(){
    clearInterval(timerId);
    secondsLeft = TIMER_SECONDS;
    $("timer").textContent = secondsLeft;
    $("timer").parentElement.classList.remove("low");

    timerId = setInterval(() => {
      secondsLeft -= 1;
      $("timer").textContent = secondsLeft;
      if(secondsLeft <= 10) $("timer").parentElement.classList.add("low");
      if(secondsLeft <= 0){
        clearInterval(timerId);
        finishGame(false, "Time Up!");
      }
    }, 1000);
  }

  function renderQuestion(){
    locked = false;
    const q = roundQuestions[currentIndex];
    if(!q){ finishGame(false, "Question Error"); return; }

    markQuestionUsed(q);
    startTimer();
    buildPrizeLadder();

    $("questionNumber").textContent = `${currentIndex + 1} / ${QUESTIONS_PER_GAME}`;
    $("currentPrize").textContent = PRIZES[currentIndex];
    $("categoryTag").textContent = q.category || "Current Affairs";
    $("difficultyTag").textContent = q.difficulty || "Medium";
    $("sourceTag").textContent = q.source || "Paper";
    $("questionText").textContent = q.question;
    $("hostMessage").innerHTML = "Choose the correct answer. Think like UPSC current affairs revision.";

    $("optionsBox").innerHTML = q.options.map((option, index) => `
      <button class="option-btn" type="button" data-index="${index}">
        <span class="option-letter">${LETTERS[index]}</span>
        <span>${escapeHtml(option)}</span>
      </button>
    `).join("");

    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.addEventListener("click", () => checkAnswer(Number(btn.dataset.index)));
    });
  }

  function escapeHtml(value){
    return String(value).replace(/[&<>"']/g, char => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[char]));
  }

  function checkAnswer(choice){
    if(locked) return;
    locked = true;
    clearInterval(timerId);

    const q = roundQuestions[currentIndex];
    const chosenBtn = document.querySelector(`.option-btn[data-index="${choice}"]`);
    const correctBtn = document.querySelector(`.option-btn[data-index="${q.answerIndex}"]`);
    document.querySelectorAll(".option-btn").forEach(btn => btn.disabled = true);

    if(choice === q.answerIndex){
      chosenBtn.classList.add("correct");
      $("hostMessage").innerHTML = `✅ Correct!<br><br>${escapeHtml(q.explanation || "Good answer.")}`;
      setTimeout(() => {
        if(currentIndex === QUESTIONS_PER_GAME - 1){
          finishGame(true, "Crorepati Winner!");
        } else {
          currentIndex += 1;
          renderQuestion();
        }
      }, 1500);
    } else {
      chosenBtn.classList.add("wrong");
      correctBtn.classList.add("correct");
      $("hostMessage").innerHTML = `❌ Wrong.<br>Correct answer: <b>${escapeHtml(q.options[q.answerIndex])}</b><br><br>${escapeHtml(q.explanation || "")}`;
      setTimeout(() => finishGame(false, "Game Over"), 2300);
    }
  }

  function safePrize(){
    if(currentIndex >= 10) return PRIZES[9];
    if(currentIndex >= 5) return PRIZES[4];
    return "₹0";
  }

  function finishGame(won, title){
    clearInterval(timerId);
    showScreen("resultScreen");
    $("resultEmoji").textContent = won ? "🏆" : "🎙️";
    $("resultTitle").textContent = title;
    $("resultText").textContent = won
      ? `Super! You answered all ${QUESTIONS_PER_GAME} questions and won ${PRIZES[14]}.`
      : `You reached Question ${currentIndex + 1}. Safe prize: ${safePrize()}. Play again for a fresh set.`;
  }

  function startGame(){
    if(QUESTIONS.length < 4){
      $("loadWarning").classList.remove("hidden");
      return;
    }
    roundQuestions = makeRound();
    currentIndex = 0;
    lifelines = { fifty:false, poll:false, flip:false, hint:false };
    ["life5050", "lifePoll", "lifeFlip", "lifeHint"].forEach(id => $(id).disabled = false);
    showScreen("gameScreen");
    renderQuestion();
  }

  function use5050(){
    if(lifelines.fifty || locked) return;
    lifelines.fifty = true;
    $("life5050").disabled = true;
    const q = roundQuestions[currentIndex];
    const wrongIndexes = shuffle([0,1,2,3].filter(i => i !== q.answerIndex)).slice(0,2);
    wrongIndexes.forEach(index => {
      const btn = document.querySelector(`.option-btn[data-index="${index}"]`);
      if(btn) btn.classList.add("removed");
    });
    $("hostMessage").textContent = "50:50 used. Two wrong answers removed.";
  }

  function usePoll(){
    if(lifelines.poll || locked) return;
    lifelines.poll = true;
    $("lifePoll").disabled = true;
    const q = roundQuestions[currentIndex];
    let percentages = [8, 12, 14, 18];
    percentages[q.answerIndex] = 52 + Math.floor(Math.random() * 24);
    const total = percentages.reduce((sum, n) => sum + n, 0);
    percentages = percentages.map(n => Math.round(n * 100 / total));
    $("hostMessage").innerHTML = "Audience Poll:<br>" + LETTERS.map((letter, i) => `${letter}: <b>${percentages[i]}%</b>`).join(" • ");
  }

  function useHint(){
    if(lifelines.hint || locked) return;
    lifelines.hint = true;
    $("lifeHint").disabled = true;
    const q = roundQuestions[currentIndex];
    $("hostMessage").innerHTML = `Hint: This is from <b>${escapeHtml(q.source)}</b>. Topic: <b>${escapeHtml(q.category)}</b>.`;
  }

  function useFlip(){
    if(lifelines.flip || locked) return;
    lifelines.flip = true;
    $("lifeFlip").disabled = true;
    const currentIds = new Set(roundQuestions.map(q => q.id));
    const oldRank = difficultyRank(roundQuestions[currentIndex]);
    let candidates = QUESTIONS.filter(q => !currentIds.has(q.id) && difficultyRank(q) >= oldRank);
    if(candidates.length === 0) candidates = QUESTIONS.filter(q => !currentIds.has(q.id));
    const replacement = shuffle(candidates)[0];
    if(replacement){
      roundQuestions[currentIndex] = replacement;
      renderQuestion();
      $("hostMessage").textContent = "Question flipped. New question loaded.";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("totalQuestions").textContent = QUESTIONS.length;
    $("startBtn").addEventListener("click", startGame);
    $("playAgainBtn").addEventListener("click", startGame);
    $("goHomeBtn").addEventListener("click", () => showScreen("homeScreen"));
    $("rulesBtn").addEventListener("click", () => $("rulesBox").classList.toggle("hidden"));
    $("resetUsedBtn").addEventListener("click", () => {
      localStorage.removeItem(USED_KEY);
      alert("Question memory reset. Now the game can use all questions again.");
    });
    $("life5050").addEventListener("click", use5050);
    $("lifePoll").addEventListener("click", usePoll);
    $("lifeFlip").addEventListener("click", useFlip);
    $("lifeHint").addEventListener("click", useHint);

    if(QUESTIONS.length === 0){
      $("loadWarning").classList.remove("hidden");
    }
  });
})();
