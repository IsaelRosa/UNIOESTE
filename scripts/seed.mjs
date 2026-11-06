import fs from "node:fs";
import { scryptSync, randomBytes } from "node:crypto";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});

const raw = fs.readFileSync("src/data/municipalities.ts", "utf8");
const marker = "MUNICIPALITIES: MunicipalitySeed[] = ";
const start = raw.indexOf(marker) + marker.length;
const end = raw.indexOf("];", start);
const MUNICIPALITIES = JSON.parse(raw.slice(start, end + 1));

const PASSWORD = "Sisprom@2026";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

const PLAN = [
  {
    axis: "Educação",
    code: "EDU",
    color: "#1F6F5C",
    description: "Acesso, permanência e qualidade da educação para a juventude paranaense.",
    objectives: [
      {
        name: "Ampliar o acesso e a permanência dos jovens na educação",
        goals: [
          {
            title: "Ampliar a oferta de educação profissionalizante",
            description: "Elevar o número de jovens matriculados e concluintes em cursos técnicos e profissionalizantes.",
            target: 50000,
            unit: "jovens",
            baseline: 21400,
            deadline: "2027-12-31",
            responsible: "Secretaria de Estado da Educação",
            weight: 3,
            actions: [
              {
                name: "Oferta de cursos técnicos e profissionalizantes",
                responsible: "SEDUC / Municípios",
                description: "Abertura de turmas presenciais e híbridas nos municípios com menor oferta.",
                indicators: [
                  { name: "Jovens matriculados em cursos profissionalizantes", unit: "jovens", target: 260, source: "Sistema de gestão municipal", freq: "Trimestral" },
                  { name: "Jovens concluintes em cursos profissionalizantes", unit: "jovens", target: 180, source: "Sistema de gestão municipal", freq: "Trimestral" },
                ],
              },
              {
                name: "Auxílio permanência para jovens em vulnerabilidade",
                responsible: "SEDUC / Assistência Social",
                description: "Transferência de renda complementar para jovens em risco de evasão.",
                indicators: [
                  { name: "Jovens beneficiados com auxílio permanência", unit: "jovens", target: 220, source: "Cadastro Único", freq: "Mensal" },
                ],
              },
            ],
          },
          {
            title: "Reduzir a evasão escolar no ensino médio",
            description: "Busca ativa e reinserção de jovens que abandonaram a escola.",
            target: 9000,
            unit: "jovens reinseridos",
            baseline: 3100,
            deadline: "2027-06-30",
            responsible: "SEDUC",
            weight: 2,
            actions: [
              {
                name: "Busca ativa de jovens fora da escola",
                responsible: "SEDUC / CRAS",
                description: "Mapeamento e acompanhamento de jovens de 15 a 24 anos fora da escola.",
                indicators: [
                  { name: "Taxa de abandono escolar no ensino médio", unit: "%", target: 4.5, source: "Censo Escolar / INEP", freq: "Anual", polarity: "menor_melhor" },
                  { name: "Jovens reinseridos na escola", unit: "jovens", target: 140, source: "Sistema de gestão municipal", freq: "Semestral" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    axis: "Trabalho, Renda e Empreendedorismo",
    code: "TRB",
    color: "#B8862B",
    description: "Qualificação, incentivo ao empreendedorismo e inserção produtiva dos jovens.",
    objectives: [
      {
        name: "Ampliar a inserção produtiva e a renda dos jovens",
        goals: [
          {
            title: "Ampliar vagas de aprendizagem e estágio",
            description: "Fortalecer o programa estadual de aprendizagem e a intermediação de mão de obra jovem.",
            target: 32000,
            unit: "jovens inseridos",
            baseline: 14800,
            deadline: "2027-12-31",
            responsible: "Agência do Trabalhador",
            weight: 3,
            actions: [
              {
                name: "Programa Jovem Aprendiz Estadual",
                responsible: "Agência do Trabalhador / Empresas",
                description: "Articulação com empresas para abertura de vagas de aprendizagem.",
                indicators: [
                  { name: "Jovens inseridos em programas de aprendizagem", unit: "jovens", target: 300, source: "Sistema de gestão municipal", freq: "Mensal" },
                  { name: "Empresas parceiras com vagas de aprendizagem", unit: "empresas", target: 45, source: "Sistema de gestão municipal", freq: "Mensal" },
                ],
              },
              {
                name: "Feiras de empreendedorismo juvenil",
                responsible: "Secretarias municipais de Desenvolvimento",
                description: "Ciclo anual de feiras e mentorias para negócios liderados por jovens.",
                indicators: [
                  { name: "Jovens participantes de feiras de empreendedorismo", unit: "jovens", target: 200, source: "Sistema de gestão municipal", freq: "Semestral" },
                ],
              },
            ],
          },
          {
            title: "Fomentar negócios liderados por jovens",
            description: "Apoio técnico e financeiro a micro e pequenos negócios juvenis.",
            target: 8000,
            unit: "negócios",
            baseline: 1900,
            deadline: "2028-06-30",
            responsible: "Secretaria da Indústria, Comércio e Serviços",
            weight: 1,
            actions: [
              {
                name: "Linha de microcrédito jovem",
                responsible: "Fomento Paraná",
                description: "Crédito orientado com assistência técnica para negócios juvenis.",
                indicators: [
                  { name: "Negócios juvenis apoiados com microcrédito", unit: "negócios", target: 60, source: "Fomento Paraná", freq: "Trimestral" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    axis: "Saúde e Bem-Estar",
    code: "SAU",
    color: "#2C7C8A",
    description: "Saúde mental, prevenção e promoção do bem-estar da população jovem.",
    objectives: [
      {
        name: "Promover a saúde mental e o acolhimento dos jovens",
        goals: [
          {
            title: "Ampliar o acolhimento psicossocial juvenil",
            description: "Garantir retaguarda psicossocial e fluxos de encaminhamento nos municípios.",
            target: 48000,
            unit: "atendimentos",
            baseline: 17600,
            deadline: "2027-12-31",
            responsible: "Secretaria de Estado da Saúde",
            weight: 3,
            actions: [
              {
                name: "Núcleos de acolhimento psicossocial juvenil",
                responsible: "SESA / CAPS municipais",
                description: "Implantação de núcleos com equipe multiprofissional voltados ao público jovem.",
                indicators: [
                  { name: "Atendimentos psicossociais a jovens", unit: "atendimentos", target: 480, source: "Sistema de gestão municipal", freq: "Mensal" },
                  { name: "Núcleos de acolhimento juvenil em funcionamento", unit: "núcleos", target: 2, source: "Sistema de gestão municipal", freq: "Semestral" },
                ],
              },
            ],
          },
          {
            title: "Ampliar ações de prevenção e educação em saúde",
            description: "Ações de promoção da saúde nas escolas e territórios.",
            target: 18000,
            unit: "ações",
            baseline: 6200,
            deadline: "2027-12-31",
            responsible: "SESA / SEDUC",
            weight: 2,
            actions: [
              {
                name: "Programa Saúde na Escola ampliado para jovens",
                responsible: "SESA / SEDUC / Municípios",
                description: "Oficinas e rodas de conversa sobre saúde mental, sexualidade e uso de substâncias.",
                indicators: [
                  { name: "Ações de educação em saúde realizadas", unit: "ações", target: 120, source: "Sistema de gestão municipal", freq: "Trimestral" },
                  { name: "Oficinas de saúde mental para jovens realizadas", unit: "oficinas", target: 90, source: "Sistema de gestão municipal", freq: "Trimestral" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    axis: "Cultura, Esporte e Lazer",
    code: "CUL",
    color: "#7A5AA6",
    description: "Acesso à cultura, ao esporte e ao lazer como direitos da juventude.",
    objectives: [
      {
        name: "Ampliar o acesso da juventude à cultura, ao esporte e ao lazer",
        goals: [
          {
            title: "Fomentar projetos culturais liderados por jovens",
            description: "Editais e chamadas públicas de fomento à cultura juvenil.",
            target: 6000,
            unit: "projetos",
            baseline: 1400,
            deadline: "2027-12-31",
            responsible: "Secretaria de Estado da Cultura",
            weight: 2,
            actions: [
              {
                name: "Edital de fomento cultural jovem",
                responsible: "SEEC / Municípios",
                description: "Apoio financeiro a coletivos e artistas jovens em todos os municípios.",
                indicators: [
                  { name: "Projetos culturais juvenis apoiados", unit: "projetos", target: 35, source: "Sistema de gestão municipal", freq: "Anual" },
                ],
              },
            ],
          },
          {
            title: "Ampliar a participação esportiva dos jovens",
            description: "Circuito estadual de esporte e atividades de lazer nos territórios.",
            target: 42000,
            unit: "jovens",
            baseline: 18500,
            deadline: "2028-03-31",
            responsible: "Secretaria de Estado do Esporte",
            weight: 2,
            actions: [
              {
                name: "Circuito Estadual de Esporte Juvenil",
                responsible: "SEES / Municípios",
                description: "Etapas regionais e municipais de esporte de base e lazer.",
                indicators: [
                  { name: "Jovens participantes de atividades esportivas", unit: "jovens", target: 420, source: "Sistema de gestão municipal", freq: "Quadrimestral" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    axis: "Direitos, Cidadania e Segurança",
    code: "DIR",
    color: "#B4472F",
    description: "Proteção integral, enfrentamento à violência e acesso a direitos.",
    objectives: [
      {
        name: "Fortalecer a rede de proteção e o enfrentamento à violência contra jovens",
        goals: [
          {
            title: "Implantar a rede municipal de proteção à juventude",
            description: "Comitês e fluxos intersetoriais de proteção em todos os municípios.",
            target: 399,
            unit: "municípios",
            baseline: 120,
            deadline: "2028-12-31",
            responsible: "SEJUF / Conselhos Tutelares",
            weight: 3,
            actions: [
              {
                name: "Implantação de comitês municipais de juventude",
                responsible: "SEJUF / Prefeituras",
                description: "Instituição e funcionamento dos comitês municipais de juventude.",
                indicators: [
                  { name: "Reuniões de comitê de juventude realizadas", unit: "reuniões", target: 8, source: "Sistema de gestão municipal", freq: "Trimestral" },
                  { name: "Casos de violência contra jovens acompanhados na rede", unit: "casos", target: 220, source: "Sistema de gestão municipal", freq: "Mensal" },
                ],
              },
            ],
          },
          {
            title: "Ampliar o acesso a documentos e direitos",
            description: "Mutirões de cidadania e documentação civil para jovens.",
            target: 30000,
            unit: "jovens atendidos",
            baseline: 8600,
            deadline: "2027-12-31",
            responsible: "SEJUF",
            weight: 1,
            actions: [
              {
                name: "Mutirões de documentação civil",
                responsible: "SEJUF / Cartórios",
                description: "Emissão de documentos e orientação de direitos em mutirões.",
                indicators: [
                  { name: "Jovens atendidos em mutirões de documentação", unit: "jovens", target: 350, source: "Sistema de gestão municipal", freq: "Semestral" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    axis: "Participação e Protagonismo Juvenil",
    code: "PAR",
    color: "#3E6B9C",
    description: "Participação social, organização juvenil e diálogo com o Estado.",
    objectives: [
      {
        name: "Ampliar a participação social e o protagonismo dos jovens",
        goals: [
          {
            title: "Fortalecer grêmios e coletivos juvenis",
            description: "Formação de lideranças e apoio à organização juvenil nos territórios.",
            target: 12000,
            unit: "jovens formados",
            baseline: 3400,
            deadline: "2027-12-31",
            responsible: "Coordenadoria Estadual da Juventude",
            weight: 2,
            actions: [
              {
                name: "Formação de lideranças juvenis",
                responsible: "SEJUF / Universidades",
                description: "Programa de formação em cidadania, orçamento público e participação.",
                indicators: [
                  { name: "Jovens formados em liderança e cidadania", unit: "jovens", target: 160, source: "Sistema de gestão municipal", freq: "Semestral" },
                  { name: "Grêmios estudantis acompanhados", unit: "grêmios", target: 25, source: "Sistema de gestão municipal", freq: "Anual" },
                ],
              },
            ],
          },
          {
            title: "Ampliar o diálogo direto com a juventude",
            description: "Consultas públicas, conferências livres e orçamento participativo jovem.",
            target: 12000,
            unit: "consultas",
            baseline: 900,
            deadline: "2027-09-30",
            responsible: "Coordenadoria Estadual da Juventude",
            weight: 1,
            actions: [
              {
                name: "Consultas públicas e conferências livres",
                responsible: "Coordenadoria Estadual da Juventude",
                description: "Escuta ampliada da juventude em todas as regiões do estado.",
                indicators: [
                  { name: "Jovens participantes de consultas públicas", unit: "jovens", target: 300, source: "Sistema de gestão municipal", freq: "Anual" },
                  { name: "Consultas públicas realizadas com participação juvenil", unit: "consultas", target: 3, source: "Sistema de gestão municipal", freq: "Anual" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const POLICY_PLANS = [
  ["Plano Estadual de Educação", "Estadual", "Plano decenal de educação do Paraná.", "#1F6F5C"],
  ["Plano Estadual de Saúde", "Estadual", "Diretrizes e metas do SUS no Paraná.", "#2C7C8A"],
  ["Plano Estadual de Assistência Social", "Estadual", "Proteção social básica e especial.", "#8A5A44"],
  ["Plano Estadual de Segurança Pública", "Estadual", "Prevenção e enfrentamento à violência.", "#B4472F"],
  ["Plano Estadual de Cultura", "Estadual", "Fomento e acesso à cultura.", "#7A5AA6"],
  ["Plano Estadual do Esporte", "Estadual", "Esporte de base, rendimento e lazer.", "#B8862B"],
  ["Plano Nacional de Juventude", "Federal", "Diretrizes nacionais para políticas de juventude.", "#3E6B9C"],
  ["Plano Estadual de Direitos Humanos", "Estadual", "Promoção e defesa de direitos.", "#6B7A3E"],
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE TABLE audit_logs, policy_links, policy_plans, results, indicators, actions, goals, objectives, axes, users, municipalities RESTART IDENTITY CASCADE`);

    // Municipalities
    for (let i = 0; i < MUNICIPALITIES.length; i += 100) {
      const chunk = MUNICIPALITIES.slice(i, i + 100);
      const params = [];
      const values = chunk.map((m, j) => {
        params.push(m.ibge, m.name, m.region, m.lat, m.lng);
        return `($${j * 5 + 1},$${j * 5 + 2},$${j * 5 + 3},$${j * 5 + 4},$${j * 5 + 5})`;
      });
      await client.query(
        `INSERT INTO municipalities (ibge_code, name, region, lat, lng) VALUES ${values.join(",")}`,
        params,
      );
    }
    const { rows: muniRows } = await client.query("SELECT id, ibge_code, name, region FROM municipalities ORDER BY id");
    const muniByName = new Map(muniRows.map((r) => [r.name, r]));

    // Users
    const userDefs = [
      ["Ana Beatriz Ferreira", "admin@juventude.pr.gov.br", "estado_admin", null],
      ["Rafael Menezes", "tecnico.estado@juventude.pr.gov.br", "estado_tecnico", null],
      ["Marina Duarte", "gestor@cascavel.pr.gov.br", "municipal_gestor", "Cascavel"],
      ["Lucas Prado", "tecnico@cascavel.pr.gov.br", "municipal_tecnico", "Cascavel"],
      ["Juliana Rocha", "gestor@curitiba.pr.gov.br", "municipal_gestor", "Curitiba"],
      ["Pedro Almeida", "tecnico@maringa.pr.gov.br", "municipal_tecnico", "Maringá"],
      ["Sofia Nogueira", "gestor@maringa.pr.gov.br", "municipal_gestor", "Maringá"],
    ];
    const passwordHash = hashPassword(PASSWORD);
    const userIds = {};
    for (const [name, email, role, muni] of userDefs) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, municipality_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [name, email, passwordHash, role, muni ? muniByName.get(muni).id : null],
      );
      userIds[email] = res.rows[0].id;
    }

    // Strategic plan
    const indicatorDefs = [];
    const goalIndex = [];
    for (let ai = 0; ai < PLAN.length; ai += 1) {
      const axis = PLAN[ai];
      const axisRes = await client.query(
        `INSERT INTO axes (code, name, description, color, position) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [axis.code, axis.axis, axis.description, axis.color, ai],
      );
      const axisId = axisRes.rows[0].id;
      for (let oi = 0; oi < axis.objectives.length; oi += 1) {
        const objective = axis.objectives[oi];
        const objRes = await client.query(
          `INSERT INTO objectives (axis_id, code, name, description) VALUES ($1,$2,$3,$4) RETURNING id`,
          [axisId, `${axis.code}-O${oi + 1}`, objective.name, objective.name],
        );
        const objectiveId = objRes.rows[0].id;
        for (let gi = 0; gi < objective.goals.length; gi += 1) {
          const goal = objective.goals[gi];
          const goalCode = `${axis.code}-M${gi + 1}`;
          const goalRes = await client.query(
            `INSERT INTO goals (objective_id, code, title, description, target_value, unit, baseline, deadline, responsible, weight, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [objectiveId, goalCode, goal.title, goal.description, goal.target, goal.unit, goal.baseline, goal.deadline, goal.responsible, goal.weight, "em_execucao"],
          );
          const goalId = goalRes.rows[0].id;
          goalIndex.push({ id: goalId, code: goalCode, title: goal.title, axis: axis.axis, axisCode: axis.code });
          for (let aci = 0; aci < goal.actions.length; aci += 1) {
            const action = goal.actions[aci];
            const actionRes = await client.query(
              `INSERT INTO actions (goal_id, code, name, description, responsible, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
              [goalId, `${goalCode}-A${aci + 1}`, action.name, action.description, action.responsible, "em_execucao"],
            );
            const actionId = actionRes.rows[0].id;
            for (let ii = 0; ii < action.indicators.length; ii += 1) {
              const ind = action.indicators[ii];
              const code = `${goalCode}-I${aci + 1}${ii + 1}`;
              const indRes = await client.query(
                `INSERT INTO indicators (action_id, code, name, description, unit, target_value, source, frequency, polarity)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
                [actionId, code, ind.name, ind.name, ind.unit, ind.target, ind.source, ind.freq, ind.polarity ?? "maior_melhor"],
              );
              indicatorDefs.push({
                id: indRes.rows[0].id,
                code,
                axis: axis.axis,
                axisCode: axis.code,
                target: ind.target,
                polarity: ind.polarity ?? "maior_melhor",
                name: ind.name,
              });
            }
          }
        }
      }
    }

    // Policy plans + links
    const planIds = [];
    for (const [name, sphere, description, color] of POLICY_PLANS) {
      const res = await client.query(
        `INSERT INTO policy_plans (name, sphere, description, color) VALUES ($1,$2,$3,$4) RETURNING id`,
        [name, sphere, description, color],
      );
      planIds.push(res.rows[0].id);
    }
    const linkDefs = [
      ["EDU-M1", "Plano Estadual de Educação", "A educação profissionalizante é meta transversal do plano educacional.", 3],
      ["EDU-M1", "Plano Nacional de Juventude", "Jovens qualificados ampliam autonomia e renda.", 2],
      ["EDU-M1", "Plano Estadual de Assistência Social", "O auxílio permanência integra proteção social básica e educação.", 2],
      ["EDU-M2", "Plano Estadual de Educação", "Redução do abandono escolar é indicador estratégico da educação.", 3],
      ["EDU-M2", "Plano Estadual de Assistência Social", "Busca ativa usa o Cadastro Único como porta de entrada.", 3],
      ["TRB-M1", "Plano Estadual de Educação", "Aprendizagem articula escola e mundo do trabalho.", 2],
      ["TRB-M1", "Plano Estadual de Assistência Social", "Jovens aprendizes priorizados por vulnerabilidade.", 2],
      ["TRB-M2", "Plano Estadual de Desenvolvimento Econômico", "Microcrédito jovem compõe a política de empreendedorismo.", 2],
      ["SAU-M1", "Plano Estadual de Saúde", "Saúde mental juvenil é prioridade da rede psicossocial.", 3],
      ["SAU-M1", "Plano Estadual de Educação", "Acolhimento psicossocial em articulação com as escolas.", 3],
      ["SAU-M2", "Plano Estadual de Educação", "Saúde na escola é ação conjunta das duas políticas.", 3],
      ["CUL-M1", "Plano Estadual de Cultura", "Fomento cultural jovem integra o plano cultural.", 2],
      ["CUL-M2", "Plano Estadual do Esporte", "Esporte juvenil compartilha metas de participação.", 3],
      ["DIR-M1", "Plano Estadual de Segurança Pública", "Comitês municipais integram a rede de prevenção à violência.", 3],
      ["DIR-M1", "Plano Estadual de Assistência Social", "Proteção especial de jovens em situação de violência.", 3],
      ["DIR-M1", "Plano Estadual de Direitos Humanos", "Enfrentamento à violência contra a juventude.", 3],
      ["DIR-M2", "Plano Estadual de Direitos Humanos", "Documentação civil é porta de acesso a direitos.", 2],
      ["PAR-M1", "Plano Nacional de Juventude", "Formação de lideranças e grêmios comuns aos dois planos.", 2],
      ["PAR-M2", "Plano Estadual de Direitos Humanos", "Consultas públicas ampliam voz da juventude.", 2],
    ];
    for (const [goalCode, planName, rationale, strength] of linkDefs) {
      const goal = goalIndex.find((g) => g.code === goalCode);
      if (!goal) continue;
      let planId = null;
      const { rows: planRow } = await client.query("SELECT id FROM policy_plans WHERE name = $1", [planName]);
      if (planRow[0]) planId = planRow[0].id;
      if (!planId) {
        const inserted = await client.query(
          `INSERT INTO policy_plans (name, sphere, description, color) VALUES ($1,'Estadual','Plano relacionado ao Plano Estadual da Juventude.','#6B7A3E') RETURNING id`,
          [planName],
        );
        planId = inserted.rows[0].id;
      }
      await client.query(
        `INSERT INTO policy_links (goal_id, policy_plan_id, rationale, strength) VALUES ($1,$2,$3,$4)`,
        [goal.id, planId, rationale, strength],
      );
    }

    // Results
    const regionBias = {};
    muniRows.forEach((m) => {
      if (!(m.region in regionBias)) regionBias[m.region] = hash01(`region-${m.region}`) * 0.14;
    });
    const reviewers = [userIds["admin@juventude.pr.gov.br"], userIds["gestor@cascavel.pr.gov.br"], userIds["gestor@curitiba.pr.gov.br"], userIds["gestor@maringa.pr.gov.br"]];
    const muniUsers = new Map([
      [muniByName.get("Cascavel").id, { tech: userIds["tecnico@cascavel.pr.gov.br"], manager: userIds["gestor@cascavel.pr.gov.br"] }],
      [muniByName.get("Curitiba").id, { tech: userIds["gestor@curitiba.pr.gov.br"], manager: userIds["gestor@curitiba.pr.gov.br"] }],
      [muniByName.get("Maringá").id, { tech: userIds["tecnico@maringa.pr.gov.br"], manager: userIds["gestor@maringa.pr.gov.br"] }],
    ]);

    const indIds = [];
    const resultMuniIds = [];
    const periods = [];
    const values = [];
    const statuses = [];
    const submitters = [];
    const reviewersCol = [];
    const notes = [];
    const submittedAt = [];
    const reviewedAt = [];
    const now = Date.now();
    for (const m of muniRows) {
      const base = 0.42 + hash01(`muni-${m.ibge_code}`) * 0.72 + (regionBias[m.region] ?? 0);
      for (const ind of indicatorDefs) {
        const noise = 0.72 + hash01(`${m.ibge_code}-${ind.code}`) * 0.55;
        for (const period of ["2024", "2025"]) {
          const yearFactor = period === "2024" ? 0.9 : 1.0;
          let factor = base * noise * yearFactor;
          factor = Math.max(0.12, Math.min(1.45, factor));
          const roll = hash01(`${m.ibge_code}-${ind.code}-${period}-status`);
          let status;
          if (period === "2024") {
            if (roll > 0.93) continue;
            status = roll > 0.9 ? "corrigir" : "aprovado";
          } else if (roll > 0.93) {
            continue;
          } else if (roll > 0.8) {
            status = "enviado";
          } else if (roll > 0.72) {
            status = "corrigir";
          } else {
            status = "aprovado";
          }
          let value;
          if (ind.polarity === "menor_melhor") {
            value = ind.target * (1.55 - factor);
            value = Math.max(ind.target * 0.28, value);
          } else {
            value = ind.target * factor;
          }
          value = Math.round(value * 10) / 10;
          const muniUsersEntry = muniUsers.get(m.id);
          const submitted = muniUsersEntry?.tech ?? null;
          const reviewed = status === "aprovado" ? (muniUsersEntry?.manager ?? reviewers[0]) : null;
          const submittedDate = new Date(now - Math.floor(hash01(`${m.ibge_code}${ind.code}${period}a`) * 70) * 86400000);
          indIds.push(ind.id);
          resultMuniIds.push(m.id);
          periods.push(period);
          values.push(value);
          statuses.push(status);
          submitters.push(submitted);
          reviewersCol.push(reviewed);
          notes.push(
            status === "corrigir"
              ? "Revisar a fonte do dado e anexar comprovação da ação."
              : "",
          );
          submittedAt.push(submittedDate.toISOString());
          reviewedAt.push(status === "aprovado" ? new Date(submittedDate.getTime() + 4 * 86400000).toISOString() : null);
        }
      }
    }

    const batchSize = 1500;
    for (let i = 0; i < indIds.length; i += batchSize) {
      const end = Math.min(i + batchSize, indIds.length);
      await client.query(
        `INSERT INTO results (indicator_id, municipality_id, period, value, note, evidence, status, submitted_by_id, reviewed_by_id, review_note, submitted_at, reviewed_at)
         SELECT * FROM unnest($1::int[], $2::int[], $3::text[], $4::float8[], $5::text[], $6::text[], $7::result_status[], $8::int[], $9::int[], $10::text[], $11::timestamptz[], $12::timestamptz[])`,
        [
          indIds.slice(i, end),
          resultMuniIds.slice(i, end),
          periods.slice(i, end),
          values.slice(i, end),
          notes.slice(i, end),
          notes.slice(i, end),
          statuses.slice(i, end),
          submitters.slice(i, end),
          reviewersCol.slice(i, end),
          notes.slice(i, end),
          submittedAt.slice(i, end),
          reviewedAt.slice(i, end),
        ],
      );
    }

    // Audit trail
    const auditDefs = [
      ["Ana Beatriz Ferreira", "estado_admin", "PLANO_CRIADO", "goals", `${goalIndex.length} metas`, "Publicação da estrutura do Plano Estadual da Juventude", 26],
      ["Rafael Menezes", "estado_tecnico", "INDICADOR_VALIDADO", "indicators", `${indicatorDefs.length} indicadores`, "Revisão das fontes de dados dos indicadores", 21],
      ["Marina Duarte", "municipal_gestor", "RESULTADO_APROVADO", "results", "Cascavel", "Aprovação do relatório trimestral do município", 14],
      ["Lucas Prado", "municipal_tecnico", "RESULTADO_ENVIADO", "results", "Cascavel", "Envio de 12 indicadores para validação do gestor", 12],
      ["Juliana Rocha", "municipal_gestor", "USUARIO_CRIADO", "users", "Curitiba", "Cadastro de equipe técnica municipal", 9],
      ["Ana Beatriz Ferreira", "estado_admin", "EXPORTACAO_GERADA", "reports", "XLSX", "Relatório consolidado de metas por região", 7],
      ["Rafael Menezes", "estado_tecnico", "CORRECAO_SOLICITADA", "results", "Maringá", "Solicitada comprovação dos dados de 2025", 5],
      ["Ana Beatriz Ferreira", "estado_admin", "INTEGRACAO_SINCRONIZADA", "integrations", "Cadastro Único", "Carga de referência do Cadastro Único concluída", 3],
      ["Sofia Nogueira", "municipal_gestor", "RESULTADO_APROVADO", "results", "Maringá", "Aprovação dos dados de educação profissionalizante", 2],
      ["Rafael Menezes", "estado_tecnico", "PORTAL_PUBLICADO", "public", "transparência", "Atualização do portal público de transparência", 1],
    ];
    for (const [userName, role, action, entity, entityId, detail, daysAgo] of auditDefs) {
      await client.query(
        `INSERT INTO audit_logs (user_name, role, action, entity, entity_id, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userName, role, action, entity, entityId, detail, new Date(now - daysAgo * 86400000).toISOString()],
      );
    }

    await client.query("COMMIT");
    console.log(
      `seed ok: ${muniRows.length} municípios, ${indicatorDefs.length} indicadores, ${indIds.length} resultados, ${goalIndex.length} metas`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
