"use client";

// Client-facing report: practical website findings lead, technical scores support.

// CHROME PRINT FIX: three content-led pages with no fixed page height,
// blank sheets or recommended-next-step line.

import { getProfileFallbacks } from "../lib/templateUtils";
import { getScoreStyles } from "../lib/scoreColors";
import type { UserProfile } from "../lib/profileStorage";
import type { TechStack } from "../lib/techStack";

type IssueSeverity = "high" | "medium" | "low" | "review";

type SitePageResult = {
  url: string;
  pageType: string;
  status: string;
  httpStatus?: number | null;
  error?: string | null;
  title: string;
  metaDescription: string;
  h1Count: number;
  canonicalPresent: boolean;
  robotsNoindex: boolean;
  langPresent: boolean;
  viewportPresent: boolean;
  imageCount: number;
  imagesMissingAlt: number;
  structuredDataPresent: boolean;
  structuredDataTypes: string[];
  ogPresent: boolean;
  internalLinks: number;
  externalLinks: number;
  formCount: number;
  phoneLinks: string[];
  emailLinks: string[];
  ctaLabels: string[];
  newsletterPresent: boolean;
  accountEntryPoint: boolean;
};

type IssueSummaryItem = {
  key: string;
  label: string;
  count: number;
  percentage: number;
  severity: IssueSeverity;
  interpretation: string;
};

type LighthouseFinding = {
  id: string;
  categoryLabel: string;
  title: string;
  priority: "high" | "medium" | "low";
  displayValue?: string | null;
  savingsMs?: number | null;
  savingsBytes?: number | null;
  affectedItemCount?: number;
};

type DeepResult = {
  url: string;
  pageType: string;
  pageTitle?: string | null;
  error?: string | null;
  scores: {
    mobile: {
      performance: number;
      seo: number;
      accessibility: number;
      bestPractices: number;
    };
    desktop?: {
      performance: number;
      seo: number;
      accessibility: number;
      bestPractices: number;
    } | null;
    evidence?: {
      mobile?: { topFindings?: LighthouseFinding[] } | null;
      desktop?: { topFindings?: LighthouseFinding[] } | null;
    };
  } | null;
};

type RecommendedEvent = {
  event: string;
  trigger: string;
  purpose: string;
};

type JourneySummary = {
  pageTypes: string[];
  formCount: number;
  pagesWithForms: number;
  pagesWithPhoneLinks: number;
  pagesWithEmailLinks: number;
  newsletterPresent: boolean;
  accountEntryPoint: boolean;
  ctaLabels: string[];
  observations: string[];
  opportunities: string[];
  analyticsDetected: string[];
  recommendedEvents: RecommendedEvent[];
};

type SiteReport = {
  executiveSummary: string;
  strengths: string[];
  keyIssues: string[];
  businessImpact: string[];
  analyticsStatement: string;
  journeyObservations: string[];
  journeyOpportunities: string[];
  recommendations: string[];
  roadmap: {
    immediate: string[];
    nearTerm: string[];
    ongoing: string[];
  };
  scopeNotes: string[];
  businessOverview?: string;
  audiences?: string[];
  proofPoints?: string[];
  positioningDirection?: string;
  pageObservations?: Array<{
    pageType: string;
    url?: string;
    strength: string;
    priority: string;
  }>;
  priorities?: Array<{
    title: string;
    finding: string;
    impact: string;
    action: string;
    tone?: "urgent" | "important" | "measure";
  }>;
};

export type FullSiteAuditResult = {
  success: boolean;
  generatedAt?: string;
  discovery?: {
    discoveredPages: string[];
    recommendedPages: string[];
    discoveredCount: number;
    reviewedPageCount?: number;
    discoveryLimited?: boolean;
    source: string;
    url: string;
    origin: string;
  };
  lightweightResults?: SitePageResult[];
  issueSummary?: IssueSummaryItem[];
  selectedDeepAuditPages?: string[];
  deepResults?: DeepResult[];
  deepSummary?: {
    attemptedCount: number;
    count: number;
    failedCount: number;
    averageMobilePerformance: number | null;
    homepageDesktopPerformance: number | null;
    averageAccessibility: number | null;
    averageBestPractices: number | null;
    averageSeo: number | null;
  };
  techStack?: TechStack;
  journeySummary?: JourneySummary;
  siteReport?: SiteReport;
  error?: string;
};

type Props = {
  result: FullSiteAuditResult;
  profile?: Partial<UserProfile>;
};

type ClientPriority = {
  title: string;
  finding: string;
  impact: string;
  action: string;
  tone: "urgent" | "important" | "measure";
};

type ReportFinding = LighthouseFinding & {
  pageType: string;
  url: string;
  sourceOrder: number;
};

type WebsiteFinding = {
  label: string;
  title: string;
  finding: string;
  opportunity: string;
  tone: "high" | "medium" | "review";
};

type EvidenceProfile = {
  contactPages: SitePageResult[];
  utilityPages: SitePageResult[];
  projectPages: SitePageResult[];
  caseStudyPages: SitePageResult[];
  pagesWithoutH1: SitePageResult[];
  pagesWithMultipleH1s: SitePageResult[];
  repeatedDescriptionPageCount: number;
  missingAltCount: number;
  pagesWithoutStructuredData: SitePageResult[];
  formPages: SitePageResult[];
};

const SERVICES = [
  "Website development, improvements and ongoing technical support",
  "Performance, accessibility and technical SEO improvements",
  "Customer-journey and conversion-pathway improvements",
  "Analytics, conversion tracking and reporting",
  "CMS, forms, CRM and third-party integrations",
  "Ongoing testing and optimisation based on real evidence",
];

const AUSPAYNET_SERVICES = [
  "Drupal website development, improvements and ongoing technical support",
  "Information architecture, navigation and content-structure improvements",
  "Performance, accessibility and technical SEO improvements",
  "CMS content types, taxonomy, search and filtering",
  "Publication, resource and document-library improvements",
  "Analytics, testing and ongoing optimisation based on real evidence",
];

const ENGAGEMENT_OPTIONS = [
  {
    title: "Focused fixes",
    description:
      "A contained technical, performance, accessibility or conversion issue with a clearly defined outcome.",
  },
  {
    title: "Priority improvement package",
    description:
      "A selected group of high-value page, journey or system improvements delivered as one practical scope.",
  },
  {
    title: "Staged website project",
    description:
      "A broader website improvement or rebuild delivered in agreed stages so priorities and investment remain manageable.",
  },
  {
    title: "Ongoing support",
    description:
      "Flexible website management, reporting, testing and continuous improvement after the initial work.",
  },
];

function list<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : [];
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function pagePath(value: string) {
  try {
    const url = new URL(value);
    return url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, "");
  } catch {
    return value;
  }
}

function pageSearchText(page: SitePageResult) {
  return `${page.pageType} ${page.title} ${page.url}`.toLowerCase();
}

function isContactPage(page: SitePageResult) {
  return /\bcontact(?:[-_\s]|$)|\benquir(?:y|ies)\b/.test(
    pageSearchText(page),
  );
}

function isUtilityOrCommercePage(page: SitePageResult) {
  const path = pagePath(page.url).toLowerCase();
  const text = pageSearchText(page);

  return (
    /\/(?:shop|cart|basket|checkout|my-account|account|refunds?|returns?|wishlist)(?:\/|$)/.test(
      `${path}/`,
    ) ||
    /\b(?:shopping cart|checkout|my account|refunds and returns|refunds|wishlist)\b/.test(
      text,
    )
  );
}

function isProjectPage(page: SitePageResult) {
  return /\bprojects?\b/.test(pageSearchText(page));
}

function isCaseStudyPage(page: SitePageResult) {
  return /\bcase[-_\s]?stud(?:y|ies)\b/.test(pageSearchText(page));
}

function collectedPublicUrls(result: FullSiteAuditResult) {
  return unique([
    ...list(result.discovery?.discoveredPages),
    ...list(result.discovery?.recommendedPages),
    ...list(result.lightweightResults).map((page) => page.url),
  ]);
}

function urlsMatchingPath(urls: string[], pattern: RegExp) {
  return urls.filter((url) => pattern.test(`${pagePath(url).toLowerCase()}/`));
}

function normaliseDescription(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildEvidenceProfile(pages: SitePageResult[]): EvidenceProfile {
  const okPages = pages.filter((page) => page.status === "ok");
  const descriptionGroups = new Map<string, number>();

  okPages.forEach((page) => {
    const description = normaliseDescription(page.metaDescription || "");

    if (description.length < 20) return;

    descriptionGroups.set(
      description,
      (descriptionGroups.get(description) || 0) + 1,
    );
  });

  const repeatedDescriptions = new Set(
    Array.from(descriptionGroups.entries())
      .filter(([, count]) => count > 1)
      .map(([description]) => description),
  );

  return {
    contactPages: okPages.filter(isContactPage),
    utilityPages: okPages.filter(isUtilityOrCommercePage),
    projectPages: okPages.filter(isProjectPage),
    caseStudyPages: okPages.filter(isCaseStudyPage),
    pagesWithoutH1: okPages.filter((page) => page.h1Count === 0),
    pagesWithMultipleH1s: okPages.filter((page) => page.h1Count > 1),
    repeatedDescriptionPageCount: okPages.filter((page) =>
      repeatedDescriptions.has(normaliseDescription(page.metaDescription || "")),
    ).length,
    missingAltCount: okPages.reduce(
      (total, page) => total + Math.max(0, page.imagesMissingAlt || 0),
      0,
    ),
    pagesWithoutStructuredData: okPages.filter(
      (page) => !page.structuredDataPresent,
    ),
    formPages: okPages.filter((page) => page.formCount > 0),
  };
}

function reportPageLabel(pageType: string, url: string) {
  const pageIdentity = `${pageType} ${pagePath(url)}`.toLowerCase();

  if (/homepage|\/$/.test(pageIdentity)) return "Homepage";
  if (/\bcontact\b|contact-us/.test(pageIdentity)) return "Contact";
  if (/\bteam\b|our-team/.test(pageIdentity)) return "Team";
  if (/\bservices?\b|our-services/.test(pageIdentity)) return "Services";
  if (/\bprojects?\b/.test(pageIdentity)) return "Projects";
  if (/case[-_\s]?stud(?:y|ies)/.test(pageIdentity)) return "Case studies";

  if (pageType && !/^other$/i.test(pageType)) return pageType;

  const path = pagePath(url);

  const segment = path
    .split("/")
    .filter(Boolean)
    .at(-1)
    ?.replace(/-\d+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  if (!segment) return pageType || "Page";

  return segment.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function clientName(result: FullSiteAuditResult) {
  const homepage = list(result.lightweightResults).find(
    (page) => page.pageType === "Homepage",
  );

  const titleParts =
    homepage?.title
      ?.split(/\s+[|–—]\s+|\s+-\s+/)
      .map((part) => part.trim())
      .filter(Boolean) || [];

  const title = titleParts.find(
    (part) =>
      part.length <= 80 &&
      !/^(?:home|homepage|welcome|official site|website)$/i.test(part),
  );

  if (title) return title;

  const host = result.discovery?.origin || result.discovery?.url || "";

  return hostname(host)
    .split(".")[0]
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function humanList(values: string[]) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];

  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

function scoreHex(score: number | null | undefined) {
  if (typeof score !== "number") return "#64748b";
  return getScoreStyles(score).hex;
}

function scoreMeaning(
  kind: "performance" | "seo" | "accessibility" | "bestPractices",
  score: number | null | undefined,
) {
  if (typeof score !== "number") return "Not tested";

  if (kind === "performance") {
    if (score < 50) return "Priority improvement area";
    if (score < 90) return "Needs improvement";
    return "Strong result";
  }

  if (kind === "seo") {
    if (score >= 90) return "Strong automated checks";
    if (score >= 70) return "Automated checks show gaps";
    return "Automated checks need attention";
  }

  if (kind === "accessibility") {
    if (score >= 90) return "Strong automated result";
    if (score >= 70) return "Good foundation; issues remain";
    return "Accessibility needs attention";
  }

  if (score >= 90) return "Strong technical foundation";
  if (score >= 70) return "Good foundation with gaps";

  return "Technical checks need attention";
}

function friendlyFindingTitle(finding: LighthouseFinding) {
  const value = `${finding.id} ${finding.title}`.toLowerCase();

  if (
    value.includes("unused-javascript") ||
    value.includes("unused javascript")
  )
    return "Remove website code that visitors do not need";

  if (
    value.includes("total-blocking-time") ||
    value.includes("total blocking time")
  )
    return "Reduce the time the page remains unresponsive";

  if (
    value.includes("largest-contentful-paint") ||
    value.includes("largest contentful paint")
  )
    return "Show the main page content sooner";

  if (
    value.includes("first-contentful-paint") ||
    value.includes("first contentful paint")
  )
    return "Show the first page content sooner";

  if (value.includes("speed-index") || value.includes("speed index"))
    return "Make the page feel visually complete sooner";

  if (value.includes("alt") && value.includes("image"))
    return "Add descriptions to important images";

  if (value.includes("user-scalable") || value.includes("maximum-scale"))
    return "Allow visitors to zoom properly on mobile";

  if (value.includes("contrast"))
    return "Improve text and background colour contrast";

  if (value.includes("discernible name") || value.includes("link-name"))
    return "Give every link a clear readable label";

  if (value.includes("tap target"))
    return "Make buttons and links easier to tap";

  if (value.includes("heading") && value.includes("order"))
    return "Correct the page heading order";

  if (value.includes("render-blocking"))
    return "Load important page content first";

  if (value.includes("unused css")) return "Remove unused styling code";

  if (value.includes("responsive image"))
    return "Serve images at the right size";

  if (value.includes("modern image"))
    return "Use more efficient image formats";

  return finding.title;
}

function findingImpact(finding: LighthouseFinding) {
  const category = finding.categoryLabel.toLowerCase();

  if (category.includes("performance"))
    return "This can make the page feel slow or unresponsive, especially on mobile.";

  if (category.includes("accessibility"))
    return "This can make the page harder to use with zoom, screen readers, keyboards or touch controls.";

  if (category.includes("seo"))
    return "This can reduce how clearly search engines understand and present the page.";

  return "This should be reviewed to improve reliability, usability and visitor trust.";
}

function buildFindingEvidence(finding: LighthouseFinding) {
  const evidence: string[] = [];

  if (finding.displayValue) evidence.push(finding.displayValue);

  if (
    typeof finding.savingsMs === "number" &&
    finding.savingsMs > 0 &&
    !/\b(?:ms|milliseconds?|seconds?|sec|s)\b/i.test(
      finding.displayValue || "",
    )
  ) {
    evidence.push(`${Math.round(finding.savingsMs)} ms estimated improvement`);
  }

  if (
    typeof finding.savingsBytes === "number" &&
    finding.savingsBytes > 0 &&
    !/\b(?:KiB|MiB|KB|MB|bytes?)\b/i.test(finding.displayValue || "")
  ) {
    evidence.push(
      `${Math.round(finding.savingsBytes / 1024)} KiB potential reduction`,
    );
  }

  if (
    typeof finding.affectedItemCount === "number" &&
    finding.affectedItemCount > 0
  ) {
    evidence.push(
      `${finding.affectedItemCount} affected item${
        finding.affectedItemCount === 1 ? "" : "s"
      }`,
    );
  }

  return unique(evidence).join("; ");
}

function selectTechnicalFindings(
  deepResults: DeepResult[],
  limit = 10,
): ReportFinding[] {
  const weight = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const candidates = deepResults
    .flatMap((item) =>
      list(item.scores?.evidence?.mobile?.topFindings).map((finding) => ({
        ...finding,
        pageType: item.pageType,
        url: item.url,
        sourceOrder: 0,
      })),
    )
    .map((finding, index) => ({
      ...finding,
      sourceOrder: index,
    }))
    .sort((a, b) => {
      const priority = weight[b.priority] - weight[a.priority];

      if (priority !== 0) return priority;

      const time = (b.savingsMs || 0) - (a.savingsMs || 0);

      if (time !== 0) return time;

      const bytes = (b.savingsBytes || 0) - (a.savingsBytes || 0);

      return bytes !== 0 ? bytes : a.sourceOrder - b.sourceOrder;
    });

  const selected: ReportFinding[] = [];
  const seen = new Set<string>();
  const auditCounts = new Map<string, number>();

  function add(finding?: ReportFinding, enforceAuditLimit = true) {
    if (!finding || selected.length >= limit) return false;

    const key = `${finding.url}:${finding.id}`;
    const currentCount = auditCounts.get(finding.id) || 0;

    if (seen.has(key) || (enforceAuditLimit && currentCount >= 2)) {
      return false;
    }

    seen.add(key);
    auditCounts.set(finding.id, currentCount + 1);
    selected.push(finding);

    return true;
  }

  ["Performance", "Accessibility", "SEO", "Best Practices"].forEach(
    (category) =>
      add(candidates.find((finding) => finding.categoryLabel === category)),
  );

  deepResults.forEach((page) =>
    add(
      candidates.find(
        (finding) =>
          finding.url === page.url &&
          !seen.has(`${finding.url}:${finding.id}`),
      ),
    ),
  );

  candidates.forEach((finding) => add(finding));

  if (selected.length < limit) {
    candidates.forEach((finding) => add(finding, false));
  }

  return selected.slice(0, limit);
}

function isBusinessChicksReport(result: FullSiteAuditResult) {
  const siteUrl = result.discovery?.origin || result.discovery?.url || "";

  return hostname(siteUrl)
    .toLowerCase()
    .replace(/^www\./, "")
    .includes("businesschicks.com");
}

function isIncaSolutionsReport(result: FullSiteAuditResult) {
  const siteUrl = result.discovery?.origin || result.discovery?.url || "";

  return hostname(siteUrl)
    .toLowerCase()
    .replace(/^www\./, "")
    .includes("incasolutions.com.au");
}

function isAusPayNetReport(result: FullSiteAuditResult) {
  const siteUrl = result.discovery?.origin || result.discovery?.url || "";

  const host = hostname(siteUrl)
    .toLowerCase()
    .replace(/^www\./, "");

  return (
    host.includes("auspaynet.com.au") ||
    host.includes("australianpaymentsnetwork")
  );
}

function buildEngagementOptions(result: FullSiteAuditResult) {
  if (isBusinessChicksReport(result)) {
    return [
      {
        title: "Focused fixes",
        description:
          "A contained content, accessibility, tracking or technical issue with a clearly defined outcome.",
      },
      {
        title: "Performance package",
        description:
          "Targeted mobile and template optimisation guided by the measured findings in this review.",
      },
      {
        title: "Campaign and event support",
        description:
          "Landing pages, event journeys, integrations and measurement support for priority campaigns.",
      },
      {
        title: "Overflow and ongoing support",
        description:
          "Flexible technical support that can complement the organisation's existing website and marketing partners.",
      },
    ];
  }

  if (isAusPayNetReport(result)) {
    return [
      {
        title: "Focused improvements",
        description:
          "Targeted Drupal, accessibility, performance, content or interface improvements within the existing website.",
      },
      {
        title: "Priority experience refresh",
        description:
          "Redesign and improve selected high-value areas such as the homepage, navigation, publications, resources or priority content templates.",
      },
      {
        title: "Staged website transformation",
        description:
          "A broader Drupal redesign delivered in stages, including information architecture, reusable components, priority templates and content migration where required.",
      },
      {
        title: "Ongoing Drupal support",
        description:
          "Flexible website management, content-system improvements, testing, reporting and continuous optimisation after the initial work.",
      },
    ];
  }

  return ENGAGEMENT_OPTIONS;
}

function buildEditorialPriorities(
  result: FullSiteAuditResult,
): ClientPriority[] | null {
  if (!isBusinessChicksReport(result)) return null;

  const testedPages = result.deepSummary?.count ?? 0;
  const performance = result.deepSummary?.averageMobilePerformance;
  const accessibility = result.deepSummary?.averageAccessibility;

  return [
    {
      title: "Make important content easier to read",
      finding:
        "Important paragraphs, event details and footer links use small text, while narrow columns make longer content harder to scan.",
      impact:
        "Larger text and comfortable spacing improve readability across desktop and mobile.",
      action:
        "Increase minimum body and supporting-text sizes, improve line spacing and review narrow text columns on the highest-value templates.",
      tone: "important",
    },
    {
      title: "Strengthen content and page structure",
      finding:
        "The homepage uses four main headings, and event listings add more. A focused content pass should also correct several wording, name and anniversary inconsistencies.",
      impact:
        "Clear structure and accurate copy support accessibility, search understanding and brand trust.",
      action:
        "Use one primary heading per page template, organise supporting headings consistently and complete a focused content-quality pass.",
      tone: "important",
    },
    {
      title: "Create consistent, measurable conversion journeys",
      finding:
        "Membership, events, partnerships and contact actions use different pathways. The contact form is visible but its markup was not detected, and the Media & PR email label does not match its link.",
      impact:
        "Consistent, measured journeys help visitors act and show the team what converts.",
      action:
        "Validate each high-value journey end to end, correct the email-label mismatch and confirm successful joins, bookings, enquiries and email actions are recorded.",
      tone: "measure",
    },
    {
      title: "Improve mobile speed and template efficiency",
      finding: `${testedPages} mobile tests averaged ${
        performance ?? "N/A"
      }/100 for performance and ${
        accessibility ?? "N/A"
      }/100 for accessibility. The largest measured issue was unused JavaScript on a content template.`,
      impact:
        "Leaner templates help visitors reach key content faster, particularly on mobile.",
      action:
        "Trace the largest script and asset costs to their templates, remove or defer code that is not needed and retest the priority journeys after each change.",
      tone:
        typeof performance === "number" && performance <= 50
          ? "urgent"
          : "important",
    },
  ];
}

function buildClientPriorities(
  result: FullSiteAuditResult,
  successfulPages: number,
): ClientPriority[] {
  const editorialPriorities = buildEditorialPriorities(result);

  if (editorialPriorities) return editorialPriorities;

  const summary = result.deepSummary;

  const pages = list(result.lightweightResults).filter(
    (page) => page.status === "ok",
  );

  const homepage = pages.find((page) => page.pageType === "Homepage");

  const evidence = buildEvidenceProfile(pages);

  const publicUrls = collectedPublicUrls(result);

  const contactUrls = unique([
    ...evidence.contactPages.map((page) => page.url),
    ...urlsMatchingPath(
      publicUrls,
      /\/(?:contact(?:-us)?|enquir(?:y|ies))(?:\/|$)/,
    ),
  ]);

  const utilityUrls = unique([
    ...evidence.utilityPages.map((page) => page.url),
    ...urlsMatchingPath(
      publicUrls,
      /\/(?:shop|cart|basket|checkout|my-account|account|refunds?|returns?|wishlist)(?:\/|$)/,
    ),
  ]);

  const projectUrls = unique([
    ...evidence.projectPages.map((page) => page.url),
    ...urlsMatchingPath(publicUrls, /\/projects?(?:\/|$)/),
  ]);

  const caseStudyUrls = unique([
    ...evidence.caseStudyPages.map((page) => page.url),
    ...urlsMatchingPath(
      publicUrls,
      /\/case[-_]?stud(?:y|ies)(?:\/|$)/,
    ),
  ]);

  const testedPages = summary?.count ?? 0;
  const performance = summary?.averageMobilePerformance;
  const accessibility = summary?.averageAccessibility;

  if (isIncaSolutionsReport(result)) {
    return [
      {
        title: "Modernise the homepage experience",
        finding:
          "The homepage has a strong brand foundation, but the content after the hero becomes text-heavy and does not bring services, project outcomes or proof forward strongly enough.",
        impact:
          "A clearer journey would help prospective clients understand INCA's value sooner.",
        action:
          "Restructure the homepage around a sharper value proposition, scannable service pathways, featured project results, team credibility and a clear enquiry action.",
        tone: "important",
      },
      {
        title: "Make the Services page easier to explore",
        finding:
          "Twelve services are presented as long numbered sections, making the page difficult to scan and connect to a visitor's immediate need.",
        impact:
          "Clearer grouping would make INCA's expertise easier to understand.",
        action:
          "Group related services into clear categories or cards, lead with client outcomes and connect priority services to relevant proof and calls to action.",
        tone: "important",
      },
      {
        title: "Turn project experience into stronger proof",
        finding:
          "The Projects page contains useful facts, while richer case-study content exists separately and is not clearly connected.",
        impact:
          "Showing the challenge, approach and outcome would build stronger trust.",
        action:
          "Create a consistent case-study format and link each relevant project to its full story, measurable result and related service.",
        tone: "important",
      },
      {
        title: "Strengthen the technical and search foundation",
        finding: `${testedPages} key-page tests averaged ${
          performance ?? "N/A"
        }/100 for mobile performance. ${
          evidence.pagesWithoutH1.length
        } reviewed page${
          evidence.pagesWithoutH1.length === 1 ? " has" : "s have"
        } no detected main heading, ${
          evidence.repeatedDescriptionPageCount
        } share repeated meta descriptions and structured data was not detected on ${
          evidence.pagesWithoutStructuredData.length
        }.`,
        impact:
          "Improving these foundations supports faster browsing, clearer search presentation and a more consistent experience.",
        action:
          "Optimise priority templates, correct headings and metadata, add suitable schema and review unused public utility pages as technical housekeeping.",
        tone: "measure",
      },
    ];
  }

  if (isAusPayNetReport(result)) {
    return [
      {
        title: "Simplify the information architecture",
        finding:
          "AusPayNet manages a large volume of payment-framework, policy, publication, initiative, regulatory and industry-resource content. The current navigation exposes many categories and subcategories at once, making the website harder to scan and understand than it needs to be.",
        impact:
          "A clearer structure would help members, industry participants, policymakers, media and other visitors reach the right information faster without reducing the depth of content available.",
        action:
          "Review the information architecture, consolidate overlapping pathways and organise content around clearer audience needs, topics and tasks. Use progressive navigation and landing pages to reveal detail when it is needed rather than presenting the full structure at once.",
        tone: "important",
      },
      {
        title: "Modernise the content experience",
        finding:
          "The website contains substantial and valuable industry information, but many sections are presented through dense lists, repeated link patterns and content-heavy layouts that are harder to scan, particularly on smaller screens.",
        impact:
          "A stronger visual hierarchy would make complex payments information easier to understand while giving the organisation a more current and authoritative digital presence.",
        action:
          "Introduce a reusable Drupal design system with clearer page hierarchy, stronger typography, consistent cards and content components, improved spacing and more responsive layouts across priority page types.",
        tone: "important",
      },
      {
        title: "Make resources and publications easier to find",
        finding:
          "Publications, consultations, submissions, rules, statistics, initiatives and downloadable documents are distributed across a deep content structure. Search and content discovery therefore play an unusually important role on this website.",
        impact:
          "Improved discovery would reduce the effort required to locate important industry information and make AusPayNet's extensive content library more useful over time.",
        action:
          "Review Drupal content types, taxonomy, search and filtering so resources can be discovered consistently by topic, content type and date. Preserve document history and existing URLs carefully during any restructuring.",
        tone: "important",
      },
      {
        title: "Strengthen mobile performance and accessibility",
        finding: `${testedPages} key-page tests averaged ${
          performance ?? "N/A"
        }/100 for mobile performance and ${
          accessibility ?? "N/A"
        }/100 for accessibility. The scan also found ${
          evidence.missingAltCount
        } images missing alternative text, ${
          evidence.pagesWithoutH1.length
        } reviewed page${
          evidence.pagesWithoutH1.length === 1 ? " has" : "s have"
        } no detected main heading and structured data was not detected on ${
          evidence.pagesWithoutStructuredData.length
        } reviewed pages.`,
        impact:
          "For a public information platform with industry-wide resources, performance and accessibility directly affect how easily visitors can reach and understand important information.",
        action:
          "Optimise recurring Drupal templates and front-end assets, correct accessibility issues, improve semantic structure and add appropriate structured data where useful. Retest representative templates after each release.",
        tone:
          typeof performance === "number" && performance < 50
            ? "urgent"
            : "important",
      },
    ];
  }

  const structureSignals: string[] = [];

  if (evidence.pagesWithoutH1.length > 0) {
    structureSignals.push(
      `${evidence.pagesWithoutH1.length} reviewed page${
        evidence.pagesWithoutH1.length === 1 ? " has" : "s have"
      } no detected main heading`,
    );
  }

  if (evidence.pagesWithMultipleH1s.length > 0) {
    structureSignals.push(
      `${evidence.pagesWithMultipleH1s.length} page${
        evidence.pagesWithMultipleH1s.length === 1 ? " has" : "s have"
      } multiple main headings`,
    );
  }

  if (evidence.repeatedDescriptionPageCount > 0) {
    structureSignals.push(
      `${evidence.repeatedDescriptionPageCount} pages share repeated meta-description copy`,
    );
  }

  if (evidence.missingAltCount > 0) {
    structureSignals.push(
      `${evidence.missingAltCount} image${
        evidence.missingAltCount === 1 ? " is" : "s are"
      } missing alternative text`,
    );
  }

  if (evidence.pagesWithoutStructuredData.length > 0) {
    structureSignals.push(
      `structured data was not detected on ${
        evidence.pagesWithoutStructuredData.length
      } reviewed page${
        evidence.pagesWithoutStructuredData.length === 1 ? "" : "s"
      }`,
    );
  }

  const publicContentSignals: string[] = [];

  if (contactUrls.length > 1) {
    publicContentSignals.push(
      `${contactUrls.length} separate contact routes were publicly accessible`,
    );
  }

  if (utilityUrls.length > 0) {
    publicContentSignals.push(
      `${utilityUrls.length} shop, checkout, account or returns route${
        utilityUrls.length === 1 ? " was" : "s were"
      } publicly accessible`,
    );
  }

  if (projectUrls.length > 0 && caseStudyUrls.length > 0) {
    publicContentSignals.push(
      "project and case-study content were both discovered and should be checked for a clear connection",
    );
  }

  const contactMethods = unique([
    evidence.formPages.length > 0
      ? `forms on ${evidence.formPages.length} reviewed page${
          evidence.formPages.length === 1 ? "" : "s"
        }`
      : "",
    (result.journeySummary?.pagesWithPhoneLinks ?? 0) > 0
      ? "telephone links"
      : "",
    (result.journeySummary?.pagesWithEmailLinks ?? 0) > 0
      ? "email links"
      : "",
    result.journeySummary?.newsletterPresent ? "a newsletter sign-up" : "",
  ]);

  const homepageFinding =
    homepage?.h1Count === 0
      ? "No semantic main heading was detected on the homepage. The central value proposition and next action need a clear structural priority."
      : homepage && homepage.h1Count > 1
        ? `The homepage contains ${homepage.h1Count} main headings. One primary heading should own the page's central value proposition.`
        : `The homepage passed the single-main-heading check, but the ${successfulPages}-page review still shows an opportunity to make the central value and next action easier to recognise.`;

  return [
    {
      title: "Make the website's value clear sooner",
      finding: homepageFinding,
      impact:
        "Visitors need to recognise quickly whether the business is relevant and what they should do next.",
      action:
        "Lead with one clear value proposition, support it with relevant proof and guide visitors into the most valuable next action.",
      tone: "important",
    },
    {
      title: "Strengthen page structure and search presentation",
      finding:
        structureSignals.length > 0
          ? `${humanList(
              structureSignals,
            )}. Lighthouse's automated SEO score does not assess the full search strategy or content quality.`
          : "The automated SEO checks provide a useful baseline, but they do not assess keyword targeting, content depth, duplicate content, structured data quality or search visibility.",
      impact:
        "Clear headings, unique search copy and accessible media help people and search engines understand each page.",
      action:
        "Correct the measured page-level gaps, then complete a manual content, indexing and structured-data review before describing the site's overall SEO as strong.",
      tone: "important",
    },
    {
      title:
        publicContentSignals.length > 0
          ? "Clean up public content and the enquiry journey"
          : "Create a smoother path to enquiry",
      finding:
        publicContentSignals.length > 0
          ? `${humanList(publicContentSignals)}. ${
              contactMethods.length > 0
                ? `The reviewed pages also provide ${humanList(
                    contactMethods,
                  )}.`
                : "The intended enquiry route should be confirmed manually."
            }`
          : contactMethods.length > 0
            ? `The reviewed pages provide ${humanList(
                contactMethods,
              )}. Each route should be checked as a distinct visitor action rather than counted automatically as a separate conversion journey.`
            : "No standard enquiry form, telephone link or email link was detected in the public scan. Embedded or dynamically rendered pathways should be confirmed manually.",
      impact:
        "Duplicate, irrelevant or disconnected pages can confuse visitors, weaken measurement and create avoidable search-indexing noise.",
      action:
        "Confirm the authoritative public pages, consolidate or redirect duplicates, remove irrelevant indexable routes and connect proof content to the relevant service and enquiry pathways.",
      tone: "measure",
    },
    {
      title: "Strengthen performance, accessibility and insight",
      finding: `${testedPages} completed key-page test${
        testedPages === 1 ? "" : "s"
      } averaged ${performance ?? "N/A"}/100 for mobile performance and ${
        accessibility ?? "N/A"
      }/100 for accessibility. Tool detection confirms presence, not whether consent or conversion tracking works correctly.`,
      impact:
        "Faster, more inclusive and measurable pages support engagement and better decisions.",
      action:
        "Fix recurring template issues, retest after each release and verify priority page views, calls, emails, form starts and successful enquiries as real events.",
      tone:
        typeof performance === "number" && performance < 50
          ? "urgent"
          : "important",
    },
  ];
}

function buildWebsiteFindings(
  result: FullSiteAuditResult,
  priorities: ClientPriority[],
): WebsiteFinding[] {
  if (isAusPayNetReport(result)) {
    const pages = list(result.lightweightResults).filter(
      (page) => page.status === "ok",
    );

    const evidence = buildEvidenceProfile(pages);

    return [
      {
        label: "Information architecture",
        title: "Reduce complexity without reducing content",
        finding:
          "The website contains extensive payment-system, policy, regulatory, statistical and publication content across a deep navigation structure. Much of the information is valuable, but visitors are required to process many choices before reaching the material they need.",
        opportunity:
          "Restructure major pathways around clear topics and visitor tasks, supported by stronger landing pages, progressive navigation and consistent taxonomy. The goal is not to remove important information, but to make a complex content library feel simple to use.",
        tone: "high",
      },
      {
        label: "Content and design system",
        title: "Create a more modern and consistent content experience",
        finding:
          "The site combines news, initiatives, regulatory information, publications, statistics and supporting resources, but the current presentation does not always create a strong hierarchy between different types of information.",
        opportunity:
          "Build a reusable Drupal component and template system for landing pages, publications, articles, initiatives, resources and supporting content. Stronger typography, spacing, cards and responsive layouts would make dense information easier to scan.",
        tone: "high",
      },
      {
        label: "Search and resource discovery",
        title: "Turn the content library into a stronger resource",
        finding:
          "AusPayNet publishes a large body of reports, consultations, submissions, regulations, statistics and other documents. With that volume of information, search, categorisation and filtering become core website functionality rather than secondary features.",
        opportunity:
          "Review Drupal content types, metadata and taxonomy, then provide clearer search and filtering by topic, content type and date. Maintain existing document URLs and redirects where possible to protect established references and search visibility.",
        tone: "high",
      },
      {
        label: "Technical foundation",
        title: "Improve the experience on mobile and for all users",
        finding: `${result.deepSummary?.count ?? 0} key pages averaged ${
          result.deepSummary?.averageMobilePerformance ?? "N/A"
        }/100 for mobile performance and ${
          result.deepSummary?.averageAccessibility ?? "N/A"
        }/100 for accessibility. ${
          evidence.missingAltCount
        } image${evidence.missingAltCount === 1 ? " is" : "s are"} missing alternative text, and structured data was not detected on ${
          evidence.pagesWithoutStructuredData.length
        } reviewed page${
          evidence.pagesWithoutStructuredData.length === 1 ? "" : "s"
        }.`,
        opportunity:
          "Optimise shared Drupal templates and front-end assets, correct semantic and accessibility issues, improve responsive presentation and introduce appropriate structured data where it adds value.",
        tone: "medium",
      },
    ];
  }

  if (!isIncaSolutionsReport(result)) {
    return priorities.slice(0, 4).map((priority) => ({
      label: "Website finding",
      title: priority.title,
      finding: priority.finding,
      opportunity: priority.action,
      tone: priority.tone === "urgent" ? "high" : "medium",
    }));
  }

  const pages = list(result.lightweightResults).filter(
    (page) => page.status === "ok",
  );

  const evidence = buildEvidenceProfile(pages);

  const missingHeadingCount = evidence.pagesWithoutH1.length;
  const repeatedDescriptionCount = evidence.repeatedDescriptionPageCount;
  const noSchemaCount = evidence.pagesWithoutStructuredData.length;

  return [
    {
      label: "Homepage design",
      title: "Create a clearer, more persuasive homepage journey",
      finding:
        "The hero communicates INCA's independent positioning well, but the sections below rely on long text blocks and large images. Services and project outcomes are not prominent enough.",
      opportunity:
        "Use concise service pathways, featured results, trust signals, team expertise and clear calls to action while preserving the established brand.",
      tone: "high",
    },
    {
      label: "Service design",
      title: "Rebuild the Services page for easier scanning",
      finding:
        "The page contains strong information, but twelve services appear as long two-column paragraphs beneath a large diagram. Visitors must read extensively to find the relevant service.",
      opportunity:
        "Group services into clear categories or cards, shorten the summaries and connect them to relevant projects, detail and enquiry actions.",
      tone: "high",
    },
    {
      label: "Projects and proof",
      title: "Turn project experience into persuasive case studies",
      finding:
        "The Projects page lists useful facts, while richer project stories exist separately. The connection between projects, service expertise and case-study proof is unclear.",
      opportunity:
        "Use a consistent format covering the challenge, INCA's approach and the outcome, then link each story to its related service and project.",
      tone: "medium",
    },
    {
      label: "Technical foundation",
      title: "Support the redesign with technical improvements",
      finding: `Five key pages averaged ${
        result.deepSummary?.averageMobilePerformance ?? "N/A"
      }/100 for mobile performance. ${missingHeadingCount} reviewed page${
        missingHeadingCount === 1 ? " has" : "s have"
      } no detected main heading, ${repeatedDescriptionCount} share repeated meta-description copy and structured data was not detected on ${noSchemaCount} reviewed page${
        noSchemaCount === 1 ? "" : "s"
      }.`,
      opportunity:
        "Improve template performance, headings, unique metadata, image descriptions and appropriate schema, then review unused public utility pages as technical housekeeping.",
      tone: "medium",
    },
  ];
}

function buildClientSummary(
  result: FullSiteAuditResult,
  successfulPages: number,
) {
  if (isBusinessChicksReport(result)) {
    return "Business Chicks already has a distinctive, credible website supporting membership, events, editorial content and partnerships. The strongest opportunities are focused improvements to readability, content quality, mobile performance and conversion measurement - not a wholesale redesign.";
  }

  if (isAusPayNetReport(result)) {
    const summary = result.deepSummary;
    const performance = summary?.averageMobilePerformance;
    const automatedSeo = summary?.averageSeo;
    const tested = summary?.count ?? 0;

    return `Australian Payments Network maintains a substantial public information platform supporting the Australian payments industry, with content spanning payment frameworks, regulation, policy, industry initiatives, publications, statistics and member resources. This review examined ${successfulPages} public pages. The clearest measured technical opportunity is mobile performance: ${tested} important page${
      tested === 1 ? "" : "s"
    } averaged ${
      performance ?? "N/A"
    }/100. Lighthouse's limited automated SEO checks averaged ${
      automatedSeo ?? "N/A"
    }/100; this provides a useful technical baseline but does not assess the site's information architecture, content findability, search experience, taxonomy or broader search strategy.`;
  }

  const report = result.siteReport;
  const summary = result.deepSummary;
  const performance = summary?.averageMobilePerformance;
  const automatedSeo = summary?.averageSeo;
  const tested = summary?.count ?? 0;

  const speedSentence =
    typeof performance === "number"
      ? `The clearest measured opportunity is mobile performance: ${tested} important page${
          tested === 1 ? "" : "s"
        } averaged ${performance}/100.`
      : "Mobile performance should be tested again before priorities are confirmed.";

  const seoSentence =
    typeof automatedSeo === "number"
      ? `Lighthouse's limited automated SEO checks averaged ${automatedSeo}/100. That score is a useful technical baseline, but it does not assess search strategy, content quality, duplicate content, structured data or keyword visibility.`
      : "Search foundations require a separate manual review because automated checks do not measure the complete SEO picture.";

  const homepage = list(result.lightweightResults).find(
    (page) => page.pageType === "Homepage",
  );

  const cleanedDescription = homepage?.metaDescription
    ?.trim()
    .replace(/^[A-Z0-9 +&,:/'-]{18,}\s+(?=[A-Z][a-z])/u, "");

  const completeOpeningSentence = cleanedDescription?.match(
    /^.{45,}?[.!?](?=\s|$)/,
  )?.[0];

  const publicDescription =
    completeOpeningSentence ||
    (cleanedDescription && cleanedDescription.length <= 260
      ? cleanedDescription
      : "");

  const opening =
    report?.businessOverview?.trim() ||
    (publicDescription && publicDescription.length >= 45
      ? publicDescription
      : `${clientName(
          result,
        )} has an established public website with useful business, service and visitor information already in place.`);

  return `${opening} This review examined ${successfulPages} public pages. ${speedSentence} ${seoSentence}`;
}

function analyticsSummary(result: FullSiteAuditResult) {
  const tech = result.techStack;

  const signals = unique([
    ...list(tech?.analytics),
    ...list(tech?.tagManagers),
    ...list(tech?.marketing),
  ]);

  if (signals.length === 0) {
    return "No clearly identifiable analytics or tag-management signal was found in the public page code. This does not prove tracking is absent, because it may load after consent or through server-side systems.";
  }

  return `Public signals for ${humanList(
    signals,
  )} were found. This confirms that tools are present, but it does not confirm that consent, enquiry tracking, reporting or CRM follow-up are configured correctly.`;
}

function renderList(items: string[], className = "") {
  if (!items.length) return "";

  return `<ul class="${className}">${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
}

const REPORT_CSS = `
* {
  box-sizing: border-box;
}

html {
  background: #e8edf4;
}

body {
  width: 210mm;
  max-width: 210mm;
  margin: 0 auto;
  background: #ffffff;
  color: #172033;
  font: 11pt/1.48 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.report-page {
  width: 100%;
  min-height: 0;
  padding: 12mm 15mm;
  background: #ffffff;
  color: #253047;
}

.report-page + .report-page {
  break-before: page;
}

.section {
  margin-bottom: 20px;
}

/* ==================================================
   HEADER
================================================== */

.summary-header {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 14px;
  margin-bottom: 21px;
  padding-bottom: 17px;
  border-bottom: 3px solid #7c3aed;
}

.summary-brand {
  margin-bottom: 7px;
  color: #7c3aed;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.summary-header h1 {
  margin: 0;
  color: #27123f;
  font-size: 31px;
  line-height: 1.08;
}

.summary-subtitle {
  margin-top: 8px;
  color: #5e5270;
  font-size: 14px;
}

.summary-meta {
  display: grid;
  align-self: start;
  gap: 8px;
  padding: 10px 13px;
  border-radius: 8px;
  background: #f6f3ff;
  color: #514760;
  font-size: 9.8px;
  line-height: 1.4;
}

.summary-meta strong {
  display: block;
  margin-bottom: 1px;
  color: #2f1b48;
}

/* ==================================================
   TYPOGRAPHY
================================================== */

.kicker {
  margin-bottom: 7px;
  color: #7c3aed;
  font-size: 8pt;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  break-after: avoid;
}

h2 {
  margin: 0 0 15px;
  color: #27123f;
  font-size: 17pt;
  line-height: 1.18;
  letter-spacing: -0.025em;
}

h3 {
  margin: 0 0 8px;
  color: #302044;
  font-size: 12pt;
  line-height: 1.3;
}

.lead {
  margin: 0;
  color: #354158;
  font-size: 11pt;
  line-height: 1.45;
}

.muted {
  color: #59657a;
  font-size: 11pt;
  line-height: 1.42;
}

/* ==================================================
   SCORE CARDS
================================================== */

.score-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  border-top: 1px solid #ddd6fe;
  border-bottom: 1px solid #ddd6fe;
}

.score-card {
  display: flex;
  min-height: 104px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 7px;
  background: #ffffff;
  text-align: center;
}

.score-card + .score-card {
  border-left: 1px solid #e9e4f3;
}

.score-label {
  display: flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  color: #625873;
  font-size: 10.2px;
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1.25;
  text-transform: uppercase;
}

.score-value {
  margin: 4px 0 2px;
  font-size: 25px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.score-meaning {
  max-width: 115px;
  color: #697386;
  font-size: 10px;
  line-height: 1.42;
}

/* ==================================================
   PRIORITY CARDS
================================================== */

.priority-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 26px;
  margin-top: 12px;
}

.priority-card {
  display: block;
  padding: 11px 4px 13px;
  border-top: 2px solid #ddd6fe;
  break-inside: avoid;
}

.priority-card h3 {
  font-size: 12pt;
  line-height: 1.3;
}

.priority-card p {
  margin: 5px 0;
  color: #354158;
  font-size: 11pt;
  line-height: 1.38;
}

/* ==================================================
   FINDING CARDS
================================================== */

.finding-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 20px;
}

.finding-card {
  padding: 13px 8px 13px 13px;
  border-left: 3px solid #ddd6fe;
  background: #fbfaff;
  break-inside: avoid;
}

.finding-card p {
  margin: 0 0 7px;
  color: #354158;
  font-size: 11.4px;
  line-height: 1.52;
}

.finding-card p:last-child {
  margin-bottom: 0;
}

.finding-card h3 {
  margin-bottom: 8px;
  font-size: 13.8px;
}

.finding-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: #687386;
  font-size: 9.3px;
  text-transform: uppercase;
}

.severity {
  display: inline-block;
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
}

.severity-high {
  background: #ffe8eb;
  color: #b4233d;
}

.severity-medium {
  background: #fff2d5;
  color: #9a5a00;
}

.severity-low,
.severity-review {
  background: #e7f0fa;
  color: #315f8c;
}

/* ==================================================
   SCORE TABLE
================================================== */

.score-table-wrap {
  overflow: hidden;
  border: 1px solid #e3dcf4;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5px;
}

th {
  padding: 9px 8px;
  border-bottom: 2px solid #c4b5fd;
  background: #f5f1ff;
  color: #514760;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

td {
  height: 38px;
  padding: 9px 8px;
  border-bottom: 1px solid #ebe6f5;
  vertical-align: middle;
}

tbody tr:nth-child(even) {
  background: #fbfaff;
}

tbody tr:last-child td {
  border-bottom: 0;
}

th:not(:first-child),
td:not(:first-child) {
  text-align: center;
}

td:first-child {
  color: #302044;
  font-size: 11.2px;
}

.score {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.not-tested {
  color: #8a8296;
  font-size: 10px;
  font-weight: 600;
}

/* ==================================================
   ROADMAP
================================================== */

.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 2px solid #ddd6fe;
  border-bottom: 1px solid #ddd6fe;
}

.roadmap-card {
  padding: 12px 14px;
}

.roadmap-card + .roadmap-card {
  border-left: 1px solid #e9e4f3;
}

.clean-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.clean-list li {
  position: relative;
  margin: 0 0 8px;
  padding-left: 15px;
}

.clean-list li::before {
  position: absolute;
  left: 0;
  color: #7c3aed;
  content: "•";
  font-weight: 900;
}

.roadmap-card .clean-list li {
  color: #354158;
  font-size: 11pt;
  line-height: 1.38;
}

/* ==================================================
   SUPPORT
================================================== */

.compact-support {
  padding: 16px;
  border-left: 5px solid #7c3aed;
  border-radius: 6px;
  background: #f7f5ff;
  color: #253047;
  break-inside: avoid;
}

.compact-support h2,
.compact-support h3 {
  color: #27123f;
}

.compact-support .muted {
  color: #514760;
  font-size: 11pt;
  line-height: 1.38;
}

.engagement-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 11px 0;
}

.engagement-card {
  padding: 10px 12px;
  border-radius: 6px;
  background: #ffffff;
  break-inside: avoid;
}

.engagement-card h3 {
  margin-bottom: 6px;
  font-size: 12pt;
}

.engagement-card p {
  margin: 0;
  color: #4d596c;
  font-size: 11pt;
  line-height: 1.36;
}

.capability-grid {
  columns: 2;
  column-gap: 28px;
}

.capability-grid li {
  break-inside: avoid;
  margin-bottom: 7px;
  color: #354158;
  font-size: 11pt;
  line-height: 1.38;
}

h2,
h3 {
  break-after: avoid;
}

tr,
.score-card,
.finding-card {
  break-inside: avoid;
}

.print-footer {
  display: none;
}

/* ==================================================
   PRINT — THREE PAGE LAYOUT
================================================== */

@page {
  size: A4;
  margin: 0;
}

@media print {
  html {
    width: 210mm;
    background: #ffffff;
  }

  body {
    width: 210mm;
    max-width: 210mm;
    margin: 0;
  }

  /*
    Do NOT give .report-page a 296/297mm height.
    Chrome + padding + forced breaks was creating phantom pages.
  */
  .report-page {
    width: 210mm;
    min-height: 0;
    height: auto;
    padding: 8mm 13mm 10mm;
    overflow: visible;
  }

  .report-page:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }

  .report-page + .report-page {
    break-before: auto;
    page-break-before: auto;
  }

  /* ==================================================
     PAGE 1
  ================================================== */

  .summary-page {
    padding-top: 7mm;
  }

  .summary-page .summary-header {
    margin-bottom: 9px;
    padding-bottom: 9px;
  }

  .summary-page .summary-header h1 {
    font-size: 27px;
    line-height: 1.02;
  }

  .summary-page .summary-subtitle {
    margin-top: 4px;
    font-size: 12px;
  }

  .summary-page .summary-meta {
    gap: 4px;
    padding: 7px 10px;
    font-size: 8.8px;
    line-height: 1.25;
  }

  .summary-page .section {
    margin-bottom: 8px;
  }

  .summary-page .kicker {
    margin-bottom: 4px;
    font-size: 7pt;
  }

  .summary-page h2 {
    margin-bottom: 8px;
    font-size: 14.5pt;
    line-height: 1.12;
  }

  .summary-page .lead {
    margin: 0 0 10px;
    font-size: 10.2pt;
    line-height: 1.32;
  }

  .summary-page .score-grid {
    margin: 8px 0 10px;
  }

  .summary-page .score-card {
    min-height: 61px;
    padding: 5px 4px;
  }

  .summary-page .score-label {
    min-height: 17px;
    font-size: 6.5pt;
    line-height: 1.12;
  }

  .summary-page .score-value {
    margin: 0;
    font-size: 15pt;
  }

  .summary-page .score-meaning {
    font-size: 6.6pt;
    line-height: 1.12;
  }

  .summary-page .focused-opportunities {
    padding-top: 5px;
  }

  .summary-page .priority-grid {
    gap: 7px 18px;
    margin-top: 6px;
  }

  .summary-page .priority-card {
    padding: 7px 3px 8px;
  }

  .summary-page .priority-card h3 {
    margin: 0 0 6px;
    font-size: 10.6pt;
    line-height: 1.16;
  }

  .summary-page .priority-card p {
    margin: 0;
    font-size: 9.3pt;
    line-height: 1.29;
  }

  /* ==================================================
     PAGE 2
  ================================================== */

  .findings-page {
    padding-top: 8mm;
  }

  .findings-page .section {
    margin-bottom: 9px;
  }

  .findings-page .kicker {
    margin-bottom: 4px;
    font-size: 7pt;
  }

  .findings-page h2 {
    margin-bottom: 8px;
    font-size: 14.5pt;
    line-height: 1.14;
  }

  .findings-page .muted {
    margin: 0 0 9px;
    font-size: 9.6pt;
    line-height: 1.27;
  }

  .findings-page .finding-grid {
    gap: 7px 13px;
  }

  .findings-page .finding-card {
    padding: 8px 6px 9px 9px;
  }

  .findings-page .finding-meta {
    margin-bottom: 5px;
    font-size: 6.5pt;
  }

  .findings-page .severity {
    padding: 3px 6px;
    font-size: 6.5pt;
  }

  .findings-page .finding-card h3 {
    margin: 0 0 6px;
    font-size: 10.5pt;
    line-height: 1.16;
  }

  .findings-page .finding-card p {
    margin: 0 0 6px;
    font-size: 9.1pt;
    line-height: 1.28;
  }

  .findings-page .finding-card p:last-child {
    margin-bottom: 0;
  }

  .findings-page .score-table-wrap {
    margin-top: 7px;
  }

  .findings-page table {
    font-size: 8.3pt;
  }

  .findings-page th {
    padding: 4px;
    font-size: 6.3pt;
  }

  .findings-page td {
    height: 22px;
    padding: 3px 4px;
  }

  .findings-page td:first-child {
    font-size: 8.8pt;
    line-height: 1.1;
  }

  .findings-page td.score {
    font-size: 8.3pt;
  }

  /* ==================================================
     PAGE 3
  ================================================== */

  .final-page {
    padding-top: 9mm;
  }

  .final-page .section {
    margin-bottom: 12px;
  }

  .final-page .kicker {
    margin-bottom: 4px;
    font-size: 7pt;
  }

  .final-page h2 {
    margin-bottom: 9px;
    font-size: 15pt;
    line-height: 1.15;
  }

  .roadmap-grid {
    margin-bottom: 13px;
  }

  .roadmap-card {
    padding: 9px 10px;
  }

  .roadmap-card h3 {
    margin: 0 0 7px;
    font-size: 10.4pt;
  }

  .roadmap-card .clean-list li {
    margin-bottom: 6px;
    padding-left: 12px;
    font-size: 9.1pt;
    line-height: 1.27;
  }

  .compact-support {
    padding: 11px 12px;
  }

  .compact-support .kicker {
    margin-bottom: 4px;
  }

  .compact-support h2 {
    margin-bottom: 9px;
  }

  .compact-support .muted {
    margin: 0 0 9px;
    font-size: 9.3pt;
    line-height: 1.27;
  }

  .engagement-grid {
    gap: 7px;
    margin: 9px 0 10px;
  }

  .engagement-card {
    padding: 7px 9px;
  }

  .engagement-card h3 {
    margin: 0 0 6px;
    font-size: 10pt;
  }

  .engagement-card p {
    margin: 0;
    font-size: 8.9pt;
    line-height: 1.26;
  }

  .compact-support > h3 {
    margin: 5px 0 7px;
    font-size: 10.3pt;
  }

  .capability-grid {
    column-gap: 20px;
  }

  .capability-grid li {
    margin-bottom: 5px;
    font-size: 8.9pt;
    line-height: 1.25;
  }

  /* ==================================================
     FOOTER
  ================================================== */

  .print-footer {
    position: fixed;
    right: 13mm;
    bottom: 3mm;
    left: 13mm;
    z-index: 10;
    display: flex;
    height: 4mm;
    align-items: flex-end;
    justify-content: space-between;
    border-top: 1px solid #ddd6fe;
    padding-top: 1.5mm;
    color: #7b7288;
    font-size: 7px;
    line-height: 1;
  }

  a {
    color: inherit;
    text-decoration: none;
  }
    /* ==================================================
   EXTRA READING SPACE
   Keep this at the VERY END of @media print
================================================== */

/* Small purple section labels:
   Opportunity overview / Focused opportunities /
   Website findings / Supporting evidence etc. */
.kicker {
  margin-bottom: 7px !important;
}

/* Main section heading after purple label */
.summary-page h2,
.findings-page h2,
.final-page h2 {
  margin-top: 0 !important;
  margin-bottom: 12px !important;
}

/* More room between overview heading and paragraph */
.summary-page .lead {
  margin-top: 0 !important;
  margin-bottom: 14px !important;
}

/* More room after the overview paragraph before scores */
.summary-page .score-grid {
  margin-top: 12px !important;
  margin-bottom: 14px !important;
}

/* Separate Focused Opportunities from score row */
.summary-page .focused-opportunities {
  padding-top: 10px !important;
}

/* ==================================================
   PAGE 1 OPPORTUNITY TITLES
================================================== */

.summary-page .priority-card {
  padding-top: 10px !important;
  padding-bottom: 11px !important;
}

.summary-page .priority-card h3 {
  margin-top: 0 !important;
  margin-bottom: 9px !important;
}

/* ==================================================
   PAGE 2 FINDING BOXES
================================================== */

/* Space between each row of boxes */
.findings-page .finding-grid {
  row-gap: 12px !important;
}

/* More internal room inside each box */
.findings-page .finding-card {
  padding-top: 11px !important;
  padding-bottom: 12px !important;
}

/* PRIORITY + Information architecture line */
.findings-page .finding-meta {
  margin-bottom: 10px !important;
}

/* Reduce complexity without reducing content */
.findings-page .finding-card h3 {
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

/* What we found paragraph */
.findings-page .finding-card p {
  margin-top: 0 !important;
  margin-bottom: 11px !important;
  line-height: 1.34 !important;
}

/* No unnecessary gap after final paragraph */
.findings-page .finding-card p:last-child {
  margin-bottom: 0 !important;
}

/* More room between intro paragraph and boxes */
.findings-page .muted {
  margin-bottom: 13px !important;
}

/* More room before Supporting evidence */
.findings-page .finding-grid {
  margin-bottom: 14px !important;
}

/* Supporting evidence heading -> table */
.findings-page .score-table-wrap {
  margin-top: 10px !important;
}

/* ==================================================
   PAGE 3
================================================== */

.final-page .roadmap-card h3 {
  margin-bottom: 9px !important;
}

.final-page .compact-support h2 {
  margin-bottom: 12px !important;
}

.final-page .compact-support .muted {
  margin-bottom: 13px !important;
}

.final-page .engagement-card h3 {
  margin-bottom: 8px !important;
}

.final-page .compact-support > h3 {
  margin-top: 8px !important;
  margin-bottom: 10px !important;
}
}
`;

export function buildReportHtml(
  result: FullSiteAuditResult,
  profile?: Partial<UserProfile>,
) {
  const profileValues = getProfileFallbacks(profile);

  const discovery = result.discovery;
  const pages = list(result.lightweightResults);
  const deepResults = list(result.deepResults);
  const summary = result.deepSummary;

  const company = clientName(result);

  const displayUrl =
    discovery?.origin || discovery?.url || "";

  const successfulPages = pages.filter(
    (page) => page.status === "ok",
  ).length;

  const priorities = buildClientPriorities(
    result,
    successfulPages,
  );

  const websiteFindings = buildWebsiteFindings(
    result,
    priorities,
  );

  const engagementOptions =
    buildEngagementOptions(result);

  const clientSummary = buildClientSummary(
    result,
    successfulPages,
  );

  const reportDate = new Date(
    result.generatedAt || Date.now(),
  ).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const businessChicks =
    isBusinessChicksReport(result);

  const incaSolutions =
    isIncaSolutionsReport(result);

  const ausPayNet =
    isAusPayNetReport(result);

  const capabilities = ausPayNet
    ? AUSPAYNET_SERVICES
    : SERVICES;

  const roadmap = businessChicks
    ? {
        start: [
          "Confirm the highest-value visitor actions.",
          "Validate the measured performance, contrast and search findings.",
          "Agree on a focused first scope with the existing team.",
        ],
        improve: [
          "Increase small text and strengthen the heading hierarchy.",
          "Correct the content and email-link inconsistencies.",
          "Improve priority-template mobile performance.",
        ],
        measure: [
          "Measure joins, bookings, enquiries and email clicks.",
          "Compare performance after each release.",
          "Use evidence to guide future improvements.",
        ],
      }
    : incaSolutions
      ? {
          start: [
            "Confirm the priority audiences, services and strongest proof.",
            "Plan the homepage and Services page information hierarchy.",
            "Validate the measured performance and search findings.",
          ],
          improve: [
            "Redesign the homepage and make services easier to explore.",
            "Connect projects to consistent, outcome-led case studies.",
            "Improve mobile performance, headings, metadata and schema.",
          ],
          measure: [
            "Measure service views, project engagement and enquiries.",
            "Compare performance and behaviour after each release.",
            "Use the results to guide ongoing improvement.",
          ],
        }
      : ausPayNet
        ? {
            start: [
              "Confirm priority audiences, information needs and high-value website tasks.",
              "Map the current Drupal content structure, taxonomy and major content types.",
              "Validate the highest-impact mobile, accessibility and search findings.",
            ],
            improve: [
              "Simplify navigation and restructure major content pathways.",
              "Create reusable, modern Drupal components for priority page and content types.",
              "Improve mobile performance, accessibility, search and resource discovery.",
            ],
            measure: [
              "Measure search usage, resource discovery and engagement with priority content.",
              "Compare performance and accessibility after each release.",
              "Use visitor behaviour and content data to guide ongoing improvements.",
            ],
          }
        : {
            start: [
              "Confirm the authoritative public pages, priority audiences and most valuable website actions.",
              "Validate the highest-impact performance, accessibility, indexing and enquiry findings.",
              "Agree on the smallest useful first scope.",
            ],
            improve: [
              "Clarify the homepage message and strengthen page structure.",
              "Consolidate duplicate or irrelevant routes and connect proof to the relevant services.",
              "Improve mobile performance and the contact journey.",
            ],
            measure: [
              "Confirm calls, emails, form starts and completed enquiries are measured.",
              "Compare performance and visitor behaviour after each release.",
              "Use real evidence to choose future improvements.",
            ],
          };

  const supportIntroduction = businessChicks
    ? "Support can begin with one focused improvement or flexible overflow assistance that complements the organisation's existing website and marketing partners."
    : ausPayNet
      ? "The work can begin with targeted improvements to the existing Drupal website or expand into a staged redesign and broader website transformation. The right level of change can be confirmed after discovery."
      : "The work can begin with one focused improvement or expand into a staged project. A complete rebuild is not required to get started.";

  const scoreCards = [
    [
      "Mobile speed",
      summary?.averageMobilePerformance,
      scoreMeaning(
        "performance",
        summary?.averageMobilePerformance,
      ),
    ],
    [
      "Automated SEO checks",
      summary?.averageSeo,
      scoreMeaning(
        "seo",
        summary?.averageSeo,
      ),
    ],
    [
      "Accessibility",
      summary?.averageAccessibility,
      scoreMeaning(
        "accessibility",
        summary?.averageAccessibility,
      ),
    ],
    [
      "Best practices",
      summary?.averageBestPractices,
      scoreMeaning(
        "bestPractices",
        summary?.averageBestPractices,
      ),
    ],
    [
      "Homepage desktop speed",
      summary?.homepageDesktopPerformance,
      scoreMeaning(
        "performance",
        summary?.homepageDesktopPerformance,
      ),
    ],
  ];

  const priorityCards = priorities
    .map(
      (priority) => `
    <article class="priority-card priority-${escapeHtml(
      priority.tone,
    )}">
      <h3>${escapeHtml(priority.title)}</h3>
      <p>${escapeHtml(
        priority.finding,
      )} ${escapeHtml(priority.impact)}</p>
    </article>`,
    )
    .join("");

  const deepRows = deepResults
    .map((item) => {
      if (!item.scores?.mobile) {
        return `<tr>
          <td><strong>${escapeHtml(
            reportPageLabel(
              item.pageType,
              item.url,
            ),
          )}</strong></td>
          <td colspan="5" class="not-tested">Test unavailable</td>
        </tr>`;
      }

      return `<tr>
        <td><strong>${escapeHtml(
          reportPageLabel(
            item.pageType,
            item.url,
          ),
        )}</strong></td>

        <td
          class="score"
          style="color:${scoreHex(
            item.scores.mobile.performance,
          )}"
        >
          ${item.scores.mobile.performance}
        </td>

        <td
          class="score"
          style="color:${scoreHex(
            item.scores.mobile.seo,
          )}"
        >
          ${item.scores.mobile.seo}
        </td>

        <td
          class="score"
          style="color:${scoreHex(
            item.scores.mobile.accessibility,
          )}"
        >
          ${item.scores.mobile.accessibility}
        </td>

        <td
          class="score"
          style="color:${scoreHex(
            item.scores.mobile.bestPractices,
          )}"
        >
          ${item.scores.mobile.bestPractices}
        </td>

        <td
          class="score"
          style="color:${scoreHex(
            item.scores.desktop?.performance,
          )}"
        >
          ${
            item.scores.desktop?.performance ??
            '<span class="not-tested">N/A</span>'
          }
        </td>
      </tr>`;
    })
    .join("");

  const findingCards = websiteFindings
    .map(
      (finding) => `
      <article class="finding-card">
        <div class="finding-meta">
          <span class="severity severity-${escapeHtml(
            finding.tone,
          )}">
            ${
              finding.tone === "high"
                ? "Priority"
                : finding.tone === "medium"
                  ? "Important"
                  : "Review"
            }
          </span>
          <span>${escapeHtml(
            finding.label,
          )}</span>
        </div>

        <h3>${escapeHtml(
          finding.title,
        )}</h3>

        <p>
          <strong>What we found:</strong>
          ${escapeHtml(
            finding.finding,
          )}
        </p>

        <p>
          <strong>Improvement opportunity:</strong>
          ${escapeHtml(
            finding.opportunity,
          )}
        </p>
      </article>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en-AU">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  >

  <title>
    Detailed Website Review Summary - ${escapeHtml(
      company,
    )}
  </title>

  <style>${REPORT_CSS}</style>
</head>

<body>
  <main>

    <section class="report-page summary-page">

      <header class="summary-header">

        <div>
          <div class="summary-brand">
            ${escapeHtml(
              profileValues.yourCompany,
            )}
          </div>

          <h1>
            Detailed Website<br>
            Review Summary
          </h1>

          <div class="summary-subtitle">
            Prepared for ${escapeHtml(
              company,
            )}
          </div>
        </div>

        <div class="summary-meta">

          <div>
            <strong>Website</strong>
            ${escapeHtml(
              displayUrl,
            )}
          </div>

          <div>
            <strong>Prepared by</strong>
            ${escapeHtml(
              profileValues.yourName,
            )}<br>
            ${escapeHtml(
              profileValues.yourTitle,
            )}
          </div>

          <div>
            <strong>Date</strong>
            ${escapeHtml(
              reportDate,
            )}
          </div>

        </div>

      </header>

      <section class="section">

        <div class="kicker">
          Opportunity overview
        </div>

        <h2>
          Where the website could deliver even more value
        </h2>

        <p class="lead">
          ${escapeHtml(
            clientSummary,
          )}
        </p>

        <div class="score-grid">

          ${scoreCards
            .map(
              ([
                label,
                value,
                meaning,
              ]) => `
              <div class="score-card">

                <div class="score-label">
                  ${escapeHtml(
                    label,
                  )}
                </div>

                <div
                  class="score-value"
                  style="color:${scoreHex(
                    typeof value ===
                      "number"
                      ? value
                      : null,
                  )}"
                >
                  ${escapeHtml(
                    value ?? "N/A",
                  )}
                </div>

                <div class="score-meaning">
                  ${escapeHtml(
                    meaning,
                  )}
                </div>

              </div>`,
            )
            .join("")}

        </div>

      </section>

      <section class="section focused-opportunities">

        <div class="kicker">
          Focused opportunities
        </div>

        <h2>
          Where improvements could add the most value
        </h2>

        <div class="priority-grid">
          ${priorityCards}
        </div>

      </section>

    </section>

    <section class="report-page findings-page">

      <section class="section">

        <div class="kicker">
          Website findings
        </div>

        <h2>
          What we found and how it could be improved
        </h2>

        <p class="muted">
          These opportunities combine the scan evidence with a practical review of the website's content, structure and visitor journey.
        </p>

        <div class="finding-grid">
          ${findingCards}
        </div>

      </section>

      <section class="section">

        <div class="kicker">
          Supporting evidence
        </div>

        <h2>
          Page-level technical score comparison
        </h2>

        <div class="score-table-wrap">

          <table>

            <thead>
              <tr>
                <th>Page tested</th>
                <th>Mobile</th>
                <th>Automated SEO</th>
                <th>Accessibility</th>
                <th>Best practices</th>
                <th>Desktop</th>
              </tr>
            </thead>

            <tbody>
              ${
                deepRows ||
                '<tr><td colspan="6">No representative results were available.</td></tr>'
              }
            </tbody>

          </table>

        </div>

      </section>

    </section>

    <section class="report-page final-page">

      <section class="section">

        <div class="kicker">
          Practical roadmap
        </div>

        <h2>
          A sensible path from findings to improvement
        </h2>

        <div class="roadmap-grid">

          <article class="roadmap-card">

            <h3>
              Start here
            </h3>

            ${renderList(
              roadmap.start,
              "clean-list",
            )}

          </article>

          <article class="roadmap-card">

            <h3>
              Improve next
            </h3>

            ${renderList(
              roadmap.improve,
              "clean-list",
            )}

          </article>

          <article class="roadmap-card">

            <h3>
              Measure and grow
            </h3>

            ${renderList(
              roadmap.measure,
              "clean-list",
            )}

          </article>

        </div>

      </section>

      <section class="section compact-support">

        <div class="kicker">
          Ways to work together
        </div>

        <h2>
          Support matched to the priority and budget
        </h2>

        <p class="muted">
          ${escapeHtml(
            supportIntroduction,
          )}
        </p>

        <div class="engagement-grid">

          ${engagementOptions
            .map(
              (option) => `
              <article class="engagement-card">

                <h3>
                  ${escapeHtml(
                    option.title,
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    option.description,
                  )}
                </p>

              </article>`,
            )
            .join("")}

        </div>

        <h3>
          Capabilities
        </h3>

        ${renderList(
          capabilities,
          "clean-list capability-grid",
        )}

      </section>

    </section>

  </main>

  <div class="print-footer">

    <span>
      ${escapeHtml(
        profileValues.yourName,
      )} - ${escapeHtml(
        profileValues.yourWebsite ||
          profileValues.yourCompany,
      )}
    </span>

    <span>
      Prepared for ${escapeHtml(
        company,
      )}
    </span>

  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 500);
    }
  </script>

</body>
</html>`;
}

function exportReport(
  result: FullSiteAuditResult,
  profile?: Partial<UserProfile>,
) {
  const html = buildReportHtml(
    result,
    profile,
  );

  const blob = new Blob(
    [html],
    {
      type: "text/html;charset=utf-8",
    },
  );

  const printUrl =
    URL.createObjectURL(blob);

  window.open(
    printUrl,
    "_blank",
    "noopener,noreferrer",
  );

  window.setTimeout(
    () =>
      URL.revokeObjectURL(
        printUrl,
      ),
    60_000,
  );
}

function BulletList({
  items,
}: {
  items: string[];
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No item was generated.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-3 text-sm leading-relaxed text-secondary-foreground"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />

          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function FullSiteAuditReport({
  result,
  profile,
}: Props) {
  const report = result.siteReport;

  const pages =
    list(result.lightweightResults);

  const successfulPages =
    pages.filter(
      (page) =>
        page.status === "ok",
    ).length;

  if (!result.success || !report) {
    return null;
  }

  const priorities =
    buildClientPriorities(
      result,
      successfulPages,
    );

  const engagementOptions =
    buildEngagementOptions(result);

  const proofPoints =
    list(report.proofPoints);

  const metrics = [
    [
      "Pages reviewed",
      successfulPages,
    ],
    [
      "Key pages tested",
      result.deepSummary?.count ??
        0,
    ],
    [
      "Mobile speed",
      result.deepSummary
        ?.averageMobilePerformance ??
        "N/A",
    ],
    [
      "Automated SEO",
      result.deepSummary
        ?.averageSeo ??
        "N/A",
    ],
    [
      "Accessibility",
      result.deepSummary
        ?.averageAccessibility ??
        "N/A",
    ],
  ];

  return (
    <section className="space-y-6">

      <div className="overflow-hidden rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-card via-violet-500/[0.05] to-card">

        <div className="flex flex-col gap-5 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">

          <div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
              JM Sites client report
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Detailed Website Review Summary
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Prepared for{" "}
              {clientName(result)}
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              exportReport(
                result,
                profile,
              )
            }
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-violet-500"
          >
            Download detailed client summary
          </button>

        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-3 sm:p-8 lg:grid-cols-5">

          {metrics.map(
            ([label, value]) => (
              <div
                key={String(
                  label,
                )}
                className="rounded-2xl border border-border bg-secondary/25 p-4"
              >

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {label}
                </p>

                <p
                  className="mt-2 text-2xl font-bold"
                  style={{
                    color:
                      typeof value ===
                        "number" &&
                      !String(
                        label,
                      ).includes(
                        "Pages",
                      )
                        ? scoreHex(
                            value,
                          )
                        : undefined,
                  }}
                >
                  {value}
                </p>

              </div>
            ),
          )}

        </div>

      </div>

      <div className="rounded-2xl border border-border bg-card p-6">

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
          Opportunity overview
        </p>

        <h3 className="mt-2 text-lg font-semibold text-foreground">
          Where the website could deliver even more value
        </h3>

        <p className="mt-3 text-sm leading-7 text-secondary-foreground">
          {buildClientSummary(
            result,
            successfulPages,
          )}
        </p>

      </div>

      {(proofPoints.length > 0 ||
        report.positioningDirection) && (
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-6">

          <h3 className="text-base font-semibold text-foreground">
            Business value already present
          </h3>

          {proofPoints.length >
            0 && (
            <div className="mt-4">
              <BulletList
                items={
                  proofPoints
                }
              />
            </div>
          )}

          {report.positioningDirection && (
            <p className="mt-4 border-t border-border pt-4 text-sm leading-7 text-secondary-foreground">
              <strong>
                Suggested positioning direction:
              </strong>{" "}
              {
                report.positioningDirection
              }
            </p>
          )}

        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">

        {priorities.map(
          (
            priority,
            index,
          ) => (
            <div
              key={
                priority.title
              }
              className="rounded-2xl border border-border bg-card p-6"
            >

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                Opportunity{" "}
                {index + 1}
              </p>

              <h3 className="mt-2 text-base font-semibold text-foreground">
                {
                  priority.title
                }
              </h3>

              <p className="mt-3 text-sm text-secondary-foreground">
                <strong>
                  What we found:
                </strong>{" "}
                {
                  priority.finding
                }
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-secondary-foreground">
                  Why it matters:
                </strong>{" "}
                {
                  priority.impact
                }
              </p>

              <p className="mt-2 text-sm text-muted-foreground">
                <strong className="text-secondary-foreground">
                  What to do:
                </strong>{" "}
                {
                  priority.action
                }
              </p>

            </div>
          ),
        )}

      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-6">

        <h3 className="text-base font-semibold text-foreground">
          Measurement opportunity
        </h3>

        <p className="mt-3 text-sm leading-7 text-secondary-foreground">
          {analyticsSummary(
            result,
          )}{" "}
          Confirming priority page
          views, key calls to
          action, enquiry starts,
          completed enquiries,
          telephone clicks and
          email actions would help
          guide future improvements
          with real visitor
          evidence.
        </p>

      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-6">

        <h3 className="text-base font-semibold text-foreground">
          Ways to work together
        </h3>

        <p className="mt-2 text-sm leading-7 text-secondary-foreground">
          Support can begin with a
          focused fix, a priority
          improvement package, a
          staged website project or
          ongoing support. The right
          scope is confirmed after
          discovery.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">

          {engagementOptions.map(
            (option) => (
              <div
                key={
                  option.title
                }
                className="rounded-xl border border-border bg-card p-4"
              >

                <p className="font-semibold text-foreground">
                  {
                    option.title
                  }
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {
                    option.description
                  }
                </p>

              </div>
            ),
          )}

        </div>

      </div>

      <div className="rounded-2xl border border-slate-500/20 bg-slate-500/[0.04] p-6">

        <h3 className="text-base font-semibold text-foreground">
          Scope and interpretation
        </h3>

        <div className="mt-4">
          <BulletList
            items={
              report.scopeNotes
            }
          />
        </div>

      </div>

    </section>
  );
}