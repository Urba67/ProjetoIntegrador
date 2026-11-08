/*
 * SCRIPT GERAL DO NEXO
 * Este arquivo reúne as interações usadas nas páginas do site:
 * menu, tema, tamanho do texto, formulário de estudos e quiz.
 * Cada parte só é ativada quando encontra os elementos correspondentes na página.
 */
(function () {
  "use strict";

  // Elementos compartilhados pelo cabeçalho das páginas.
  var body = document.body;
  var menuToggle = document.getElementById("menu-toggle");
  var mainNav = document.getElementById("main-nav");
  var themeToggle = document.getElementById("theme-toggle");
  var textToggle = document.getElementById("text-toggle");

  // ============================================================
  // MENU DE NAVEGAÇÃO — páginas que têm #menu-toggle e #main-nav
  // ============================================================
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      // Alterna a classe que abre ou fecha o menu em telas menores.
      var open = mainNav.classList.toggle("aberto");
      menuToggle.textContent = open ? "×" : "☰";
    });

    // Ao escolher uma página, fecha o menu móvel.
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("aberto");
      });
    });
  }

  // ============================================================
  // TEMA CLARO/ESCURO — páginas que têm #theme-toggle
  // ============================================================
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      // A classe no body permite que o CSS troque as cores do site.
      body.classList.toggle("tema-escuro");
      var dark = body.classList.contains("tema-escuro");
      themeToggle.textContent = dark ? "☀" : "☾";

      // Guarda a escolha neste navegador para manter o tema entre páginas.
      localStorage.setItem("nexo-theme", dark ? "dark" : "light");
    });

    // Restaura o tema escolhido anteriormente, se houver um salvo.
    if (localStorage.getItem("nexo-theme") === "dark") {
      body.classList.add("tema-escuro");
      themeToggle.textContent = "☀";
    }
  }

  // ============================================================
  // ACESSIBILIDADE: AUMENTAR/REDUZIR TEXTO — páginas com #text-toggle
  // ============================================================
  function applyTextScale(scale) {
    // O botão alterna entre o tamanho normal e um aumento de 10%.
    scale = scale > 1 ? 1.1 : 1;

    document.querySelectorAll("body *").forEach(function (element) {
      // Guarda o tamanho original uma vez para não ampliar em cascata.
      if (!element.dataset.nexoBaseFontSize) {
        element.dataset.nexoBaseFontSize = window.getComputedStyle(element).fontSize;
      }

      var baseSize = parseFloat(element.dataset.nexoBaseFontSize);
      if (isFinite(baseSize)) {
        element.style.fontSize = (baseSize * scale).toFixed(2) + "px";
      }
    });

    body.dataset.textScale = String(scale);
    localStorage.setItem("nexo-text-scale", String(scale));

    // Atualiza o símbolo e a descrição acessível do botão.
    if (textToggle) {
      var isLarge = scale > 1;
      textToggle.textContent = isLarge ? "A−" : "A+";
      textToggle.setAttribute(
        "aria-label",
        isLarge ? "Diminuir tamanho da fonte" : "Aumentar tamanho da fonte"
      );
      textToggle.title = isLarge ? "Diminuir fonte" : "Aumentar fonte";
    }
  }

  // Recupera o tamanho salvo e configura o botão, quando existir na página.
  var savedTextScale = parseFloat(localStorage.getItem("nexo-text-scale"));
  if (!isFinite(savedTextScale) || savedTextScale < 1) savedTextScale = 1;

  if (textToggle) {
    applyTextScale(savedTextScale);
    textToggle.addEventListener("click", function () {
      var currentScale = parseFloat(body.dataset.textScale);
      applyTextScale(currentScale > 1 ? 1 : 1.1);
    });
  }

  // ============================================================
  // FORMULÁRIO DE PLANO DE ESTUDOS — formulario.html
  // Este bloco só roda quando encontra o formulário #feedback-form.
  // ============================================================
  var feedbackForm = document.getElementById("feedback-form");

  if (feedbackForm) {
    var formStatus = document.getElementById("form-status");
    var planResult = document.getElementById("plan-result");

    feedbackForm.addEventListener("submit", function (event) {
      // Impede o envio tradicional: o plano será montado nesta página.
      event.preventDefault();

      // Lê os valores preenchidos no formulário.
      var name = document.getElementById("student-name").value.trim();
      var subject = document.getElementById("subject").value.trim();
      var examDate = document.getElementById("exam-date").value;
      var confidence = document.getElementById("confidence").value;

      // Aceita tópicos separados por vírgula ou por quebra de linha.
      var topics = document
        .getElementById("topics")
        .value.split(/[,\n]/)
        .map(function (topic) { return topic.trim(); })
        .filter(Boolean);

      // Calcula quantos dias faltam; limita o roteiro entre 1 e 30 dias.
      var today = new Date();
      var deadline = new Date(examDate + "T12:00:00");
      var days = Math.ceil((deadline - today) / 86400000);
      if (!isFinite(days) || days < 1) days = 1;
      if (days > 30) days = 30;

      // Escolhe uma orientação conforme o nível de confiança informado.
      var focus = confidence === "low"
        ? "construir a base e pedir explicações simples"
        : confidence === "medium"
          ? "alternar explicações, exemplos e prática"
          : "produzir, revisar e retomar seus pontos de dúvida";

      // Se a lista estiver vazia, usa um texto genérico como alternativa.
      var topicList = topics.length ? topics : ["os tópicos da atividade"];
      var greeting = name ? escapeHtml(name) + ", seu" : "Seu";

      formStatus.textContent = "Plano criado no seu navegador.";
      formStatus.classList.add("visivel");

      // O texto do plano é um modelo pronto preenchido com as respostas.
      // Não é uma resposta gerada por IA e não é enviado para um servidor.
      planResult.innerHTML =
        '<div class="cartao-plano">' +
          '<p class="rotulo">ROTEIRO DE ' + days + " " + (days === 1 ? "DIA" : "DIAS") + "</p>" +
          "<h3>" + greeting + " plano para " + escapeHtml(subject) + "</h3>" +
          "<p>Foco recomendado: " + focus +
            ". Em cada sessão, use a IA para apoiar uma atividade, faça sua própria tentativa e confira o resultado com o material da aula.</p>" +
          "<ol>" +
            "<li><strong>Entender:</strong> liste o que já sabe e o que precisa compreender.</li>" +
            "<li><strong>Criar:</strong> produza uma resposta, rascunho ou apresentação sobre: " +
              topicList.map(escapeHtml).join(", ") + ".</li>" +
            "<li><strong>Retomar:</strong> registre as dúvidas e converse com o professor antes de finalizar.</li>" +
          "</ol>" +
          '<p class="proximo-plano"><strong>Próximo passo:</strong> comece hoje por 25 minutos e termine explicando um tópico com suas próprias palavras.</p>' +
        "</div>";

      // Mantém o tamanho de texto escolhido e mostra o plano recém-criado.
      applyTextScale(parseFloat(body.dataset.textScale));
      planResult.classList.add("visivel");
      planResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  // Transforma caracteres especiais em texto seguro antes de inserir valores
  // digitados pela pessoa dentro do HTML do plano ou do quiz.
  function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[character];
    });
  }

  // ============================================================
  // QUIZ — quiz.html
  // Se a página atual não tiver #quiz-card, encerra aqui.
  // As partes anteriores (menu, tema, texto e formulário) já foram tratadas.
  // ============================================================
  var quizCard = document.getElementById("quiz-card");
  if (!quizCard) return;

  var progressBar = document.getElementById("quiz-progress-bar");
  var counter = document.getElementById("quiz-counter");
  var current = 0; // Índice da pergunta que está sendo exibida.
  var score = 0; // Quantidade de respostas corretas.
  var selected = null; // Evita responder à mesma pergunta mais de uma vez.

  // Cada pergunta tem alternativas, o índice da correta e uma explicação.
  // Os índices começam em zero: 0 é a primeira alternativa, 1 a segunda etc.
  var questions = [
    {
      question: "Você vai começar uma atividade escolar. Qual é o melhor primeiro passo?",
      options: [
        "Pesquisar o tema e separar algumas fontes para consultar.",
        "Definir o que a atividade pede e o que você já compreendeu.",
        "Escrever um rascunho e pedir à IA para completar as lacunas."
      ],
      answer: 1,
      explanation: "Entender o objetivo e reconhecer o que você já sabe ajuda a escolher como a IA pode apoiar a atividade."
    },
    {
      question: "Qual pedido ajuda a manter sua autoria no trabalho?",
      options: [
        "Escrever sua primeira versão e pedir sugestões para melhorá-la.",
        "Pedir um texto completo e trocar algumas palavras antes de entregar.",
        "Solicitar argumentos prontos e escolher os mais convincentes."
      ],
      answer: 0,
      explanation: "Partir das próprias ideias e usar a IA para receber sugestões mantém você como autor do trabalho."
    },
    {
      question: "Você recebeu uma explicação convincente sobre um conceito. O que fazer?",
      options: [
        "Conferir se a explicação combina com respostas anteriores da IA.",
        "Comparar o conceito com o material da aula ou uma fonte confiável.",
        "Pesquisar a mesma frase e confiar se ela aparecer em vários sites."
      ],
      answer: 1,
      explanation: "A IA pode errar ou inventar dados. Compare a explicação com o material da aula e fontes confiáveis."
    },
    {
      question: "Qual atitude ajuda a lembrar do conteúdo por mais tempo?",
      options: [
        "Reler o capítulo na véspera e destacar os trechos importantes.",
        "Revisar em dias diferentes, tentando lembrar antes de consultar.",
        "Refazer as questões que acertou para fixar o conteúdo."
      ],
      answer: 1,
      explanation: "Tentar recuperar a informação e revisar em dias diferentes ajuda a fortalecer a memória e perceber dúvidas."
    },
    {
      question: "Como terminar uma atividade feita com apoio de IA?",
      options: [
        "Conferir as fontes e reescrever a resposta com suas palavras.",
        "Revisar o texto gerado e entregar depois de corrigir a gramática.",
        "Comparar com outra resposta da IA e entregar a mais convincente."
      ],
      answer: 0,
      explanation: "Confira as informações, certifique-se de que entendeu o conteúdo e procure o professor se ainda tiver dúvidas."
    }
  ];

  // Mostra a pergunta atual, atualiza o progresso e ativa os botões.
  function renderQuiz() {
    var item = questions[current];
    selected = null;
    counter.textContent = "Pergunta " + (current + 1) + " de " + questions.length;
    progressBar.style.width = ((current / questions.length) * 100) + "%";

    quizCard.innerHTML =
      '<p class="pergunta-quiz">' + item.question + "</p>" +
      '<div class="opcoes-quiz">' +
        item.options.map(function (option, index) {
          var letter = String.fromCharCode(65 + index); // 0 vira A, 1 vira B, 2 vira C.
          return '<button class="opcao-quiz" data-index="' + index + '"><span>' + letter + "</span>" + option + "</button>";
        }).join("") +
      "</div>";

    applyTextScale(parseFloat(body.dataset.textScale));

    quizCard.querySelectorAll(".opcao-quiz").forEach(function (button) {
      button.addEventListener("click", function () {
        chooseAnswer(Number(button.dataset.index));
      });
    });
  }

  // Marca a alternativa correta, atualiza a pontuação e exibe a explicação.
  function chooseAnswer(index) {
    if (selected !== null) return; // Impede múltiplos cliques na mesma pergunta.

    selected = index;
    var item = questions[current];
    var buttons = quizCard.querySelectorAll(".opcao-quiz");
    buttons[item.answer].classList.add("correta");

    if (index !== item.answer) {
      buttons[index].classList.add("errada");
    } else {
      score += 1;
    }

    var feedback = document.createElement("div");
    feedback.className = "feedback-quiz";
    feedback.innerHTML =
      "<strong>" + (index === item.answer ? "Boa escolha." : "Vale rever.") + "</strong>" +
      "<span>" + item.explanation + "</span>" +
      '<button class="link-texto link-claro" id="next-question">' +
        (current === questions.length - 1 ? "Ver resultado" : "Próxima pergunta") + " ›</button>";
    quizCard.appendChild(feedback);

    // Avança para a pergunta seguinte ou mostra o resultado final.
    document.getElementById("next-question").addEventListener("click", function () {
      if (current === questions.length - 1) {
        showResult();
      } else {
        current += 1;
        renderQuiz();
      }
    });
  }

  // Mostra a pontuação e oferece a opção de reiniciar o quiz.
  function showResult() {
    progressBar.style.width = "100%";
    counter.textContent = "Quiz concluído";
    quizCard.innerHTML =
      '<div class="resultado-quiz">' +
        '<p class="rotulo">Seu resultado</p>' +
        "<h3>" + score + " de " + questions.length + " respostas conscientes</h3>" +
        "<p>" + (score === questions.length
          ? "Você já está praticando um uso bastante responsável da IA."
          : "Você já tem bons caminhos. Continue comparando informações e cuidando da sua autoria.") + "</p>" +
        '<button class="botao botao-claro" id="restart-quiz">Refazer o quiz</button>' +
      "</div>";

    document.getElementById("restart-quiz").addEventListener("click", function () {
      current = 0;
      score = 0;
      renderQuiz();
    });
  }

  // Ao abrir quiz.html, começa mostrando a primeira pergunta.
  renderQuiz();
}());

