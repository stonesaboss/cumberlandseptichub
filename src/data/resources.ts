// Centralized configuration for the septic knowledge catalog (Phase 1).
//
// IMPORTANT: entries in `plannedGuides` with status "planned" are PROVISIONAL
// topic concepts only — they are NOT approved article targets, must never
// render as links, must never appear in the sitemap and must never generate
// routes. After keyword and SERP research, provisional entries will be
// replaced with researched article records (status "published" + real href).
//
// Authorship: future articles may use "Cumberland Septic Hub Editorial Team"
// as the organizational author. Leave `reviewedBy` empty unless a real,
// accurately-disclosable qualified reviewer has actually reviewed the content.

export type ResourceStatus = "planned" | "published";

export interface ResourceLink {
  label: string;
  href: string;
  blurb?: string;
}

export interface ResourceGuide {
  title: string;
  description: string;
  category: string;
  status: ResourceStatus;
  /** Required (and only rendered) when status is "published". */
  href?: string;
  image?: string | null;
  authorName?: string;
  reviewedBy?: string;
  publishedDate?: string;
  updatedDate?: string;
}

export interface ResourceCategory {
  title: string;
  /** Page H1 (may differ slightly from the card title). */
  h1: string;
  slug: string;
  href: string;
  shortDescription: string;
  metaDescription: string;
  /** Hero intro paragraph used on the hub page. */
  intro: string;
  /** Set to the real path once the asset exists (see public/images/resources/README.md). */
  heroImage: string | null;
  /** Intended future filename — documented in the image manifest. */
  heroImageFile: string;
  heroAlt: string;
  relatedServiceLinks: ResourceLink[];
  relatedCategoryLinks: ResourceLink[];
  plannedGuides: ResourceGuide[];
  publishedGuides: ResourceGuide[];
}

export const RESOURCES_HOME = {
  title: "Septic System Resources | Cumberland Septic Hub",
  h1: "Septic System Resources for Upper Cumberland Property Owners",
  href: "/resources/",
  metaDescription:
    "A septic resource center for Upper Cumberland property owners — understand septic pumping, maintenance, warning signs, repairs, drain fields, inspections, installations and regional property considerations.",
  heroImage: null as string | null,
  heroImageFile: "septic-resources-hero.webp",
  heroAlt:
    "Illustration of a residential septic system and rural Upper Cumberland property",
};

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    title: "Septic Costs and Pricing Factors",
    h1: "Septic Costs and Pricing Factors",
    slug: "septic-costs",
    href: "/resources/septic-costs/",
    shortDescription:
      "Why septic pricing varies so much — access, tank size, service scope and the property factors providers weigh before quoting.",
    metaDescription:
      "Understand the factors that drive septic service pricing in Upper Cumberland, TN — tank size, access, service scope, repair complexity and why exact pricing requires a property review.",
    intro:
      "Septic pricing questions are usually the first questions. This hub explains what actually drives the cost of pumping, repair, inspection and installation work — and why honest answers start with the property, not a price list.",
    heroImage: null,
    heroImageFile: "septic-costs.webp",
    heroAlt:
      "Septic service provider reviewing tank access and property conditions before estimating service",
    relatedServiceLinks: [
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Septic Repair in Cookeville",
        href: "/septic-repair-cookeville-tn/",
      },
      {
        label: "Drain-Field Repair in Cookeville",
        href: "/drain-field-repair-cookeville-tn/",
      },
      {
        label: "Septic Installation in Cookeville",
        href: "/septic-installation-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Septic Pumping and Maintenance",
        href: "/resources/septic-pumping-maintenance/",
        blurb: "the routine service most cost questions start with",
      },
      {
        label: "Septic Repairs and Drain Fields",
        href: "/resources/septic-repairs-drain-fields/",
        blurb: "where repair-cost variables come from",
      },
      {
        label: "Septic Installation and Replacement",
        href: "/resources/septic-installation-replacement/",
        blurb: "the largest septic projects, explained",
      },
    ],
    plannedGuides: [
      {
        title: "Septic Pumping Cost Factors",
        description:
          "What determines the price of a routine pump-out, from tank size to lid access.",
        category: "septic-costs",
        status: "planned",
      },
      {
        title: "Septic Repair Cost Factors",
        description:
          "Why two “septic repairs” can cost very different amounts.",
        category: "septic-costs",
        status: "planned",
      },
      {
        title: "Drain-Field Repair or Replacement Costs",
        description: "The variables behind the most expensive septic problem.",
        category: "septic-costs",
        status: "planned",
      },
      {
        title: "New Septic Installation Cost Factors",
        description:
          "How site conditions and system design shape installation budgets.",
        category: "septic-costs",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
  {
    title: "Septic Pumping and Maintenance",
    h1: "Septic Pumping and Maintenance Guides",
    slug: "septic-pumping-maintenance",
    href: "/resources/septic-pumping-maintenance/",
    shortDescription:
      "How septic systems work, why pumping matters, and the maintenance habits that keep a system boring and reliable.",
    metaDescription:
      "Septic pumping and maintenance guides for Upper Cumberland property owners — how tanks work, why pumping intervals vary, pumping versus cleaning, records and drain-field protection.",
    intro:
      "A septic system that gets pumped on time and treated well can quietly serve a property for decades. This hub organizes the pumping and maintenance fundamentals every septic owner eventually needs.",
    heroImage: null,
    heroImageFile: "septic-pumping-maintenance.webp",
    heroAlt:
      "Septic pumping equipment servicing an accessible residential septic tank",
    relatedServiceLinks: [
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Septic Tank Cleaning in Cookeville",
        href: "/septic-tank-cleaning-cookeville-tn/",
      },
      {
        label: "Septic Tank Locating in Cookeville",
        href: "/septic-tank-locating-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Septic Problems and Warning Signs",
        href: "/resources/septic-problems/",
        blurb: "when maintenance symptoms point at something bigger",
      },
      {
        label: "Septic Costs and Pricing Factors",
        href: "/resources/septic-costs/",
        blurb: "what routine service typically depends on",
      },
      {
        label: "Septic Inspections and Property Buying",
        href: "/resources/septic-inspections-property-buying/",
        blurb: "the documentation side of good maintenance",
      },
    ],
    plannedGuides: [
      {
        title: "How Often Septic Tanks May Need Pumping",
        description:
          "The household and system factors behind pumping frequency.",
        category: "septic-pumping-maintenance",
        status: "planned",
      },
      {
        title: "What Happens During a Pumping Appointment",
        description:
          "From truck positioning to lid access to what the provider observes.",
        category: "septic-pumping-maintenance",
        status: "planned",
      },
      {
        title: "Septic Pumping Versus Septic Tank Cleaning",
        description:
          "Two terms, sometimes two different jobs — what to ask for.",
        category: "septic-pumping-maintenance",
        status: "planned",
      },
      {
        title: "Septic Maintenance Checklist for Property Owners",
        description: "The habits and records that extend system life.",
        category: "septic-pumping-maintenance",
        status: "planned",
      },
    ],
    publishedGuides: [
      {
        title: "Septic Maintenance Guide for Property Owners",
        description:
          "The full owner’s guide — pumping-frequency factors, water use, drain protection, warning signs, records and questions for providers.",
        category: "septic-pumping-maintenance",
        status: "published",
        href: "/septic-maintenance/",
      },
    ],
  },
  {
    title: "Septic Problems and Warning Signs",
    h1: "Septic Problems, Symptoms and Warning Signs",
    slug: "septic-problems",
    href: "/resources/septic-problems/",
    shortDescription:
      "Slow drains, odors, gurgling, backups and alarms — what the common warning signs can mean and what to do next.",
    metaDescription:
      "Recognize septic warning signs — slow drains, gurgling, odors, backups, wet drain-field areas and alarms — and learn why similar symptoms can have very different causes.",
    intro:
      "Septic systems rarely fail without warning. This hub covers the symptoms property owners notice first, what they can (and cannot) tell you, and the safety basics for active backups.",
    heroImage: null,
    heroImageFile: "septic-problems.webp",
    heroAlt:
      "Property owner observing warning signs near a residential septic system",
    relatedServiceLinks: [
      {
        label: "Emergency Septic Service Requests",
        href: "/emergency-septic-service-cookeville-tn/",
      },
      {
        label: "Septic Repair in Cookeville",
        href: "/septic-repair-cookeville-tn/",
      },
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Drain-Field Repair in Cookeville",
        href: "/drain-field-repair-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Septic Repairs and Drain Fields",
        href: "/resources/septic-repairs-drain-fields/",
        blurb: "what happens after a symptom is evaluated",
      },
      {
        label: "Septic Pumping and Maintenance",
        href: "/resources/septic-pumping-maintenance/",
        blurb: "the routine care that prevents many problems",
      },
      {
        label: "Septic Costs and Pricing Factors",
        href: "/resources/septic-costs/",
        blurb: "what fixing problems tends to depend on",
      },
    ],
    plannedGuides: [
      {
        title: "Signs a Septic Tank May Be Full",
        description: "How a filling tank announces itself before a backup.",
        category: "septic-problems",
        status: "planned",
      },
      {
        title: "Why Septic Systems Produce Odors",
        description: "Indoor and outdoor odor patterns and what they suggest.",
        category: "septic-problems",
        status: "planned",
      },
      {
        title: "What Causes Drains to Gurgle",
        description: "The plumbing physics behind the sound everyone ignores.",
        category: "septic-problems",
        status: "planned",
      },
      {
        title: "What to Do When Sewage Backs Up",
        description:
          "Immediate steps, safety precautions and requesting urgent help.",
        category: "septic-problems",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
  {
    title: "Septic Repairs and Drain Fields",
    h1: "Septic Repair and Drain-Field Guides",
    slug: "septic-repairs-drain-fields",
    href: "/resources/septic-repairs-drain-fields/",
    shortDescription:
      "The components that fail, how providers evaluate them, and how repair decisions differ from replacement decisions.",
    metaDescription:
      "Understand septic repairs and drain fields — system components, how failures are evaluated, why pumping does not fix every backup, and repair-versus-replacement considerations.",
    intro:
      "Between the house and the soil sits a chain of components that can each fail in its own way. This hub explains the system, the evaluation process and the decisions that follow a diagnosis.",
    heroImage: null,
    heroImageFile: "septic-repairs-drain-fields.webp",
    heroAlt:
      "Septic professional evaluating tank components and a residential drain field",
    relatedServiceLinks: [
      {
        label: "Septic Repair in Cookeville",
        href: "/septic-repair-cookeville-tn/",
      },
      {
        label: "Drain-Field Repair in Cookeville",
        href: "/drain-field-repair-cookeville-tn/",
      },
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Septic Installation in Cookeville",
        href: "/septic-installation-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Septic Problems and Warning Signs",
        href: "/resources/septic-problems/",
        blurb: "the symptoms that lead to repair evaluations",
      },
      {
        label: "Septic Installation and Replacement",
        href: "/resources/septic-installation-replacement/",
        blurb: "when repair stops being the practical answer",
      },
      {
        label: "Septic Costs and Pricing Factors",
        href: "/resources/septic-costs/",
        blurb: "why repair pricing varies",
      },
    ],
    plannedGuides: [
      {
        title: "Signs of Drain-Field Trouble",
        description:
          "Surface clues that the soil absorption system is struggling.",
        category: "septic-repairs-drain-fields",
        status: "planned",
      },
      {
        title: "Common Septic-System Repairs",
        description: "Baffles, pumps, pipes and boxes — the usual suspects.",
        category: "septic-repairs-drain-fields",
        status: "planned",
      },
      {
        title: "Septic Distribution-Box Problems",
        description: "How a small component unbalances an entire field.",
        category: "septic-repairs-drain-fields",
        status: "planned",
      },
      {
        title: "Septic Repair Versus System Replacement",
        description: "The considerations behind the biggest septic decision.",
        category: "septic-repairs-drain-fields",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
  {
    title: "Septic Installation and Replacement",
    h1: "Septic Installation and Replacement Guides",
    slug: "septic-installation-replacement",
    href: "/resources/septic-installation-replacement/",
    shortDescription:
      "What new-construction and replacement projects involve — evaluation, planning, approvals, installation and restoration.",
    metaDescription:
      "Septic installation and replacement guides — the general project process, site evaluation, planning, approvals, access considerations and how new construction differs from replacement.",
    intro:
      "Installing or replacing a septic system is the largest project in septic ownership. This hub walks through the general process and the questions worth asking before ground breaks.",
    heroImage: null,
    heroImageFile: "septic-installation-replacement.webp",
    heroAlt:
      "Residential septic system installation on a rural Tennessee property",
    relatedServiceLinks: [
      {
        label: "Septic Installation in Cookeville",
        href: "/septic-installation-cookeville-tn/",
      },
      {
        label: "Septic Repair in Cookeville",
        href: "/septic-repair-cookeville-tn/",
      },
      {
        label: "Drain-Field Repair in Cookeville",
        href: "/drain-field-repair-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
      { label: "Upper Cumberland Service Area", href: "/service-area/" },
    ],
    relatedCategoryLinks: [
      {
        label: "Upper Cumberland Septic Guide",
        href: "/resources/upper-cumberland-septic-guide/",
        blurb: "regional terrain and access realities",
      },
      {
        label: "Septic Repairs and Drain Fields",
        href: "/resources/septic-repairs-drain-fields/",
        blurb: "when replacement enters the conversation",
      },
      {
        label: "Septic Costs and Pricing Factors",
        href: "/resources/septic-costs/",
        blurb: "the variables behind installation budgets",
      },
    ],
    plannedGuides: [
      {
        title: "The Septic Installation Process",
        description:
          "Stage by stage, from property information to final grading.",
        category: "septic-installation-replacement",
        status: "planned",
      },
      {
        title: "Replacing an Older Septic System",
        description: "What end-of-life systems involve that new builds do not.",
        category: "septic-installation-replacement",
        status: "planned",
      },
      {
        title: "Septic Planning for New Construction",
        description: "Sequencing the septic system into a building project.",
        category: "septic-installation-replacement",
        status: "planned",
      },
      {
        title: "Questions to Ask Before Septic Installation",
        description:
          "The conversation to have before committing to a contractor.",
        category: "septic-installation-replacement",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
  {
    title: "Septic Inspections and Property Buying",
    h1: "Septic Inspections for Property Owners, Buyers and Sellers",
    slug: "septic-inspections-property-buying",
    href: "/resources/septic-inspections-property-buying/",
    shortDescription:
      "Inspection types, real-estate considerations, records, scope questions and the limits of what an inspection can promise.",
    metaDescription:
      "Septic inspection guides for owners, buyers and sellers — inspection types, real-estate transactions, tank locating, records, scope questions and inspection limitations.",
    intro:
      "A house on septic comes with a private wastewater system — and usually very little paperwork. This hub covers inspections for maintenance, for problems and for the property transactions where they matter most.",
    heroImage: null,
    heroImageFile: "septic-inspections-property-buying.webp",
    heroAlt:
      "Septic inspection being performed for a residential property transaction",
    relatedServiceLinks: [
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
      {
        label: "Septic Tank Locating in Cookeville",
        href: "/septic-tank-locating-cookeville-tn/",
      },
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Septic Repair in Cookeville",
        href: "/septic-repair-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Upper Cumberland Septic Guide",
        href: "/resources/upper-cumberland-septic-guide/",
        blurb: "regional context for rural property purchases",
      },
      {
        label: "Septic Pumping and Maintenance",
        href: "/resources/septic-pumping-maintenance/",
        blurb: "the records an inspection hopes to find",
      },
      {
        label: "Septic Problems and Warning Signs",
        href: "/resources/septic-problems/",
        blurb: "symptoms that justify a problem-focused inspection",
      },
    ],
    plannedGuides: [
      {
        title: "Septic Inspections When Buying a Home",
        description:
          "Protecting the biggest purchase from the biggest unknown.",
        category: "septic-inspections-property-buying",
        status: "planned",
      },
      {
        title: "Septic Inspections When Selling a Home",
        description: "How sellers get ahead of septic questions.",
        category: "septic-inspections-property-buying",
        status: "planned",
      },
      {
        title: "What May Be Included in a Septic Inspection",
        description:
          "Visual checks, flow tests, pumping and reporting differences.",
        category: "septic-inspections-property-buying",
        status: "planned",
      },
      {
        title: "How to Find Septic Records and Tank Locations",
        description:
          "Where system history hides and how providers locate tanks.",
        category: "septic-inspections-property-buying",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
  {
    title: "Upper Cumberland Septic Guide",
    h1: "Upper Cumberland Septic System Guide",
    slug: "upper-cumberland-septic-guide",
    href: "/resources/upper-cumberland-septic-guide/",
    shortDescription:
      "How the region’s terrain, rural access and property patterns shape septic service across the Upper Cumberland.",
    metaDescription:
      "A regional septic guide for the Upper Cumberland — Cookeville, Crossville, Sparta, Livingston, Smithville and rural communities — covering terrain, access, weather and planning considerations.",
    intro:
      "Septic service is local by nature, and the Upper Cumberland is distinctive: plateau rock, lake slopes, farm hollows and long gravel drives. This hub connects general septic knowledge to the region’s actual conditions.",
    heroImage: null,
    heroImageFile: "upper-cumberland-septic-guide.webp",
    heroAlt:
      "Rural Upper Cumberland property with wooded terrain and septic service access",
    relatedServiceLinks: [
      { label: "Upper Cumberland Service Area", href: "/service-area/" },
      {
        label: "Septic Pumping in Cookeville",
        href: "/septic-pumping-cookeville-tn/",
      },
      {
        label: "Septic Pumping in Crossville",
        href: "/septic-pumping-crossville-tn/",
      },
      {
        label: "Septic Installation in Cookeville",
        href: "/septic-installation-cookeville-tn/",
      },
      {
        label: "Septic Tank Locating in Cookeville",
        href: "/septic-tank-locating-cookeville-tn/",
      },
      {
        label: "Septic Inspections in Cookeville",
        href: "/septic-inspection-cookeville-tn/",
      },
    ],
    relatedCategoryLinks: [
      {
        label: "Septic Installation and Replacement",
        href: "/resources/septic-installation-replacement/",
        blurb: "where regional planning matters most",
      },
      {
        label: "Septic Inspections and Property Buying",
        href: "/resources/septic-inspections-property-buying/",
        blurb: "for rural and lake-property purchases",
      },
      {
        label: "Septic Pumping and Maintenance",
        href: "/resources/septic-pumping-maintenance/",
        blurb: "routine care under rural access conditions",
      },
    ],
    plannedGuides: [
      {
        title: "Septic Planning for Rural Upper Cumberland Properties",
        description:
          "Access, terrain and layout considerations before service or construction.",
        category: "upper-cumberland-septic-guide",
        status: "planned",
      },
      {
        title: "Preparing a Property for Septic Service",
        description:
          "What to do before the truck arrives — gates, lids, distances.",
        category: "upper-cumberland-septic-guide",
        status: "planned",
      },
      {
        title: "Questions About Tennessee Septic Permits and Approvals",
        description:
          "Where to direct regulatory questions and what to confirm.",
        category: "upper-cumberland-septic-guide",
        status: "planned",
      },
      {
        title: "How Terrain and Access Affect Septic Service",
        description: "Slopes, rock, soft ground and hose distance, explained.",
        category: "upper-cumberland-septic-guide",
        status: "planned",
      },
    ],
    publishedGuides: [],
  },
];

/** Guides that already exist on the site and can be linked from the landing page. */
export const AVAILABLE_GUIDES: ResourceGuide[] = [
  {
    title: "Septic Maintenance Guide for Property Owners",
    description:
      "Pumping-frequency factors, water use, drain protection, warning signs, records and provider questions.",
    category: "septic-pumping-maintenance",
    status: "published",
    href: "/septic-maintenance/",
  },
  {
    title: "Septic Service Questions (FAQ)",
    description:
      "Answers to the most common pumping, repair, inspection and installation questions.",
    category: "septic-problems",
    status: "published",
    href: "/#faqs",
  },
];

export const RESOURCE_DISCLOSURE_NOTE =
  "Cumberland Septic Hub is an independent referral service. Educational content on this website is general information — it is not a diagnosis of any specific system, and it does not replace an on-site evaluation by a qualified provider or guidance from the appropriate government authority.";
