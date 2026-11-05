/* Client Manager maturity framework: 4 pillars, 11 dimensions, 52 skills, 4 levels.
   Client-agnostic English version. Score scale used by the app: 4 = Expert ... 1 = Apprentice
   (the source deck numbers Expert as "Level 1"; the app inverts so that higher is better). */
(function (global) {
  "use strict";

  var LEVELS = [
    { id: 4, key: "expert", name: "Expert", color: "#0f1d4d", deckLabel: "Level 1" },
    { id: 3, key: "advanced", name: "Advanced", color: "#1b3485", deckLabel: "Level 2" },
    { id: 2, key: "intermediate", name: "Intermediate", color: "#0072bc", deckLabel: "Level 3" },
    { id: 1, key: "apprentice", name: "Apprentice", color: "#1aa1ff", deckLabel: "Level 4" }
  ];

  var PILLARS = [
    { id: "p1", name: "Knowledge & Diagnosis", color: "#0f1d4d" },
    { id: "p2", name: "Commercial Conversion", color: "#0a3558" },
    { id: "p3", name: "Capability Mobilization", color: "#00406e" },
    { id: "p4", name: "Execution & Performance", color: "#00568f" }
  ];

  // S(title, expert, advanced, intermediate, apprentice)
  function S(t, e, a, i, p) { return { t: t, l: [e, a, i, p] }; }

  var DIMS = [
    {
      n: 1, pillar: "p1", name: "Business Sophistication", short: "Business Sophistication",
      headline: "Thinks and speaks in the client’s financial and strategic language, not just IT; is perceived by the C-level as a business advisor with the credentials to shape their agenda.",
      skills: [
        S("Executive relationships and credentials",
          "Has the relationships and credentials to understand, shape and expand the strategic agendas of leaders inside the client.",
          "Maintains good relationships with functional leaders and can influence specific decisions, but not the overall strategic agenda.",
          "Has cordial but superficial relationships with client leaders; influence is limited to topics within their service scope.",
          "Lacks direct relationships with client leaders; contact happens through intermediaries or operational levels."),
        S("Financial and business language",
          "Thinks and speaks in terms of P&L, EBITDA, ROIC and client value creation, not just IT.",
          "Understands and uses the client’s basic financial concepts (revenue, costs, margins) to frame conversations, but does not master more sophisticated metrics such as ROIC.",
          "Recognizes the client’s financial terms when they are explained, but does not bring them proactively into the conversation.",
          "Focuses almost exclusively on technical or operational IT topics, without connecting to the client’s business language."),
        S("Macro, regulatory and industry foresight",
          "Anticipates the impact of macroeconomics, regulation and industry trends on the client’s strategy.",
          "Is aware of the main macro and regulatory trends in the sector, but reacts to them more than anticipates them.",
          "Has general industry knowledge, but relies on others (analysts, leaders) to identify macro or regulatory impacts.",
          "Is unaware of, or pays little attention to, the client’s macroeconomic and regulatory context."),
        S("Perceived role with the client",
          "Is perceived by the C-level as a business advisor, not as “the technology provider”.",
          "Is respected by middle and senior managers as a reliable business counterpart, though the relationship with the C-level is still limited or protocol-driven.",
          "Is seen mainly as a competent service or technology provider, with occasional interaction with executive levels.",
          "Interaction is limited to operational or technical levels; has no visibility or access to senior decision-makers.")
      ]
    },
    {
      n: 2, pillar: "p1", name: "Industry Knowledge", short: "Industry Knowledge",
      headline: "Masters the industry’s value chain, revenue models and KPIs; identifies disruptions before the client articulates them.",
      skills: [
        S("Value chain, revenue models and KPIs",
          "Masters the value chain, revenue models, KPIs and specific challenges of the client’s industry.",
          "Knows the value chain and the main industry KPIs well, though understanding of the more complex revenue models is limited.",
          "Has a general understanding of the client’s industry, but needs support or research to go deeper on KPIs or specific challenges.",
          "Has superficial or generic industry knowledge; cannot distinguish the particularities of the client’s sector."),
        S("Spotting disruptions and opportunities",
          "Identifies disruptions and opportunities before the client articulates them.",
          "Identifies disruptions and opportunities once they are already visible in the industry, but does not get ahead of the client.",
          "Recognizes disruptions or opportunities only after the client or other market players point them out.",
          "Does not identify disruptions or opportunities proactively; learns about them from third parties."),
        S("Industry presence and recognition",
          "Participates in industry forums and associations as a recognized reference.",
          "Participates regularly in industry forums or events, though not yet recognized as a reference.",
          "Occasionally attends industry events, mainly as an observer.",
          "Does not participate in industry forums or associations; exposure to the industry is limited to the client’s context.")
      ]
    },
    {
      n: 3, pillar: "p1", name: "Applied Technology Knowledge", short: "Applied Technology",
      headline: "Translates complex technology capabilities (AI, cloud, core banking) into concrete business value and anticipates the technologies relevant to the client in the next 12–24 months.",
      skills: [
        S("Translating technology into business value",
          "Translates complex technology capabilities (AI, cloud, core banking, etc.) into concrete business value.",
          "Explains technology capabilities in general terms of benefit, but struggles to connect more complex or emerging technologies to specific business value.",
          "Understands technologies conceptually but depends on technical specialists to translate them into business value.",
          "Has difficulty explaining technology capabilities even in general terms; limits themselves to repeating what the technical team says."),
        S("Challenging technical proposals",
          "Challenges the delivery team’s technical proposals with their own judgment.",
          "Asks reasonable questions about technical proposals, though not always with enough depth to challenge them thoroughly.",
          "Reviews technical proposals mainly for form and overall coherence, without going into the technical substance.",
          "Accepts the delivery team’s technical proposals without questioning or critically analyzing them."),
        S("Technology foresight (12–24 months)",
          "Stays current and anticipates which technologies will be relevant to the client in the next 12–24 months.",
          "Stays reasonably current on technology trends, but does not manage to anticipate precisely their future relevance for the client.",
          "Knows general market technology trends without connecting them specifically to the client.",
          "Technology knowledge is outdated or limited to what is used day to day in operations."),
        S("Solution architecture literacy",
          "Is able to articulate and understand solution architectures that flow and make sense for the client.",
          "Understands already-developed solution architectures and can explain them, though does not articulate them from scratch with fluency.",
          "Understands solution architectures at a basic level, requiring technical support to explain them clearly to the client.",
          "Does not understand or cannot explain solution architectures; depends entirely on the technical team.")
      ]
    },
    {
      n: 4, pillar: "p1", name: "Strategic Understanding of Competitors: Who Is Who", short: "Competitors",
      headline: "Articulates who is who among competitors: their position, sponsors inside the client, agendas and the strategy to displace them (Power Map in action).",
      skills: [
        S("Competitive ecosystem mapping",
          "Precisely maps the competitive ecosystem (direct providers, alternatives, new entrants).",
          "Knows the main direct competitors, though the view of alternatives and new entrants is incomplete.",
          "Identifies only the most obvious or historical competitors, without updating the map frequently.",
          "Has a vague or outdated knowledge of the competitive landscape."),
        S("Competitive account strategy",
          "Designs account strategies that anticipate and counter competitor moves.",
          "Adjusts the account strategy when detecting competitor moves, but reactively rather than in anticipation.",
          "Recognizes when competitors gain ground, but does not translate that into concrete strategic adjustments.",
          "Does not incorporate competitive considerations into account planning."),
        S("Relative strengths and weaknesses",
          "Knows our company’s relative strengths and weaknesses versus competitors by service line.",
          "Knows our company’s general strengths and weaknesses versus the competition, without the same level of detail by service line.",
          "Has a general notion of how our company compares with competitors, based more on perception than on analysis.",
          "Does not know how our company is positioned against its competitors."),
        S("Competitor sponsors inside the client",
          "Knows the competition’s sponsors inside the client and executes executive-endorsed strategies to counter them; builds relationships with those sponsors to gain competitive intelligence.",
          "Identifies who the competition’s sponsors are inside the client, but has not developed a direct relationship with them or a formal strategy to counter them.",
          "Is aware that competitor sponsors exist, without clarity on who they are or how to approach them.",
          "Does not identify or consider the competition’s sponsors inside the client.")
      ]
    },
    {
      n: 5, pillar: "p2", name: "Demand Creation and Response", short: "Demand Creation",
      headline: "Proactively generates demand from business insights and turns ambiguous client needs into differentiated value propositions.",
      skills: [
        S("Proactive demand generation",
          "Proactively generates demand from business insights (not just responding to RFPs).",
          "Occasionally generates opportunities from their own insights, though most activity is still centered on responding to existing demand.",
          "Responds mainly to RFPs or explicit client requests, with little proactive demand generation.",
          "Depends entirely on the client or the organization to assign opportunities; does not generate demand on their own."),
        S("Turning ambiguity into value propositions",
          "Turns ambiguous client needs into differentiated value propositions.",
          "Builds solid proposals when the client’s need is reasonably clear, but struggles with high ambiguity.",
          "Requires the need to be well defined by the client or by others in order to structure a proposal.",
          "Cannot advance proposals when the client’s need is not clearly specified."),
        S("Growth within existing contracts",
          "Creates new services derived from existing contracts.",
          "Identifies expansion opportunities within existing contracts, though does not always turn them into formalized new services.",
          "Manages existing contracts correctly, but rarely identifies growth opportunities within them.",
          "Manages contracts passively, without looking for opportunities for new services."),
        S("Sales process orchestration",
          "Handles the complexities of the sales process, including the dedicated team and the resources needed.",
          "Adequately coordinates the team and resources in medium-complexity sales processes, but needs support in the most complex ones.",
          "Participates in the sales process but depends on others to coordinate the team and resources.",
          "Has difficulty organizing the team and resources needed for a sales process, even a low-complexity one."),
        S("Go / no-go decisions",
          "Makes proactive go/no-go decisions on the opportunities that come up.",
          "Actively participates in the go/no-go decision, though generally validates with their leader before deciding.",
          "Provides input for the go/no-go decision, but does not make or drive it directly.",
          "Does not take part in go/no-go evaluation; follows assigned opportunities without questioning them.")
      ]
    },
    {
      n: 6, pillar: "p2", name: "Solution Structuring", short: "Solution Structuring",
      headline: "Designs integrated architectures that combine services, technology and commercial models, aligning the interests of the client and of our company.",
      skills: [
        S("Integrated solution design",
          "Designs integrated solution architectures that combine services, technology and commercial models to solve the client’s complex problems.",
          "Designs solid solutions for medium-complexity problems, but needs support to integrate all components in very complex ones.",
          "Contributes to specific parts of the solution design, without leading the full integration.",
          "Does not participate in solution design; limits themselves to passing requirements to the technical team."),
        S("Cross-unit and partner integration",
          "Integrates capabilities from multiple business units, service lines and partners into a coherent, viable proposal.",
          "Integrates capabilities from two or three known areas or partners, but struggles to orchestrate proposals involving multiple units at once.",
          "Works mainly with the offering of their own service line, with little integration of other units or partners.",
          "Does not integrate capabilities from other business units or partners into their proposals."),
        S("Balancing innovation, feasibility and profitability",
          "Balances innovation, technical feasibility and profitability, avoiding over-design or unrealistic promises.",
          "Generally achieves a good balance among these factors, though occasionally over-designs or underestimates feasibility risks.",
          "Tends to prioritize one of the factors (often innovation or price) at the expense of the others.",
          "Fails to balance these factors; frequently proposes solutions that are technically or financially unviable."),
        S("Commercial model design",
          "Adapts the commercial model (transactional, FTE + variable, gain-sharing) to the nature of the solution and the client’s risk appetite.",
          "Knows and correctly applies the standard commercial models, though needs support to design models such as gain-sharing.",
          "Uses the predefined or most common commercial model, without actively adapting it to the client’s situation.",
          "Has no clarity on the available commercial models or on when to apply each one."),
        S("Anticipating objections",
          "Anticipates the client’s technical, operational or financial objections and resolves them within the design itself.",
          "Responds well to objections when they arise, though does not always anticipate them from the initial design.",
          "Requires support from others to resolve technical or financial objections when they appear.",
          "Is frequently surprised by client objections that had not been considered."),
        S("Executive narrative",
          "Simplifies complex solutions into a clear narrative for executive audiences.",
          "Explains complex solutions in an understandable way, though with a level of technical detail that is not optimal for executives.",
          "Tends to explain solutions with a level of technical detail that makes them hard for executives to understand.",
          "Cannot communicate complex solutions clearly to either technical or executive audiences.")
      ]
    },
    {
      n: 7, pillar: "p2", name: "Consultative Sales Execution, Negotiation and Close", short: "Sales & Close",
      headline: "Orchestrates and takes a deal from structuring all the way to close on terms favorable to our company.",
      skills: [
        S("Complex negotiations",
          "Leads complex negotiations (commercial, legal, risk) while maintaining margin and relationship.",
          "Negotiates well in medium-complexity situations, though in very complex negotiations needs support to protect margin and relationship at the same time.",
          "Takes part in negotiations supporting others, but does not lead them independently.",
          "Avoids or delegates complex negotiations; struggles to hold positions under pressure."),
        S("Long-cycle sales momentum",
          "Executes long-cycle consultative sales with multiple stakeholders without losing momentum.",
          "Keeps the sales process moving in long cycles, though occasionally loses momentum when many stakeholders are involved.",
          "Manages short-cycle sales or sales with few stakeholders well, but struggles to sustain the process in long, complex cycles.",
          "The sales process frequently loses momentum; cannot sustain follow-up in long cycles."),
        S("Closing on favorable terms",
          "Closes win-win agreements even in scenarios of high price or competitive pressure.",
          "Closes favorable agreements under normal conditions, though under high pressure tends to concede more than necessary.",
          "Manages to close agreements, but frequently sacrifices margin or favorable terms to do so.",
          "Has difficulty closing agreements; the process stalls or requires others’ intervention to conclude.")
      ]
    },
    {
      n: 8, pillar: "p3", name: "Alliances", short: "Alliances",
      headline: "Develops and uses collaborative relationships to create new solutions and sellable offerings, aligning interests so that our company is the partner of choice.",
      skills: [
        S("Partner ecosystem orchestration",
          "Orchestrates partner ecosystems (hyperscalers, ISVs, boutiques) to solve client needs.",
          "Works well with one or two known partners, though struggles to orchestrate a broader, more diverse ecosystem.",
          "Collaborates with partners once they are already assigned, without actively leading their orchestration.",
          "Does not involve partners in solving client needs."),
        S("Partnership agreements",
          "Negotiates and structures partnership agreements that broaden the value proposition.",
          "Participates in negotiating partnership agreements, though generally with others’ support to structure them formally.",
          "Knows the existing partnership agreements, but does not actively participate in negotiating them.",
          "Is unaware of the partnership mechanisms available or how to take advantage of them."),
        S("Trusted partner contact",
          "Is recognized by strategic partners as a trusted point of contact.",
          "Has a good relationship with the partners they work with regularly, though is not widely recognized as a strategic point of contact.",
          "The relationship with partners is mainly transactional and one-off.",
          "Has no direct relationship with strategic partners."),
        S("Partner monetization",
          "Is able to monetize the relationships with strategic partners.",
          "Identifies monetization opportunities with partners, though needs support to make them concrete.",
          "Has relationships with partners but does not translate them into concrete commercial opportunities.",
          "Does not consider partners as a source of monetization."),
        S("Partner funding",
          "Is able to obtain funds from strategic partners.",
          "Knows that partner funding programs exist and has participated in managing them, though not autonomously.",
          "Has limited knowledge of the funding programs available with partners.",
          "Is unaware that partners offer funding mechanisms.")
      ]
    },
    {
      n: 9, pillar: "p3", name: "Internal Influence and Knowledge of the Organization", short: "Internal Influence",
      headline: "Uses an understanding of the organization’s structure, processes and dynamics in favor of the client, under an Account Plan aligned to the competitive position and to the challenges of both sides.",
      skills: [
        S("Cross-unit resource mobilization",
          "Mobilizes cross-unit resources without formal authority, using influence and relationships.",
          "Manages to mobilize resources from other areas when there is a prior relationship, but struggles in new areas or without prior contact.",
          "Requires the support of their leader or third parties to mobilize resources outside their unit.",
          "Cannot mobilize resources from other units; their management is limited to their own team or area."),
        S("Organizational map and decision processes",
          "Knows the structure, decision processes and “who moves what” inside the company.",
          "Knows well the structure and processes of the areas they interact with regularly, with less visibility of other parts of the organization.",
          "Has basic knowledge of the organizational structure, without clarity on decision processes.",
          "Does not know the organizational structure beyond their immediate team."),
        S("Go-to reference for complex situations",
          "Is sought out by other Client Managers and leaders to unblock complex situations.",
          "Is occasionally consulted by colleagues on topics of their specialty, though is not a generalized reference.",
          "Resolves complex situations within their own account, without being sought out by others for that purpose.",
          "Is not perceived as a reference for resolving complex situations, not even within their own team."),
        S("Culture and internal alliances",
          "Understands the structure, processes, dynamics and culture of the organization to build internal alliances.",
          "Understands the organizational culture and dynamics reasonably well, though their network of internal alliances is still limited.",
          "Has a basic understanding of the organizational culture, with few active internal alliances.",
          "Does not understand or navigate well the organization’s internal culture and dynamics."),
        S("Developing the talent around them",
          "Develops the talent involved.",
          "Supports talent development on a one-off basis, without a systematic approach.",
          "Focuses on task execution more than on developing the people involved.",
          "Does not invest time or effort in developing the talent around them.")
      ]
    },
    {
      n: 10, pillar: "p4", name: "Financial Performance of Our Business", short: "Financial Performance",
      headline: "Interprets financial information, identifies risks and opportunities, and implements change programs to maximize profitability.",
      skills: [
        S("Account P&L ownership",
          "Manages the account with a P&L vision of their own: margins, service mix, profitability per project.",
          "Monitors margins and profitability regularly, though with less depth in the analysis of the service mix.",
          "Reviews the account’s basic financial indicators when requested, without proactive management.",
          "Has no visibility into, and does not actively manage, the account’s financial indicators."),
        S("Pricing and investment decisions",
          "Makes account pricing and investment decisions based on rigorous financial analytics.",
          "Makes reasonable pricing decisions based on historical references, with less rigorous financial analysis.",
          "Follows predefined pricing guidelines, without adapting decisions based on their own analysis.",
          "Does not participate in pricing or investment decisions; they are made entirely by others."),
        S("Anticipating financial deviations",
          "Anticipates and corrects financial deviations before they become a problem.",
          "Detects financial deviations in a timely way, though their capacity for proactive correction is limited.",
          "Identifies financial deviations only when they are already evident or are pointed out to them.",
          "Financial deviations are detected late, generally by third parties."),
        S("Revenue growth versus competition",
          "Grows revenue faster than the competition within their client.",
          "Achieves sustained revenue growth in the account, though not necessarily above the competition’s pace.",
          "Maintains the account’s revenue level, with limited or sporadic growth.",
          "The account’s revenue stays stagnant or in decline."),
        S("Investment proposals",
          "Proposes, presents and manages the necessary investments, both commercial and of other kinds.",
          "Proposes targeted investments when they are evidently necessary, with less proactivity in identifying them.",
          "Executes investments that are already approved, without actively participating in proposing them.",
          "Neither proposes nor manages investments for the growth of the account."),
        S("Short-, medium- and long-term balance",
          "Balances the short, medium and long term.",
          "Reasonably balances the short and medium term, with less strategic focus on the long term.",
          "Focuses mainly on short-term results, with little medium- or long-term planning.",
          "Acts completely reactively, with no medium- or long-term vision."),
        S("Long-term retention of the client",
          "Secures the long-term permanence of the client.",
          "Maintains stable relationships with the client, though without an explicit long-term retention strategy.",
          "The client relationship is sustained mainly by operational delivery, without active management of retention.",
          "The client relationship is vulnerable; no actions exist to ensure its continuity."),
        S("Meeting financial objectives",
          "Meets the healthy financial objectives of our company.",
          "Meets the financial objectives most of the time, with occasional deviations.",
          "Partially meets the financial objectives, with frequent deviations.",
          "Does not consistently meet the account’s financial objectives.")
      ]
    },
    {
      n: 11, pillar: "p4", name: "Delivery Management and Talent Development", short: "Delivery & Talent",
      headline: "Meets client needs, builds productive relationships, sets up the right governance and maximizes NPS and client satisfaction.",
      skills: [
        S("End-to-end delivery quality",
          "Ensures end-to-end delivery quality without the client needing to escalate.",
          "Maintains good delivery quality in general, though occasionally requires client escalations.",
          "Delivery quality is inconsistent, generating escalations with some frequency.",
          "Delivery shows recurring problems that require frequent client escalation."),
        S("Developing the account team",
          "Actively develops the account team, training the next generation of Client Managers.",
          "Supports the development of their team regularly, though without a systematic approach to training future Client Managers.",
          "Focuses on the operational management of the team, with limited talent development.",
          "Does not invest in the development of their account team."),
        S("Delivery crisis management",
          "Is a role model in how delivery crises are managed while maintaining client trust.",
          "Manages delivery crises adequately, though with some erosion of the client’s trust.",
          "Manages delivery crises with support from others, with a notable impact on the client’s trust.",
          "Delivery crises cause significant loss of trust and require intervention from higher levels."),
        S("Client advocacy and references",
          "The client willingly serves as a reference and gives testimonials.",
          "The client has a positive perception and might consider giving a reference, though it has not been formally requested or confirmed.",
          "The relationship with the client is fine, but not solid enough to expect them to serve as a reference.",
          "The client would hardly serve as a reference given their level of satisfaction with the service."),
        S("Ultimate accountability for delivery",
          "Is ultimately accountable for the successful delivery of any project.",
          "Takes responsibility for delivery on most projects, though on the most complex ones shares that responsibility with others.",
          "Participates in project delivery, but ultimate responsibility rests more with the delivery team.",
          "Does not take responsibility for delivery; limits themselves to the commercial relationship with the client.")
      ]
    }
  ];

  var skills = [];
  var dimensions = DIMS.map(function (d) {
    var dim = {
      id: "d" + d.n, n: d.n, pillar: d.pillar, name: d.name, short: d.short, headline: d.headline, skills: []
    };
    d.skills.forEach(function (s, i) {
      var sk = { id: dim.id + "s" + (i + 1), dimId: dim.id, dimN: d.n, idx: i + 1, num: d.n + "." + (i + 1), title: s.t, levels: s.l };
      dim.skills.push(sk);
      skills.push(sk);
    });
    return dim;
  });

  var byId = {};
  dimensions.forEach(function (d) { byId["dim:" + d.id] = d; });
  skills.forEach(function (s) { byId["skill:" + s.id] = s; });

  global.Framework = {
    levels: LEVELS,
    pillars: PILLARS,
    dimensions: dimensions,
    skills: skills,
    dim: function (id) { return byId["dim:" + id]; },
    skill: function (id) { return byId["skill:" + id]; },
    pillar: function (id) { return PILLARS.filter(function (p) { return p.id === id; })[0]; },
    level: function (id) { return LEVELS.filter(function (l) { return l.id === id; })[0]; },
    // text for a skill at a given score level (4..1)
    text: function (skill, level) { return skill.levels[4 - level]; }
  };
})(window);
