// Paleta consistente para níveis de Bloom — usada em todas as telas (Analisar, Relatório, Badges)
export const BLOOM_COLORS: Record<number, string> = {
  1: "#3B82F6", // Lembrar — azul
  2: "#10B981", // Compreender — verde
  3: "#F59E0B", // Aplicar — amarelo
  4: "#F97316", // Analisar — laranja
  5: "#EC4899", // Avaliar — rosa
  6: "#8B5CF6", // Criar — roxo
  0: "#9CA3AF",
};

// Versão clara/pastel para fundos (cards, badges)
export const BLOOM_COLORS_LIGHT: Record<number, string> = {
  1: "#DBEAFE", // azul claro
  2: "#D1FAE5", // verde claro
  3: "#FEF3C7", // amarelo claro
  4: "#FED7AA", // laranja claro
  5: "#FCE7F3", // rosa claro
  6: "#EDE9FE", // roxo claro
  0: "#F3F4F6",
};

export const BLOOM_NAMES: Record<number, string> = {
  1: "Lembrar",
  2: "Compreender",
  3: "Aplicar",
  4: "Analisar",
  5: "Avaliar",
  6: "Criar",
  0: "—",
};

export const YEAR_GROUPS: Array<{ label: string; options: string[] }> = [
  {
    label: "Ensino Fundamental",
    options: [
      "1º ano EF", "2º ano EF", "3º ano EF", "4º ano EF", "5º ano EF",
      "6º ano EF", "7º ano EF", "8º ano EF", "9º ano EF",
    ],
  },
  {
    label: "Ensino Médio",
    options: ["1º ano EM", "2º ano EM", "3º ano EM", "Técnico integrado"],
  },
  {
    label: "Graduação",
    options: [
      "1º semestre (Graduação)", "2º semestre (Graduação)",
      "3º semestre (Graduação)", "4º semestre (Graduação)",
      "5º semestre (Graduação)", "6º semestre (Graduação)",
      "7º semestre (Graduação)", "8º semestre (Graduação)",
      "9º semestre (Graduação)", "10º semestre (Graduação)",
      "Graduação (outro)",
    ],
  },
  {
    label: "Pós-graduação",
    options: ["Especialização", "Mestrado", "Doutorado"],
  },
  {
    label: "Téc. Desenvolvimento de Sistemas (ETEC)",
    options: ["1º Módulo - DSE", "2º Módulo - DSE", "3º Módulo - DSE"],
  },
  {
    label: "Téc. Administração (ETEC)",
    options: ["1º Módulo - Administração", "2º Módulo - Administração", "3º Módulo - Administração"],
  },
  {
    label: "Téc. Logística (ETEC)",
    options: ["1º Módulo - Logística", "2º Módulo - Logística", "3º Módulo - Logística"],
  },
  {
    label: "Téc. Informática para Internet (ETEC)",
    options: ["1º Módulo - Inf. Internet", "2º Módulo - Inf. Internet", "3º Módulo - Inf. Internet"],
  },
  {
    label: "Téc. Finanças (ETEC)",
    options: ["1º Módulo - Finanças", "2º Módulo - Finanças", "3º Módulo - Finanças"],
  },
  {
    label: "Outros",
    options: ["Curso livre", "Concurso", "Avaliação diagnóstica"],
  },
];

// Flat list, mantida para compatibilidade e inicialização
export const YEAR_OPTIONS: string[] = YEAR_GROUPS.flatMap(g => g.options);

// Disciplinas agrupadas por etapa/curso (vira <optgroup> nos selects)
export const SUBJECT_GROUPS: Array<{ label: string; options: string[] }> = [
  {
    label: "Educação básica",
    options: [
      "Matemática", "Português", "Ciências", "História", "Geografia",
      "Biologia", "Física", "Química", "Inglês", "Artes", "Ed. Física",
    ],
  },
  {
    label: "Ensino superior",
    options: ["Psicologia", "Saúde Mental", "SUS"],
  },
  {
    label: "Téc. Desenvolvimento de Sistemas (ETEC)",
    options: [
      "Análise e Projeto de Sistemas",
      "Design Digital",
      "Fundamentos da Informática",
      "Linguagem, Trabalho e Tecnologia (DSE)",
      "Técnicas de Programação e Algoritmos",
      "Banco de Dados I",
      "Desenvolvimento de Sistemas",
      "Estrutura de Dados",
      "Ética e Cidadania Organizacional (DSE)",
      "Programação de Computadores I",
      "Sistemas Embarcados",
      "Banco de Dados II",
      "Desenvolvimento para Dispositivos Móveis",
      "Internet, Protocolos e Segurança de Sistemas",
      "Qualidade e Teste de Software",
      "Programação de Computadores II",
      "TCC em Desenvolvimento de Sistemas",
    ],
  },
  {
    label: "Téc. Administração (ETEC)",
    options: [
      "Administração de Marketing",
      "Aplicativos Informáticos",
      "Gestão Empreendedora e Inovação",
      "Introdução à Administração e aos Negócios",
      "Linguagem, Trabalho e Tecnologia (Admin)",
      "Técnicas Organizacionais",
      "Administração da Produção e Serviços",
      "Administração Financeira e Orçamentária",
      "Cálculo Financeiro e Estatístico",
      "Ética e Cidadania Organizacional (Admin)",
      "Gestão de Pessoas I",
      "Legislação Empresarial",
      "Administração de Recursos Humanos (Gestão de Pessoas II)",
      "Gestão de Custos e Preços",
      "Logística Empresarial e Negociações Internacionais",
      "Planejamento Empresarial e Estratégico",
      "TCC em Administração",
    ],
  },
  {
    label: "Téc. Logística (ETEC)",
    options: [
      "Administração da Produção e Operações",
      "Aplicativos Informáticos Aplicados à Logística",
      "Fundamentos de Logística",
      "Linguagem, Trabalho e Tecnologia (Log)",
      "Movimentação, Expedição e Distribuição",
      "Custos Logísticos",
      "Ética e Cidadania Organizacional (Log)",
      "Gestão do Transporte de Cargas",
      "Planejamento, Programação e Controle da Produção (PPCP)",
      "Suprimentos e Gestão de Estoques",
      "Logística Internacional e Economia",
      "Logística Reversa e Sustentabilidade",
      "Planejamento Estratégico e Logístico",
      "Sistemas de Informação Logística",
      "TCC em Logística",
    ],
  },
  {
    label: "Téc. Informática para Internet (ETEC)",
    options: [
      "Criação de Sites (HTML/CSS)",
      "Design Digital Aplicado à Web",
      "Fundamentos de Informática e Redes",
      "Linguagem, Trabalho e Tecnologia (IW)",
      "Lógica de Programação",
      "Banco de Dados Orientado a Ambientes Web",
      "Desenvolvimento de Softwares para Web I",
      "Ética e Cidadania Organizacional (IW)",
      "Interface Humano-Computador (IHC)",
      "Programação Script para Web",
      "Desenvolvimento de Softwares para Web II",
      "Marketing Digital e E-commerce",
      "Segurança de Aplicações Web",
      "Sistemas de Gerenciamento de Conteúdo (CMS)",
      "TCC em Informática para Internet",
    ],
  },
  {
    label: "Téc. Finanças (ETEC)",
    options: [
      "Contabilidade Geral",
      "Fundamentos de Economia e Mercados",
      "Informática Aplicada às Finanças",
      "Introdução às Atividades Financeiras",
      "Linguagem, Trabalho e Tecnologia (Fin)",
      "Matemática Financeira",
      "Análise de Demonstrações Financeiras",
      "Análise de Investimentos e Riscos",
      "Ética e Cidadania Organizacional (Fin)",
      "Gestão de Custos e Formação de Preços",
      "Planejamento Financeiro e Orçamentário",
      "Auditoria e Controladoria",
      "Finanças Corporativas e Internacionais",
      "Legislação Tributária e Fiscal",
      "Mercado de Capitais e Operações Financeiras",
      "TCC em Finanças",
    ],
  },
];

// Flat list (com "Detectar automaticamente" no topo) — mantida para compatibilidade
export const SUBJECT_OPTIONS: string[] = [
  "Detectar automaticamente",
  ...SUBJECT_GROUPS.flatMap(g => g.options),
];

export const SUBJECT_TO_KEY: Record<string, string> = {
  // Educação básica
  "Matemática": "matematica",
  "Português": "portugues",
  "Ciências": "ciencias",
  "História": "historia",
  "Geografia": "geografia",
  "Biologia": "biologia",
  "Física": "fisica",
  "Química": "quimica",
  "Inglês": "ingles",
  "Artes": "artes",
  "Ed. Física": "ed_fisica",
  // Ensino superior
  "Psicologia": "psicologia",
  "Saúde Mental": "saude_mental",
  "SUS": "sus",
  // DSE
  "Análise e Projeto de Sistemas": "analise_projeto_sistemas",
  "Design Digital": "design_digital",
  "Fundamentos da Informática": "fundamentos_informatica",
  "Linguagem, Trabalho e Tecnologia (DSE)": "linguagem_trabalho_tecnologia",
  "Técnicas de Programação e Algoritmos": "tecnicas_programacao_algoritmos",
  "Banco de Dados I": "banco_dados_1",
  "Desenvolvimento de Sistemas": "desenvolvimento_sistemas",
  "Estrutura de Dados": "estrutura_dados",
  "Ética e Cidadania Organizacional (DSE)": "etica_cidadania",
  "Programação de Computadores I": "programacao_computadores_1",
  "Sistemas Embarcados": "sistemas_embarcados",
  "Banco de Dados II": "banco_dados_2",
  "Desenvolvimento para Dispositivos Móveis": "dispositivos_moveis",
  "Internet, Protocolos e Segurança de Sistemas": "internet_protocolos_seguranca",
  "Qualidade e Teste de Software": "qualidade_teste_software",
  "Programação de Computadores II": "programacao_computadores_2",
  "TCC em Desenvolvimento de Sistemas": "tcc",
  // Administração
  "Administração de Marketing": "administracao_marketing",
  "Aplicativos Informáticos": "aplicativos_informaticos",
  "Gestão Empreendedora e Inovação": "gestao_empreendedora",
  "Introdução à Administração e aos Negócios": "introducao_administracao",
  "Linguagem, Trabalho e Tecnologia (Admin)": "linguagem_trabalho_tecnologia",
  "Técnicas Organizacionais": "tecnicas_organizacionais",
  "Administração da Produção e Serviços": "administracao_producao",
  "Administração Financeira e Orçamentária": "administracao_financeira",
  "Cálculo Financeiro e Estatístico": "calculo_financeiro_estatistico",
  "Ética e Cidadania Organizacional (Admin)": "etica_cidadania",
  "Gestão de Pessoas I": "gestao_pessoas_1",
  "Legislação Empresarial": "legislacao_empresarial",
  "Administração de Recursos Humanos (Gestão de Pessoas II)": "administracao_rh",
  "Gestão de Custos e Preços": "gestao_custos_precos",
  "Logística Empresarial e Negociações Internacionais": "logistica_negociacoes",
  "Planejamento Empresarial e Estratégico": "planejamento_estrategico",
  "TCC em Administração": "tcc",
  // Logística
  "Administração da Produção e Operações": "administracao_producao_operacoes",
  "Aplicativos Informáticos Aplicados à Logística": "aplicativos_informaticos",
  "Fundamentos de Logística": "fundamentos_logistica",
  "Linguagem, Trabalho e Tecnologia (Log)": "linguagem_trabalho_tecnologia",
  "Movimentação, Expedição e Distribuição": "movimentacao_expedicao_distribuicao",
  "Custos Logísticos": "custos_logisticos",
  "Ética e Cidadania Organizacional (Log)": "etica_cidadania",
  "Gestão do Transporte de Cargas": "gestao_transporte_cargas",
  "Planejamento, Programação e Controle da Produção (PPCP)": "ppcp",
  "Suprimentos e Gestão de Estoques": "suprimentos_estoques",
  "Logística Internacional e Economia": "logistica_internacional",
  "Logística Reversa e Sustentabilidade": "logistica_reversa_sustentabilidade",
  "Planejamento Estratégico e Logístico": "planejamento_estrategico",
  "Sistemas de Informação Logística": "sistemas_informacao_logistica",
  "TCC em Logística": "tcc_logistica",
  // Informática para Internet
  "Criação de Sites (HTML/CSS)": "criacao_sites",
  "Design Digital Aplicado à Web": "design_digital",
  "Fundamentos de Informática e Redes": "fundamentos_inf_redes",
  "Linguagem, Trabalho e Tecnologia (IW)": "linguagem_trabalho_tecnologia",
  "Lógica de Programação": "logica_programacao",
  "Banco de Dados Orientado a Ambientes Web": "banco_dados_web",
  "Desenvolvimento de Softwares para Web I": "desenvolvimento_web_i",
  "Ética e Cidadania Organizacional (IW)": "etica_cidadania",
  "Interface Humano-Computador (IHC)": "ihc",
  "Programação Script para Web": "programacao_script_web",
  "Desenvolvimento de Softwares para Web II": "desenvolvimento_web_ii",
  "Marketing Digital e E-commerce": "marketing_digital_ecommerce",
  "Segurança de Aplicações Web": "seguranca_aplicacoes_web",
  "Sistemas de Gerenciamento de Conteúdo (CMS)": "cms",
  "TCC em Informática para Internet": "tcc",
  // Finanças
  "Contabilidade Geral": "contabilidade_geral",
  "Fundamentos de Economia e Mercados": "fundamentos_economia",
  "Informática Aplicada às Finanças": "informatica_aplicada",
  "Introdução às Atividades Financeiras": "intro_atividades_financeiras",
  "Linguagem, Trabalho e Tecnologia (Fin)": "linguagem_trabalho_tecnologia",
  "Matemática Financeira": "matematica_financeira",
  "Análise de Demonstrações Financeiras": "analise_demonstracoes",
  "Análise de Investimentos e Riscos": "analise_investimentos_riscos",
  "Ética e Cidadania Organizacional (Fin)": "etica_cidadania",
  "Gestão de Custos e Formação de Preços": "gestao_custos_precos",
  "Planejamento Financeiro e Orçamentário": "planejamento_orcamentario",
  "Auditoria e Controladoria": "auditoria_controladoria",
  "Finanças Corporativas e Internacionais": "financas_corporativas_internacionais",
  "Legislação Tributária e Fiscal": "legislacao_tributaria",
  "Mercado de Capitais e Operações Financeiras": "mercado_capitais",
  "TCC em Finanças": "tcc_financas",
};

export function pctColor(pct: number): string {
  if (pct >= 70) return "#059669";
  if (pct >= 50) return "#D97706";
  return "#DC2626";
}

export function pctIcon(pct: number): string {
  if (pct >= 70) return "🟢";
  if (pct >= 50) return "🟡";
  return "🔴";
}
