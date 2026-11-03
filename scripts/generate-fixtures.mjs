import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

const outDir = path.resolve("fixtures");
fs.mkdirSync(outDir, { recursive: true });

function newDoc() {
  return new PDFDocument({
    size: "A4",
    margins: { top: 46, bottom: 46, left: 48, right: 48 },
    info: { Title: "Synthetic CV fixture", Author: "CVRabbit QA" },
  });
}

function save(doc, name) {
  return new Promise((resolve) => {
    const stream = fs.createWriteStream(path.join(outDir, name));
    doc.pipe(stream);
    doc.end();
    stream.on("finish", resolve);
  });
}

function heading(doc, text, options = {}) {
  doc.moveDown(0.8);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor("#1c3738")
    .text(text.toUpperCase(), { characterSpacing: 1.4, ...options });
  const y = doc.y + 2;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .lineWidth(0.5)
    .strokeColor("#c8d4d0")
    .stroke();
  doc.moveDown(0.45);
  doc.fillColor("#222222");
}

function bullet(doc, text) {
  doc
    .font("Helvetica")
    .fontSize(8.8)
    .fillColor("#333333")
    .text(`•  ${text}`, { indent: 2, lineGap: 1.4 });
}

function role(doc, title, company, dates, location) {
  doc.moveDown(0.25);
  doc.font("Helvetica-Bold").fontSize(9.6).fillColor("#111111").text(title);
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text(`${company}${location ? ` · ${location}` : ""}  |  ${dates}`);
  doc.moveDown(0.15);
}

async function simple() {
  const doc = newDoc();
  doc.font("Times-Bold").fontSize(24).fillColor("#000f08").text("Jordan Ellis", { align: "center" });
  doc.font("Helvetica").fontSize(9).fillColor("#1c3738").text("OPERATIONS COORDINATOR", { align: "center", characterSpacing: 1.6 });
  doc.font("Helvetica").fontSize(8).fillColor("#555555").text("Portland, OR  ·  jordan.ellis@example.com  ·  +1 202 555 0148", { align: "center" });
  doc.moveDown(0.7);

  heading(doc, "Profile", { align: "center" });
  doc.font("Helvetica").fontSize(8.8).fillColor("#333333").text(
    "Operations coordinator with four years of experience keeping multi-site teams organised, compliant, and on schedule.",
  );

  heading(doc, "Experience", { align: "center" });
  role(doc, "Operations Coordinator", "Cedar & Pine Logistics", "Jan 2022 – Present", "Portland, OR");
  bullet(doc, "Coordinate daily routes for a fleet of 26 drivers across three depots.");
  bullet(doc, "Maintain compliance records and lead monthly safety briefings.");
  bullet(doc, "Reduced late deliveries by 22% through a revised dispatch schedule.");

  heading(doc, "Education", { align: "center" });
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#111111").text("BA · Business Administration");
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text("Portland State University · Portland, OR  |  Sep 2017 – Jun 2021");

  heading(doc, "Skills", { align: "center" });
  doc.font("Helvetica").fontSize(8.8).fillColor("#333333").text("Route planning · Vendor management · Safety compliance · Scheduling");

  await save(doc, "simple-cv.pdf");
}

async function detailed() {
  const doc = newDoc();
  doc.font("Helvetica-Bold").fontSize(23).fillColor("#000f08").text("Priya Nair");
  doc.font("Helvetica").fontSize(9.2).fillColor("#1c3738").text("SENIOR DATA ANALYST", { characterSpacing: 1.3 });
  doc.font("Helvetica").fontSize(8).fillColor("#555555").text(
    "Bengaluru, India  ·  priya.nair@example.com  ·  +91 98765 43210  ·  linkedin.com/in/priyanair  ·  priyanair.example.com",
  );
  doc.moveDown(0.5);

  heading(doc, "Professional Summary");
  doc.font("Helvetica").fontSize(8.8).fillColor("#333333").text(
    "Data analyst with seven years of experience translating messy operational data into decisions. Comfortable across the full analytics stack, from instrumentation and modelling to executive storytelling.",
  );

  heading(doc, "Work Experience");
  role(doc, "Senior Data Analyst", "Meridian Retail Group", "Mar 2021 – Present", "Bengaluru, India");
  bullet(doc, "Lead analytics for supply chain and fulfilment, supporting 42 warehouses and a team of four analysts.");
  bullet(doc, "Own the reporting layer in dbt and Power BI, used daily by 180 operations staff.");
  bullet(doc, "Reduced stock-out incidents by 27% by rebuilding demand forecasting with a rolling 12-week model.");
  bullet(doc, "Introduced a data quality scorecard that cut recurring reporting defects by 41%.");

  role(doc, "Data Analyst", "Lumen Health", "Jun 2018 – Feb 2021", "Pune, India");
  bullet(doc, "Built scheduling and utilisation dashboards for a network of 140 clinics.");
  bullet(doc, "Partnered with product teams to define north-star metrics and experiment readouts.");
  bullet(doc, "Automated 18 manual reports, saving roughly 30 hours per month.");

  role(doc, "Junior Analyst", "Fieldnote", "Aug 2016 – May 2018", "Mumbai, India");
  bullet(doc, "Maintained customer cohort reporting and supported quarterly business reviews.");
  bullet(doc, "Created a self-serve SQL library adopted by sales and support.");

  heading(doc, "Education");
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#111111").text("MSc · Statistics");
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text("University of Pune · Pune, India  |  Aug 2014 – Jun 2016");
  doc.font("Helvetica").fontSize(8.2).fillColor("#666666").text("Distinction. Dissertation on forecasting intermittent demand.");
  doc.moveDown(0.35);
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#111111").text("BSc · Mathematics");
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text("University of Mumbai · Mumbai, India  |  Jun 2011 – May 2014");

  heading(doc, "Skills");
  doc.font("Helvetica-Bold").fontSize(8.8).fillColor("#1c3738").text("Analytics");
  doc.font("Helvetica").fontSize(8.6).fillColor("#333333").text("SQL · Python · dbt · Power BI · Looker");
  doc.moveDown(0.2);
  doc.font("Helvetica-Bold").fontSize(8.8).fillColor("#1c3738").text("Planning");
  doc.font("Helvetica").fontSize(8.6).fillColor("#333333").text("Forecasting · Experiment design · Stakeholder communication · Mentoring");

  heading(doc, "Certifications");
  bullet(doc, "Google Advanced Data Analytics Certificate — 2022");
  bullet(doc, "dbt Analytics Engineering Certification — 2023");

  heading(doc, "Languages");
  bullet(doc, "English — Fluent");
  bullet(doc, "Hindi — Native");
  bullet(doc, "Malayalam — Conversational");

  await save(doc, "detailed-cv.pdf");
}

async function longCv() {
  const doc = newDoc();
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#000f08").text("Marcus Delacroix");
  doc.font("Helvetica").fontSize(9).fillColor("#1c3738").text("PRINCIPAL PROGRAMME MANAGER", { characterSpacing: 1.4 });
  doc.font("Helvetica").fontSize(8).fillColor("#555555").text("Montréal, Canada · marcus.delacroix@example.com · +1 514 555 0199");
  doc.moveDown(0.5);

  heading(doc, "Profile");
  doc.font("Helvetica").fontSize(8.8).fillColor("#333333").text(
    "Programme leader with fourteen years of experience delivering complex, regulated technology programmes across financial services, healthcare, and the public sector. Known for calm delivery under pressure and for building the operating rhythm that lets teams do their best work.",
  );

  heading(doc, "Professional Experience");
  const roles = [
    ["Principal Programme Manager", "Northwind Financial", "Feb 2020 – Present", "Montréal, Canada", [
      "Direct a $14M transformation programme spanning payments, fraud, and servicing.",
      "Chair a cross-functional steering group of 16 senior stakeholders.",
      "Introduced quarterly outcome reviews that reduced scope churn by 24%.",
      "Coach five programme managers and two delivery leads.",
      "Established a vendor scorecard now used across three business units.",
    ]],
    ["Senior Programme Manager", "Helix Health Systems", "Apr 2016 – Jan 2020", "Toronto, Canada", [
      "Delivered a national patient records migration for 210 clinics on schedule.",
      "Managed a consortium of four vendors and a distributed team of 60.",
      "Cut onboarding time for new clinics from six weeks to nine days.",
      "Built the programme's risk framework and chaired the change board.",
    ]],
    ["Programme Manager", "Civic Digital Office", "Sep 2013 – Mar 2016", "Ottawa, Canada", [
      "Led the delivery of a citizen services portal used by 1.2 million residents.",
      "Introduced accessibility gates that became the department standard.",
      "Negotiated a shared service agreement across three agencies.",
    ]],
    ["Delivery Lead", "Vertex Consulting", "Jul 2011 – Aug 2013", "Montréal, Canada", [
      "Ran delivery for regulatory reporting engagements at two major banks.",
      "Built the consulting practice's delivery playbook and onboarding materials.",
      "Managed budgets, forecasts, and client reporting for a $6M portfolio.",
    ]],
  ];

  for (const [title, company, dates, location, bullets] of roles) {
    role(doc, title, company, dates, location);
    for (const item of bullets) bullet(doc, item);
  }

  heading(doc, "Education");
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#111111").text("MBA · Strategy and Operations");
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text("McGill University · Montréal, Canada  |  2009 – 2011");
  doc.font("Helvetica").fontSize(8.2).fillColor("#666666").text("Dean's List. Case competition coach.");
  doc.moveDown(0.35);
  doc.font("Helvetica-Bold").fontSize(9.2).fillColor("#111111").text("BEng · Industrial Engineering");
  doc.font("Helvetica").fontSize(8.4).fillColor("#555555").text("Université de Montréal · Montréal, Canada  |  2005 – 2009");

  heading(doc, "Skills");
  const skillGroups = [
    ["Programme delivery", "Portfolio governance · RAID management · Benefits realisation · Vendor management"],
    ["Leadership", "Executive steering · Team coaching · Organisational change · Stakeholder alignment"],
    ["Technical", "Jira · Confluence · Power BI · Smartsheet · SQL fundamentals"],
  ];
  for (const [group, items] of skillGroups) {
    doc.font("Helvetica-Bold").fontSize(8.8).fillColor("#1c3738").text(group);
    doc.font("Helvetica").fontSize(8.6).fillColor("#333333").text(items);
    doc.moveDown(0.2);
  }

  heading(doc, "Certifications");
  bullet(doc, "Prosci Certified Change Practitioner — 2021");
  bullet(doc, "PMI Program Management Professional (PgMP) — 2019");
  bullet(doc, "Certified ScrumMaster — 2015");

  heading(doc, "Awards");
  bullet(doc, "Northwind Delivery Excellence Award — 2023");
  bullet(doc, "Helix Health Innovation Prize — 2018");

  heading(doc, "Volunteering");
  bullet(doc, "Board member, Digital Access Montréal — 2021 to present");
  bullet(doc, "Mentor, Women in Programme Management — 2019 to present");

  heading(doc, "Professional Memberships");
  bullet(doc, "Project Management Institute (PMI)");
  bullet(doc, "Association for Project Management (APM)");

  await save(doc, "long-cv.pdf");
}

async function twoColumn() {
  const doc = newDoc();
  const left = 40;
  const right = 225;
  const leftWidth = 158;
  const rightWidth = 330;

  doc.rect(0, 0, 210, 842).fill("#1c3738");
  doc.fillColor("#f4fff8");
  doc.font("Helvetica-Bold").fontSize(20).text("Elena", left, 54, { width: leftWidth });
  doc.font("Helvetica-Bold").fontSize(20).text("Vasquez", left, 76, { width: leftWidth });
  doc.font("Helvetica").fontSize(7.8).fillColor("#8baaad").text("PRODUCT DESIGN LEAD", left, 104, { width: leftWidth, characterSpacing: 1.2 });

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#f4fff8").text("CONTACT", left, 140, { width: leftWidth, characterSpacing: 1.3 });
  doc.font("Helvetica").fontSize(7.4).fillColor("#dce8e4").text(
    "elena.vasquez@example.com\n+34 600 555 019\nBarcelona, Spain\nlinkedin.com/in/elenavasquez",
    left,
    154,
    { width: leftWidth, lineGap: 3 },
  );

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#f4fff8").text("SKILLS", left, 250, { width: leftWidth, characterSpacing: 1.3 });
  doc.font("Helvetica").fontSize(7.4).fillColor("#dce8e4").text(
    "Product strategy\nDesign systems\nResearch operations\nPrototyping\nFacilitation\nTeam coaching\nAccessibility",
    left,
    264,
    { width: leftWidth, lineGap: 3 },
  );

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#f4fff8").text("LANGUAGES", left, 390, { width: leftWidth, characterSpacing: 1.3 });
  doc.font("Helvetica").fontSize(7.4).fillColor("#dce8e4").text(
    "Spanish — Native\nEnglish — Fluent\nCatalan — Conversational",
    left,
    404,
    { width: leftWidth, lineGap: 3 },
  );

  let y = 54;
  doc.fillColor("#000f08");
  doc.font("Helvetica-Bold").fontSize(18).text("Elena Vasquez", right, y, { width: rightWidth });
  y = doc.y + 2;
  doc.font("Helvetica").fontSize(8.6).fillColor("#1c3738").text("Product design lead with eleven years of experience", right, y, { width: rightWidth });
  y = doc.y + 16;

  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#1c3738").text("PROFILE", right, y, { width: rightWidth, characterSpacing: 1.3 });
  y = doc.y + 4;
  doc.font("Helvetica").fontSize(8.2).fillColor("#333333").text(
    "Design leader focused on making complex products feel simple. I build teams that research carefully, decide clearly, and ship with craft.",
    right,
    y,
    { width: rightWidth, lineGap: 1.5 },
  );
  y = doc.y + 14;

  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#1c3738").text("EXPERIENCE", right, y, { width: rightWidth, characterSpacing: 1.3 });
  y = doc.y + 5;

  const roles = [
    ["Lead Product Designer", "Cobalt Studio", "2021 – Present", "Barcelona", [
      "Lead a team of seven designers across two product lines.",
      "Rebuilt the design system, reducing UI defects by 34%.",
      "Introduced a weekly research cadence with 120 participants per year.",
    ]],
    ["Senior Product Designer", "Lumen Health", "2018 – 2021", "Madrid", [
      "Owned the patient scheduling experience across web and mobile.",
      "Ran discovery with clinicians and support teams across 40 clinics.",
      "Launched a booking flow that lifted completion by 22%.",
    ]],
    ["Product Designer", "Fieldnote", "2015 – 2018", "Valencia", [
      "Designed a collaborative research workspace for universities.",
      "Built the first version of the component library.",
    ]],
  ];
  for (const [title, company, dates, location, bullets] of roles) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text(title, right, y, { width: rightWidth });
    y = doc.y + 1;
    doc.font("Helvetica").fontSize(7.6).fillColor("#555555").text(`${company} · ${location}  |  ${dates}`, right, y, { width: rightWidth });
    y = doc.y + 3;
    for (const item of bullets) {
      doc.font("Helvetica").fontSize(7.8).fillColor("#333333").text(`•  ${item}`, right + 2, y, { width: rightWidth - 4, lineGap: 1.5 });
      y = doc.y + 1.5;
    }
    y += 6;
  }

  doc.font("Helvetica-Bold").fontSize(8.4).fillColor("#1c3738").text("EDUCATION", right, y, { width: rightWidth, characterSpacing: 1.3 });
  y = doc.y + 5;
  doc.font("Helvetica-Bold").fontSize(8.8).fillColor("#111111").text("BA · Graphic Design", right, y, { width: rightWidth });
  y = doc.y + 1;
  doc.font("Helvetica").fontSize(7.6).fillColor("#555555").text("Elisava School of Design · Barcelona  |  2009 – 2013", right, y, { width: rightWidth });

  await save(doc, "two-column-cv.pdf");
}

await simple();
await detailed();
await longCv();
await twoColumn();

console.log("Fixtures written to", outDir);
