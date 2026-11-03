import type { CvData, CvSettings } from "./types";

/** Entirely fictional data used for template previews, screenshots, and QA. */
export const SAMPLE_DATA: CvData = {
  personal: {
    fullName: "Amara Okafor",
    professionalTitle: "Senior Product Manager",
    email: "amara.okafor@example.com",
    phone: "+44 7700 900 118",
    location: "London, United Kingdom",
    linkedin: "linkedin.com/in/amaraokafor",
    website: "amaraokafor.example.com",
    summary:
      "Product leader with nine years of experience building financial and consumer products used by more than two million people. Known for turning ambiguous problems into focused roadmaps, coaching cross-functional teams, and shipping measurable outcomes without unnecessary complexity.",
  },
  experience: [
    {
      id: "exp_sample_1",
      jobTitle: "Senior Product Manager",
      employer: "Northwind Financial",
      location: "London, UK",
      startDate: "2021-03",
      endDate: "",
      current: true,
      responsibilities: [
        {
          id: "exp1_r1",
          text: "Lead a portfolio of three product squads across onboarding, payments, and account servicing.",
        },
        {
          id: "exp1_r2",
          text: "Own quarterly planning and discovery, aligning engineering, design, risk, and compliance around a single measurable roadmap.",
        },
        {
          id: "exp1_r3",
          text: "Partner with research to establish a continuous interview programme covering new and existing customers.",
        },
      ],
      achievements: [
        {
          id: "exp1_a1",
          text: "Redesigned account opening, reducing median completion time from 11 minutes to 4 and lifting approval rates by 18%.",
        },
        {
          id: "exp1_a2",
          text: "Introduced a shared experimentation framework now used by six squads, increasing validated releases from 3 to 14 per quarter.",
        },
      ],
    },
    {
      id: "exp_sample_2",
      jobTitle: "Product Manager",
      employer: "Lumen Health",
      location: "Manchester, UK",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      responsibilities: [
        {
          id: "exp2_r1",
          text: "Managed the patient scheduling journey across web and mobile for a network of 140 clinics.",
        },
        {
          id: "exp2_r2",
          text: "Ran a weekly discovery cadence with clinicians, support teams, and patients to prioritise the highest-friction moments.",
        },
      ],
      achievements: [
        {
          id: "exp2_a1",
          text: "Launched automated reminders and rescheduling, cutting missed appointments by 31% within two quarters.",
        },
        {
          id: "exp2_a2",
          text: "Consolidated three legacy booking tools into one platform, reducing support tickets by 42%.",
        },
      ],
    },
    {
      id: "exp_sample_3",
      jobTitle: "Associate Product Manager",
      employer: "Fieldnote",
      location: "Bristol, UK",
      startDate: "2016-09",
      endDate: "2018-05",
      current: false,
      responsibilities: [
        {
          id: "exp3_r1",
          text: "Supported the launch of a collaborative research workspace used by universities and design studios.",
        },
        {
          id: "exp3_r2",
          text: "Owned the customer feedback loop, synthesising 400+ monthly conversations into a prioritised insight library.",
        },
      ],
      achievements: [
        {
          id: "exp3_a1",
          text: "Shipped a permissions model that unlocked the first enterprise contracts worth £240k in annual revenue.",
        },
      ],
    },
  ],
  education: [
    {
      id: "edu_sample_1",
      institution: "University of Edinburgh",
      degree: "MSc",
      field: "Management",
      location: "Edinburgh, UK",
      startDate: "2015-09",
      endDate: "2016-08",
      current: false,
      description: "Distinction. Dissertation on decision-making in early-stage product teams.",
    },
    {
      id: "edu_sample_2",
      institution: "University of Lagos",
      degree: "BSc",
      field: "Computer Science",
      location: "Lagos, Nigeria",
      startDate: "2011-09",
      endDate: "2015-06",
      current: false,
      description: "First Class Honours. President of the student technology society.",
    },
  ],
  skills: [
    {
      id: "cat_sample_1",
      name: "Product strategy",
      include: true,
      skills: [
        {
          id: "skill_s1",
          name: "Discovery & research",
          include: true,
          tasks: [
            { id: "task_s1_1", text: "Customer interviews and jobs-to-be-done" },
            { id: "task_s1_2", text: "Opportunity mapping and problem framing" },
          ],
        },
        {
          id: "skill_s2",
          name: "Roadmapping",
          include: true,
          tasks: [
            { id: "task_s2_1", text: "Outcome-based quarterly planning" },
            { id: "task_s2_2", text: "Stakeholder alignment across risk and compliance" },
          ],
        },
      ],
    },
    {
      id: "cat_sample_2",
      name: "Analytics & experimentation",
      include: true,
      skills: [
        {
          id: "skill_s3",
          name: "SQL & product analytics",
          include: true,
          tasks: [{ id: "task_s3_1", text: "Amplitude, Looker, dbt foundations" }],
        },
        {
          id: "skill_s4",
          name: "A/B testing",
          include: true,
          tasks: [{ id: "task_s4_1", text: "Hypothesis design, power analysis, and readouts" }],
        },
      ],
    },
    {
      id: "cat_sample_3",
      name: "Leadership",
      include: true,
      skills: [
        {
          id: "skill_s5",
          name: "Team coaching",
          include: true,
          tasks: [{ id: "task_s5_1", text: "Mentored four PMs, two promoted within 18 months" }],
        },
        {
          id: "skill_s6",
          name: "Cross-functional influence",
          include: true,
          tasks: [],
        },
      ],
    },
  ],
  additional: [
    {
      id: "add_sample_1",
      kind: "certifications",
      title: "Certifications",
      include: true,
      items: [
        {
          id: "cert_1",
          title: "Certified Scrum Product Owner",
          subtitle: "Scrum Alliance",
          text: "2020",
          link: "",
        },
      ],
    },
    {
      id: "add_sample_2",
      kind: "languages",
      title: "Languages",
      include: true,
      items: [
        { id: "lang_1", title: "English", subtitle: "Native", text: "", link: "" },
        { id: "lang_2", title: "Igbo", subtitle: "Fluent", text: "", link: "" },
        { id: "lang_3", title: "French", subtitle: "Conversational", text: "", link: "" },
      ],
    },
    {
      id: "add_sample_3",
      kind: "volunteering",
      title: "Volunteering",
      include: true,
      items: [
        {
          id: "vol_1",
          title: "Mentor, Women in Product UK",
          subtitle: "2022 — Present",
          text: "Mentor early-career product managers and run quarterly portfolio review sessions.",
          link: "",
        },
      ],
    },
  ],
};

export const SAMPLE_SETTINGS: CvSettings = {
  templateId: "classic",
  accent: "#1c3738",
  font: "lato",
  density: "comfortable",
  sectionOrder: ["summary", "experience", "education", "skills", "additional"],
  sectionVisibility: {
    summary: true,
    experience: true,
    education: true,
    skills: true,
    additional: true,
  },
};

export const MINIMAL_SAMPLE_DATA: CvData = {
  personal: {
    fullName: "Jonah Reed",
    professionalTitle: "Operations Coordinator",
    email: "jonah.reed@example.com",
    phone: "+1 202 555 0148",
    location: "Portland, OR",
    linkedin: "",
    website: "",
    summary:
      "Operations coordinator with four years of experience keeping multi-site teams organised, compliant, and on schedule.",
  },
  experience: [
    {
      id: "min_exp_1",
      jobTitle: "Operations Coordinator",
      employer: "Cedar & Pine Logistics",
      location: "Portland, OR",
      startDate: "2022-01",
      endDate: "",
      current: true,
      responsibilities: [
        { id: "min_r1", text: "Coordinate daily routes for a fleet of 26 drivers across three depots." },
        { id: "min_r2", text: "Maintain compliance records and lead monthly safety briefings." },
      ],
      achievements: [
        { id: "min_a1", text: "Reduced late deliveries by 22% through a revised dispatch schedule." },
      ],
    },
  ],
  education: [
    {
      id: "min_edu_1",
      institution: "Portland State University",
      degree: "BA",
      field: "Business Administration",
      location: "Portland, OR",
      startDate: "2017-09",
      endDate: "2021-06",
      current: false,
      description: "",
    },
  ],
  skills: [
    {
      id: "min_cat_1",
      name: "Operations",
      include: true,
      skills: [
        { id: "min_s1", name: "Route planning", include: true, tasks: [] },
        { id: "min_s2", name: "Vendor management", include: true, tasks: [] },
        { id: "min_s3", name: "Safety compliance", include: true, tasks: [] },
      ],
    },
  ],
  additional: [],
};
