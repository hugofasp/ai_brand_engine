/**
 * Sample interview fixture, fully-populated `answers` JSON across all
 * 7 phases for a fictional industrialized-construction brand.
 *
 * Used by the admin "Seed sample interview" action to create a
 * pre-filled request in one click, so the generation pipeline can be
 * built and validated without sitting through a full conversational
 * interview each iteration.
 *
 * Every REQUIRED field per the framework checklist is present. The
 * sample is intentionally close to inHabitus (the real test brand) so
 * generated files read realistically.
 *
 * Em-dashes are forbidden in brand content — the fixture deliberately
 * uses commas/periods/parentheses instead. The sanitizer in
 * `lib/text/sanitize.ts` would catch any that slip through, but
 * keeping the source clean is good hygiene.
 */

export const SAMPLE_BRAND = {
  company_name: "Sample · BetãoPlus",
  contact_name: "Maria Santos",
  contact_email: "maria@sample-betaoplus.example",
  contact_role: "Founder" as const,
  product: "brand-identity" as const,
};

export const SAMPLE_ANSWERS = {
  phase_1: {
    q1_1: {
      brand_name: "BetãoPlus",
      locale_primary: "pt",
      locale_secondary: "en",
    },
    q1_3: {
      name: "BetãoPlus Construções",
      type: "Promotora e construtora residencial integrada verticalmente.",
      structure:
        "Lda. com três sócios fundadores e equipa interna de 8 pessoas.",
      focus:
        "Habitação multifamiliar entre 4 e 24 unidades, industrializada em betão pré-fabricado.",
      region:
        "Continente português, com obras concentradas em Lisboa, Setúbal e Évora.",
      specialization:
        "Pré-fabricação modular em betão com integração de estudo geotécnico, projeto, fabrico e montagem na mesma equipa.",
    },
    q1_4: {
      problem:
        "Promotores e investidores aceitam que prazos e custos escapam ao plano original porque coordenam dezenas de subcontratos com interfaces frágeis entre disciplinas.",
    },
    q1_4b: [
      "Subcontratação fragmentada cria pontos cegos entre projeto, estrutura e acabamentos.",
      "Cada interface entre disciplinas é renegociada em obra, multiplicando custos não orçamentados.",
      "Decisões de execução tomadas em estaleiro escapam ao registo técnico do projeto.",
      "Mão-de-obra qualificada é alocada por fornecedor, não por obra, gerando esperas em cadeia.",
    ],
    q1_5: {
      resolution:
        "Tudo é resolvido em fábrica antes de chegar à obra: projeto, fabrico e montagem são geridos pela mesma equipa contra um modelo digital único.",
    },
    q1_6_stages: [
      "Estudo do terreno e modelação geotécnica",
      "Projeto integrado em BIM com fabricabilidade validada",
      "Fabrico modular em betão sob condições controladas",
      "Logística e transporte sequenciado para obra",
      "Montagem em estaleiro com equipa interna",
      "Acabamentos e entrega chave-na-mão",
    ],
    q1_6_effects: [
      "Prazo de execução em obra cai 40-60% face a construção convencional.",
      "Variação de custo entre orçamento e fecho fica abaixo de 5%.",
      "Defeitos detetados após entrega caem para um terço da média do setor.",
      "Investidores recebem cronograma de fluxo de caixa estável e auditável.",
    ],
    q1_7: {
      category:
        "Promotora residencial industrializada em betão pré-fabricado.",
    },
    q1_7_axes: [
      "Previsibilidade de prazo e custo",
      "Qualidade construtiva certificável",
      "Eficiência térmica e acústica",
      "Densidade e tipologia de unidades por terreno",
    ],
    q1_8: [
      "Garantir o mesmo prazo de execução duas vezes seguidas em projetos diferentes, impossível para empresas que dependem de subcontratos rotativos.",
      "Iterar um projeto em fábrica em vez de em estaleiro, o que exige investimento em molde, BIM e logística que estúdios pequenos não conseguem amortizar.",
      "Apresentar ao investidor um cronograma de cash-flow estável desde o primeiro dia, o que exige integração vertical que multi-disciplinares não têm.",
    ],
    q1_9: [
      "Não é um estúdio de arquitetura.",
      "Não é uma empreiteira de obras públicas.",
      "Não é uma fábrica de pré-fabricados que vende módulos a terceiros.",
      "Não é uma promotora especulativa de terrenos.",
    ],
    q1_10: [
      "O promotor recebe a chave dentro do prazo contratado, com variação de custo inferior a 5%.",
      "O investidor consegue modelar retornos com cronograma estável de cash-flow.",
      "Os moradores entram em casas com desempenho térmico e acústico verificável por ensaio.",
      "O proprietário do terreno vê a sua parcela ocupada em 8 a 14 meses, não em 24 a 36.",
    ],
    q1_11: {
      pt: "A BetãoPlus é uma promotora residencial integrada verticalmente que constrói edifícios multifamiliares em betão pré-fabricado. Tudo o que normalmente se decide em obra resolve-se na nossa fábrica: estudo do terreno, projeto, fabrico e montagem são geridos pela mesma equipa contra um modelo digital único. O resultado é previsibilidade real de prazo e custo, com defeitos pós-entrega muito abaixo da média do setor.",
      en: "BetãoPlus is a vertically integrated residential developer that builds multi-family buildings in precast concrete. Everything normally decided on site is resolved in our factory: ground assessment, design, fabrication and assembly are handled by the same team against a single digital model. The result is real predictability of schedule and cost, with post-handover defects far below industry norms.",
    },
  },
  phase_2: {
    q2_1: {
      primary_insight:
        "Promotores e investidores tratam a previsibilidade construtiva como condição estrutural do retorno, não como detalhe operacional.",
      consequence:
        "Cada euro de derrapagem ou cada semana de atraso destrói retorno calculado em modelos financeiros, e não há renegociação que recupere isso.",
    },
    q2_2: {
      count: 3,
      primary_segment_id: "investor_promoter",
      segments: [
        { id: "investor_promoter", name: "Promotor-investidor profissional" },
        { id: "family_office", name: "Family office com tese imobiliária" },
        { id: "private_owner", name: "Proprietário privado de terreno urbano" },
      ],
    },
    q2_3: {
      investor_promoter: {
        name_and_triggers: {
          pt: [
            "Promotor com pipeline de 3 ou mais projetos por ano",
            "Acabou de receber relatório de derrapagem de prazo numa obra em curso",
            "Está a estruturar um novo lote para financiamento bancário",
            "Recebeu nota de imparidade em projeto anterior por atraso",
            "Está a negociar terreno e precisa de cronograma defensável",
          ],
          en: [
            "Developer with a pipeline of 3+ projects per year",
            "Just received a schedule-slippage report on an ongoing project",
            "Structuring a new plot for bank financing",
            "Took an impairment hit on a prior project due to delays",
            "Negotiating land and needs a defensible schedule",
          ],
        },
        structural_conditions: [
          "Opera com IRR-alvo entre 12% e 18%",
          "Tem equipa interna de project finance mas terceiriza execução",
          "Reporta a investidores externos (banca + equity)",
          "Pipeline depende de track-record de entrega no prazo",
        ],
        financial_position:
          "Capital disponível para arrancar nova promoção; sensível a erosão de margem por derrapagem.",
        stage_of_life:
          "Carteira ativa de 3-8 projetos, em fases diferentes do ciclo (do estudo prévio à entrega).",
        primary_condition:
          "Precisa de cronograma de entrega defensável perante banca e equity, com responsabilidade contratual sobre o prazo.",
        core_problem:
          "O modelo tradicional de subcontratação não suporta promessa de prazo, porque qualquer atraso em qualquer subcontrato cascateia.",
        drivers: [
          "Preservar IRR-alvo do fundo",
          "Reduzir exposição a derrapagens contratuais",
          "Ter cronograma defensável em comité de crédito",
          "Construir pipeline reputacional de entrega no prazo",
        ],
        non_drivers: [
          "Inovação arquitetónica pela inovação",
          "Sustentabilidade como narrativa de marketing",
          "Personalização chave-na-mão do comprador final",
        ],
        system_fit:
          "Aceita pagar prémio de 5-12% sobre construção convencional pela previsibilidade, e descobre que com industrialização não há prémio, há equivalência ou desconto.",
        why_segment_matters:
          "É o segmento que mais paga por previsibilidade e o que mais paga prémio reputacional ao fornecedor que entrega.",
      },
      family_office: {
        name_and_triggers: {
          pt: [
            "Family office com posição imobiliária consolidada",
            "Procura alocação alternativa a obrigações em ambiente de taxas baixas",
            "Quer exposição residencial mas sem operar a execução",
            "Tem disponibilidade longa de capital sem urgência de liquidez",
          ],
          en: [
            "Family office with a consolidated real-estate position",
            "Looking for alternative allocation in a low-yield environment",
            "Wants residential exposure without running the build",
            "Has long-dated capital with no liquidity pressure",
          ],
        },
        structural_conditions: [
          "Tem capital paciente (5-10 anos)",
          "Não tem equipa interna de promoção",
          "Quer co-investir, não operar",
          "Exige reporting trimestral defensável",
        ],
        financial_position:
          "Capital comprometido com horizonte longo; aceita IRR-alvo mais baixo em troca de baixa variância.",
        stage_of_life:
          "Diversificação de portefólio com tese residencial nova ou em expansão.",
        primary_condition:
          "Quer um veículo onde o operador assume risco de execução e o family office só recebe reporting.",
        core_problem:
          "Não tem competência operacional para gerir promoção residencial direta e o mercado de project finance não oferece veículos com risco de execução isolado.",
        drivers: [
          "Diversificação para fora de obrigações e ações",
          "Baixa variância nos retornos",
          "Reporting trimestral defensável",
        ],
        non_drivers: [
          "Controlo operacional",
          "Branding do projeto",
          "Velocidade de saída",
        ],
        system_fit:
          "Co-investe em SPVs por projeto; o operador (BetãoPlus) assume risco de execução com cap de derrapagem contratual.",
        why_segment_matters:
          "Traz capital paciente que cobre os ciclos longos de aprovação urbanística sem pressão de exit.",
      },
      private_owner: {
        name_and_triggers: {
          pt: [
            "Proprietário com um lote urbano herdado",
            "Já recebeu propostas de promotores e desconfia das margens",
            "Quer construir mas não conhece o mundo da promoção",
            "Tem cash para os primeiros 20-30% do investimento",
          ],
          en: [
            "Owner of a single inherited urban plot",
            "Has received offers from developers and distrusts their margins",
            "Wants to build but has no developer-side knowledge",
            "Has cash for the first 20-30% of the build",
          ],
        },
        structural_conditions: [
          "Não tem experiência prévia em promoção imobiliária",
          "Capital limitado mas com terreno como ativo",
          "Procura modelo de risco partilhado",
          "Quer transparência total sobre custos",
        ],
        financial_position:
          "Liquidez parcial; o terreno é o ativo principal e funciona como capital próprio na operação.",
        stage_of_life: "Primeiro projeto imobiliário, normalmente único.",
        primary_condition:
          "Precisa de um parceiro que assume execução e transparência total sobre custos, não um empreiteiro que faz orçamento e depois renegoceia.",
        core_problem:
          "O modelo tradicional de promoção esconde margem em interfaces; o proprietário não consegue auditar e desconfia.",
        drivers: [
          "Maximizar valor do terreno sem o vender",
          "Construir sem ter de aprender a indústria",
          "Auditabilidade total de custos",
        ],
        non_drivers: [
          "Velocidade de execução absoluta",
          "Inovação técnica",
          "Prestígio da marca construtora",
        ],
        system_fit:
          "Modelo de joint-venture com terreno como contribuição em espécie; BetãoPlus assume execução e o proprietário recebe quotas no projeto.",
        why_segment_matters:
          "É a fonte mais comum de pipeline urbano em malha consolidada, onde grandes promotores não chegam.",
      },
    },
    q2_4: [
      "Decisão de promoção atravessa comité (banca, equity ou família) com necessidade de cronograma defensável.",
      "Capacidade de aceitar discussão técnica detalhada em vez de pitch comercial.",
      "Posse legal ou financeira do terreno antes do contacto.",
    ],
    q2_5: [
      {
        description:
          "Compradores finais individuais de apartamento ou moradia.",
        reason_for_exclusion:
          "A nossa relação contratual é com o promotor ou investidor, não com o utilizador final do imóvel.",
      },
      {
        description: "Concursos públicos de empreitada de obras públicas.",
        reason_for_exclusion:
          "O modelo de empreitada pública não suporta o nosso desenho de integração vertical com responsabilidade sobre o cronograma.",
      },
      {
        description:
          "Promotores especulativos de terrenos sem intenção de construir.",
        reason_for_exclusion:
          "Não vendemos terreno nem participamos em estruturas de flipping urbano.",
      },
      {
        description: "Construções unifamiliares isoladas abaixo de 4 unidades.",
        reason_for_exclusion:
          "Abaixo dessa escala a industrialização não amortiza o investimento em molde e logística.",
      },
    ],
    q2_6: {
      access_condition:
        "Reunião técnica inicial com o promotor ou comité, com revisão do terreno e dos termos do investimento.",
      structure_condition:
        "Assinatura de pré-contrato com cap de derrapagem definido e cronograma de fabrico+montagem assumido contratualmente.",
      confidence_condition:
        "Visita à fábrica e a uma obra em execução, com acesso aos dossiers de qualidade de projetos anteriores.",
    },
  },
  phase_3: {
    q3_1: {
      count: 5,
      pillars: [
        { id: "vertical_integration", name: "Integração vertical real" },
        { id: "factory_first", name: "Tudo se resolve em fábrica" },
        { id: "schedule_contract", name: "Cronograma como contrato" },
        { id: "single_model", name: "Modelo digital único" },
        { id: "post_handover", name: "Acompanhamento pós-entrega" },
      ],
    },
    q3_2: {
      vertical_integration: {
        problem:
          "Promoção residencial tradicional vive em interfaces frágeis entre disciplinas; cada interface é uma fonte de derrapagem.",
        mechanism:
          "Equipa interna cobre projeto, fabrico, logística e montagem; nenhum subcontrato corre risco crítico.",
        accept_when: [
          "O projeto é multifamiliar entre 4 e 24 unidades",
          "O cliente aceita o nosso modelo de responsabilidade integrada",
          "O terreno permite logística de transporte de módulos",
        ],
        reject_when: [
          "Cliente exige fragmentar contratos para procurement separado",
          "Projeto exige técnicas fora do nosso domínio (ex. fundações especiais não-modulares)",
          "Cronograma exigido é incompatível com o nosso lead time de fabrico",
        ],
        effect:
          "Responsabilidade contratual única sobre prazo e custo; o promotor tem um interlocutor para tudo.",
        context_weights: { SALES: 5, INVESTOR: 5, TECHNICAL: 4, COMMUNITY: 2, INTERNAL: 4 },
        segment_modifiers: { investor_promoter: 2, family_office: 1, private_owner: 1 },
      },
      factory_first: {
        problem:
          "Decisões tomadas em estaleiro escapam ao registo técnico e geram defeitos não documentados.",
        mechanism:
          "Todas as decisões construtivas estão modeladas no BIM antes do fabrico; a obra é apenas montagem.",
        accept_when: [
          "O projeto admite pré-fabricação modular",
          "Cliente aceita ciclo de decisão front-loaded",
          "Há tempo de planeamento suficiente antes do início de fabrico",
        ],
        reject_when: [
          "Cliente quer iterar projeto depois do início de fabrico",
          "Projeto exige acabamentos altamente customizados por unidade",
          "Há restrições urbanísticas que exigem revisão de projeto após licenciamento",
        ],
        effect:
          "Variação de custo abaixo de 5% e defeitos pós-entrega para um terço da média do setor.",
        context_weights: { SALES: 4, INVESTOR: 4, TECHNICAL: 5, COMMUNITY: 2, INTERNAL: 5 },
        segment_modifiers: { investor_promoter: 1, family_office: 1, private_owner: 1 },
      },
      schedule_contract: {
        problem:
          "Cronogramas em promoção tradicional são estimativas comerciais, não compromissos contratuais.",
        mechanism:
          "Assumimos contratualmente o prazo de fabrico+montagem com penalidades; o cronograma é cláusula, não slide.",
        accept_when: [
          "Cliente tem comité de crédito ou investidores externos",
          "Projeto exige defesa do cronograma perante terceiros",
        ],
        reject_when: [
          "Cliente quer cronograma 'aspiracional' sem responsabilidade contratual",
          "Há dependências externas críticas (licenciamento atrasado, expropriações pendentes) fora do nosso controlo",
        ],
        effect:
          "Promotor consegue defender o cronograma em comité; risco de cash-flow torna-se calculável.",
        context_weights: { SALES: 5, INVESTOR: 5, TECHNICAL: 3, COMMUNITY: 1, INTERNAL: 4 },
        segment_modifiers: { investor_promoter: 2, family_office: 2, private_owner: 0 },
      },
      single_model: {
        problem:
          "Múltiplos modelos (arquitetura, estrutura, instalações) divergem ao longo do projeto e geram interfaces falhadas.",
        mechanism:
          "Um único modelo BIM federado serve projeto, fabrico, logística e montagem; cada disciplina escreve no mesmo objeto.",
        accept_when: [
          "Projeto pode ser modelado integralmente em BIM",
          "Equipa de projeto aceita disciplina de federação",
        ],
        reject_when: [
          "Projeto envolve componente existente sem levantamento BIM",
          "Cliente exige formato de entrega tradicional (CAD 2D apenas)",
        ],
        effect:
          "Auditabilidade total do projeto; cada decisão tem traceability no modelo.",
        context_weights: { SALES: 3, INVESTOR: 3, TECHNICAL: 5, COMMUNITY: 2, INTERNAL: 5 },
        segment_modifiers: { investor_promoter: 1, family_office: 1, private_owner: 1 },
      },
      post_handover: {
        problem:
          "Promoção tradicional desaparece após a entrega; defeitos descobertos depois caem sobre o promotor.",
        mechanism:
          "Acompanhamento técnico durante 24 meses pós-entrega com plano de inspeções calendarizado.",
        accept_when: [
          "Cliente valoriza track-record reputacional",
          "Projeto destina-se a venda a comprador final (que pede garantias)",
        ],
        reject_when: [
          "Cliente quer relação puramente transacional",
          "Cronograma de pagamento não inclui retenção para serviço pós-entrega",
        ],
        effect:
          "Reputação composta projeto a projeto; pipeline alimentado por referenciações.",
        context_weights: { SALES: 4, INVESTOR: 3, TECHNICAL: 4, COMMUNITY: 4, INTERNAL: 3 },
        segment_modifiers: { investor_promoter: 1, family_office: 1, private_owner: 2 },
      },
    },
    q3_3: [
      {
        tension:
          "Integração vertical exige investimento em fábrica que pressiona margem; pressão sobre margem tenta diluir integração.",
        interpretation:
          "Diluir integração para proteger margem destrói a tese, a previsibilidade que vendemos depende dela.",
        resolution_rule:
          "Margem comprime-se temporariamente antes da integração se diluir; preferimos recusar projetos a quebrar integração.",
      },
      {
        tension:
          "Tudo-em-fábrica acelera execução mas atrasa decisões de projeto.",
        interpretation:
          "Front-loading do projeto é desconfortável para o promotor habituado a iterar em obra.",
        resolution_rule:
          "Investimos em pre-construction longo para o cliente sentir que o projeto está fechado antes de assinarmos fabrico.",
      },
      {
        tension:
          "Cronograma como contrato exige aceitar penalidades; aceitar penalidades exige excluir projetos com risco externo elevado.",
        interpretation:
          "Há projetos lucrativos que temos de recusar porque o seu risco de licenciamento contamina o cronograma.",
        resolution_rule:
          "Recusamos antes de aceitar com cláusulas que diluam a promessa contratual.",
      },
    ],
    q3_4:
      "Quando há tensão, escolhemos sempre o caminho que preserva a promessa de previsibilidade contratual, mesmo que custe margem, prazo de portas-abertas ou um projeto pontual.",
  },
  phase_4: {
    q4_1: [
      "Técnica sem ornamento",
      "Direta ao mecanismo",
      "Defensável em comité",
      "Sóbria, nunca eufórica",
      "Sem evangelismo de inovação",
    ],
    q4_2: [
      "Frases curtas, com unidades concretas",
      "Listas numeradas com referência a evidência",
      "Sem advérbios intensificadores",
      "Verbos no presente do indicativo",
      "Subordinadas só quando explicam mecanismo",
    ],
    q4_3:
      "Cada afirmação tem de poder ser auditada. Se não tem mecanismo nem número, reescreve-se até ter.",
    q4_5: {
      em_dashes: "forbidden",
      exclamation_marks: "forbidden",
      all_caps_emphasis: "forbidden",
      oxford_comma: "off",
      heading_case: "sentence",
      emoji_policy: "forbidden",
    },
    q4_6: {
      pt: {
        precise:
          "A previsibilidade contratual depende de três coisas: integração vertical, modelo digital único e cronograma assumido por contrato. Sem uma dessas três, a promessa de prazo e custo não tem suporte estrutural. É por isso que recusamos projetos onde alguma delas tem de ser diluída. Não é teimosia, é arquitetura do modelo.",
        considered:
          "Há uma decisão silenciosa em cada promoção residencial: aceitar que prazo e custo vão escapar, ou organizar o trabalho para que não escapem. A diferença não está em querer mais, está em como se distribui a decisão construtiva. Quando tudo o que importa se decide em fábrica, a obra deixa de ser o sítio onde as coisas correm mal.",
        conversational:
          "Trabalhamos diferente. Tudo o que normalmente é decidido em obra, nós resolvemos em fábrica. Isso parece pequeno mas muda tudo: o prazo cumpre-se, o custo fecha, e os defeitos depois são poucos. Não é magia, é organização.",
        accountable:
          "Quando um cronograma escapa, escapa por uma de três razões: licenciamento, fornecedor crítico ou erro de planeamento. As duas primeiras estão fora do nosso controlo e dizemos isso ao cliente quando acontece. A terceira é nossa responsabilidade contratual e responde a penalidade.",
      },
      en: {
        precise:
          "Contractual predictability depends on three things: vertical integration, a single digital model, and a schedule committed by contract. Without one of those three, the promise of time and cost has no structural support. That's why we reject projects where any of them must be diluted. It isn't stubbornness, it's how the model is built.",
        considered:
          "There's a quiet decision in every residential development: accept that schedule and cost will slip, or organize the work so they don't. The difference isn't in wanting more; it's in how you distribute the construction decision. When everything that matters is decided in the factory, the site stops being where things go wrong.",
        conversational:
          "We work differently. Anything normally decided on site, we resolve in the factory. That sounds small but it changes everything: the schedule holds, the budget closes, and post-handover defects are few. It isn't magic, it's organization.",
        accountable:
          "When a schedule slips, it slips for one of three reasons: permitting, a critical supplier, or planning error. The first two are outside our control and we say so to the client when it happens. The third is our contractual responsibility and triggers a penalty.",
      },
    },
    q4_7: {
      pt: {
        delays:
          "O projeto X tem hoje um atraso de três semanas face ao cronograma original. A causa é o atraso na emissão da licença municipal, que estava previsto para quinze de março e foi emitido a sete de abril. Estamos a recalcular o cronograma de montagem para recuperar duas das três semanas através de paralelização de operações em obra. A terceira semana é estrutural e está incorporada na nova data de entrega.",
        complaints:
          "Recebemos a sua nota sobre a humidade detetada no apartamento 3.2. A nossa equipa técnica está agendada para amanhã às nove para inspeção. Se for confirmada a causa que descreve, fica coberto pela garantia contratual e a reparação inicia esta semana. Mantemo-lo informado.",
        price_changes:
          "O preço acordado mantém-se. Houve variações nos custos de aço e betão entre o orçamento e o fecho do contrato, mas estão absorvidas pela nossa margem. Qualquer revisão futura seguirá o mecanismo previsto no contrato. Não há margem para renegociação fora desse mecanismo.",
        closures:
          "A obra encerra entre vinte e dois de dezembro e três de janeiro. Equipa de emergência continua disponível para qualquer questão estrutural. Cronograma de retoma a quatro de janeiro às oito horas.",
        refunds:
          "O reembolso do sinal pago a vinte de janeiro foi processado hoje. Vai entrar na sua conta nos próximos três dias úteis. Anexo o comprovativo da operação e o cálculo da retenção aplicada ao abrigo da cláusula nove do contrato.",
      },
      en: {
        delays:
          "Project X is three weeks behind the original schedule. The cause is the delay in issuing the municipal permit, originally expected on March fifteen and issued on April seven. We're recalculating the assembly schedule to recover two of the three weeks via parallelized site operations. The third week is structural and is reflected in the new delivery date.",
        complaints:
          "We received your note on the moisture detected in apartment 3.2. Our technical team is scheduled for tomorrow at nine for inspection. If the cause matches what you describe, it's covered by the contractual warranty and the repair starts this week. We'll keep you informed.",
        price_changes:
          "The agreed price stands. Steel and concrete costs varied between the original estimate and contract close, but are absorbed in our margin. Any future revision follows the mechanism defined in the contract. There's no room for renegotiation outside that mechanism.",
        closures:
          "The site is closed from December twenty-two to January three. An emergency team remains available for any structural issue. Resumption is scheduled for January four at eight.",
        refunds:
          "The refund of the deposit paid on January twenty was processed today. It will hit your account within three business days. Attached is the operation receipt and the retention calculation applied under clause nine of the contract.",
      },
    },
    q4_8: {
      pt: {
        precise:
          "A [BRAND_NAME] não comenta [TOPIC] porque essa decisão é da responsabilidade de outras partes envolvidas no projeto.",
        considered:
          "Sobre [TOPIC], a [BRAND_NAME] prefere não tomar posição publicamente. A decisão é de outros e cabe a eles comunicar quando quiserem.",
        conversational:
          "[TOPIC] não é assunto que a [BRAND_NAME] discuta em público. Quem decide isso somos nós.",
        accountable:
          "A [BRAND_NAME] não comenta [TOPIC]. Para perguntas sobre o nosso trabalho construtivo, estamos disponíveis nos canais habituais.",
      },
      en: {
        precise:
          "[BRAND_NAME] does not comment on [TOPIC] as that decision is the responsibility of other parties involved in the project.",
        considered:
          "On [TOPIC], [BRAND_NAME] prefers not to take a public position. The decision rests with others and it's for them to communicate when they choose.",
        conversational:
          "[TOPIC] isn't something [BRAND_NAME] discusses publicly. That's our call.",
        accountable:
          "[BRAND_NAME] does not comment on [TOPIC]. For questions about our construction work, we remain available through the usual channels.",
      },
    },
  },
  phase_5: {
    q5_1: {
      pt: [
        "previsibilidade contratual",
        "integração vertical",
        "tudo-em-fábrica",
        "cronograma como cláusula",
        "modelo digital único",
        "responsabilidade integrada",
        "obra é só montagem",
        "decisão construtiva",
        "auditabilidade do projeto",
        "promessa estrutural",
      ],
      en: [
        "contractual predictability",
        "vertical integration",
        "factory-first",
        "schedule as contract clause",
        "single digital model",
        "integrated accountability",
        "site is assembly only",
        "construction decision",
        "auditability",
        "structural promise",
      ],
    },
    q5_2: {
      pt: [
        { use: "previsibilidade contratual", instead_of: "qualidade premium" },
        { use: "responsabilidade integrada", instead_of: "serviço chave-na-mão" },
        { use: "decisão construtiva em fábrica", instead_of: "pré-fabricado" },
        { use: "cronograma assumido por contrato", instead_of: "prazo garantido" },
        { use: "modelo digital único", instead_of: "tecnologia BIM" },
        { use: "auditabilidade do projeto", instead_of: "transparência" },
        { use: "promotor-investidor", instead_of: "cliente" },
        { use: "tudo-em-fábrica", instead_of: "industrialização" },
      ],
      en: [
        { use: "contractual predictability", instead_of: "premium quality" },
        { use: "integrated accountability", instead_of: "turnkey service" },
        { use: "construction decision in the factory", instead_of: "prefab" },
        { use: "schedule committed by contract", instead_of: "guaranteed delivery" },
        { use: "single digital model", instead_of: "BIM technology" },
        { use: "auditability", instead_of: "transparency" },
        { use: "developer-investor", instead_of: "client" },
        { use: "factory-first", instead_of: "industrialization" },
      ],
    },
    q5_3: {
      quotation_marks: "double",
    },
    q5_4: {
      pt: [
        {
          term: "soluções inovadoras",
          bad_example: "Oferecemos soluções inovadoras para o seu projeto.",
          why_it_fails:
            "Não diz o que oferece nem o que tem de inovador; é vocabulário de pitch.",
          better_version:
            "Construímos em betão pré-fabricado com cronograma assumido por contrato.",
        },
        {
          term: "excelência",
          bad_example: "Comprometemo-nos com a excelência em cada obra.",
          why_it_fails:
            "Promessa não auditável; toda a gente diz isto.",
          better_version:
            "Defeitos pós-entrega ficam abaixo de um terço da média do setor.",
        },
      ],
      en: [
        {
          term: "innovative solutions",
          bad_example: "We offer innovative solutions for your project.",
          why_it_fails:
            "Doesn't say what's offered or what's innovative about it; it's pitch vocabulary.",
          better_version:
            "We build in precast concrete with a schedule committed by contract.",
        },
      ],
    },
  },
  phase_6: {
    q6_3: {
      instagram_enabled: false,
      linkedin_enabled: false,
    },
    q6_4: {
      instagram: "forbidden",
      linkedin: "forbidden",
      email: "forbidden",
      internal: "rare",
    },
    q6_6: {
      pt: [
        "Não usar adjetivos sem unidade ou referência verificável",
        "Não usar advérbios intensificadores",
        "Não usar verbos no futuro do conjuntivo a propósito de promessas",
      ],
      en: [
        "Do not use adjectives without a unit or verifiable reference",
        "Do not use intensifying adverbs",
        "Do not use future tense around commitments",
      ],
    },
  },
  phase_7: {
    q7_1: "skip_for_now",
  },
};

/** Phases marked complete on the seeded request (all 7). */
export const SAMPLE_COMPLETED_PHASES = [1, 2, 3, 4, 5, 6, 7];

/** Field IDs flattened into the `interview_conversation.completed_fields`
 * mirror so the progress sidebar lights up. */
export function flattenedFieldIds(): string[] {
  const out: string[] = [];
  for (const [phaseKey, fields] of Object.entries(SAMPLE_ANSWERS)) {
    for (const fieldId of Object.keys(fields)) {
      out.push(`${phaseKey}.${fieldId}`);
    }
  }
  return out.sort();
}
