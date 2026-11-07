export type Locale = "pt" | "en" | "es";
export const messages = {
  pt: {
    navHome: "Início", navTeam: "Equipa", navMatches: "Jogos", navNews: "Notícias", navRecruit: "Recrutamento",
    signIn: "Entrar", hub: "Tactical Hub", admin: "Gestão", heroEyebrow: "ORGANIZAÇÃO COMPETITIVA DE VALORANT",
    heroLine1: "BUILT IN", heroLine2: "SILENCE.", heroLine3: "READY TO STRIKE.",
    heroText: "Disciplina. Leitura. Execução. A NOXVANTA compete com propósito.",
    viewTeam: "Conhecer a equipa", enterHub: "Entrar no Tactical Hub", latestResults: "Últimos resultados",
    nextMatch: "Próximo jogo", latestNews: "Últimas notícias", roster: "Plantel principal", substitutes: "Suplentes",
    schedule: "Calendário", results: "Resultados", apply: "Candidatar-me", recruitTitle: "O próximo capítulo pode ser teu.",
    loginTitle: "Área reservada", email: "Email", password: "Palavra-passe", login: "Iniciar sessão",
    forgot: "Recuperar palavra-passe", logout: "Terminar sessão", dashboard: "Área da equipa",
    tactics: "Estratégias", internal: "Informação interna", calendar: "Calendário interno", announcements: "Comunicados",
    noData: "Ainda não existem dados publicados.", demo: "CONTEÚDO DE DEMONSTRAÇÃO", footer: "A competir com intenção."
  },
  en: {
    navHome: "Home", navTeam: "Team", navMatches: "Matches", navNews: "News", navRecruit: "Recruitment",
    signIn: "Sign in", hub: "Tactical Hub", admin: "Management", heroEyebrow: "COMPETITIVE VALORANT ORGANIZATION",
    heroLine1: "BUILT IN", heroLine2: "SILENCE.", heroLine3: "READY TO STRIKE.",
    heroText: "Discipline. Awareness. Execution. NOXVANTA competes with purpose.",
    viewTeam: "Meet the team", enterHub: "Enter Tactical Hub", latestResults: "Latest results",
    nextMatch: "Next match", latestNews: "Latest news", roster: "Main roster", substitutes: "Substitutes",
    schedule: "Schedule", results: "Results", apply: "Apply now", recruitTitle: "The next chapter could be yours.",
    loginTitle: "Restricted area", email: "Email", password: "Password", login: "Sign in",
    forgot: "Reset password", logout: "Sign out", dashboard: "Team area",
    tactics: "Strategies", internal: "Internal information", calendar: "Internal calendar", announcements: "Announcements",
    noData: "Nothing published yet.", demo: "DEMO CONTENT", footer: "Competing with intent."
  },
  es: {
    navHome: "Inicio", navTeam: "Equipo", navMatches: "Partidos", navNews: "Noticias", navRecruit: "Reclutamiento",
    signIn: "Acceder", hub: "Tactical Hub", admin: "Gestión", heroEyebrow: "ORGANIZACIÓN COMPETITIVA DE VALORANT",
    heroLine1: "BUILT IN", heroLine2: "SILENCE.", heroLine3: "READY TO STRIKE.",
    heroText: "Disciplina. Lectura. Ejecución. NOXVANTA compite con propósito.",
    viewTeam: "Conocer al equipo", enterHub: "Entrar en Tactical Hub", latestResults: "Últimos resultados",
    nextMatch: "Próximo partido", latestNews: "Últimas noticias", roster: "Plantilla principal", substitutes: "Suplentes",
    schedule: "Calendario", results: "Resultados", apply: "Solicitar plaza", recruitTitle: "El próximo capítulo puede ser tuyo.",
    loginTitle: "Área privada", email: "Correo electrónico", password: "Contraseña", login: "Iniciar sesión",
    forgot: "Recuperar contraseña", logout: "Cerrar sesión", dashboard: "Área del equipo",
    tactics: "Estrategias", internal: "Información interna", calendar: "Calendario interno", announcements: "Comunicados",
    noData: "Todavía no hay contenido publicado.", demo: "CONTENIDO DE DEMOSTRACIÓN", footer: "Competir con intención."
  }
} as const;
export type MessageKey = keyof typeof messages.pt;
