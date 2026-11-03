"use client";

import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

import {
  contactItems,
  displayName,
  formatDateRange,
  getRenderSections,
  stripProtocol,
  visibleAdditionalSections,
  visibleSkillCategories,
} from "@/lib/cv/format";
import type {
  CvData,
  CvSettings,
  ExperienceEntry,
  RenderSectionKey,
} from "@/lib/cv/types";
import { PDF_FONT_FAMILIES, registerPdfFonts } from "@/lib/pdf/fonts";
import { PDF_COLORS, spacingFor } from "@/lib/pdf/theme";
import { initials } from "@/lib/utils";

registerPdfFonts();

export interface CvDocumentProps {
  data: CvData;
  settings: CvSettings;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : clean;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return `rgba(28,55,56,${alpha})`;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function withProtocol(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function displayContact(value: string, type: string) {
  if (type === "linkedin" || type === "website") return stripProtocol(value);
  return value;
}

function sectionLabel(key: RenderSectionKey) {
  switch (key) {
    case "summary":
      return "Profile";
    case "experience":
      return "Experience";
    case "education":
      return "Education";
    case "skills":
      return "Skills";
    default:
      return "Additional";
  }
}

export function CvDocument({ data, settings }: CvDocumentProps) {
  const t = spacingFor(settings.templateId, settings.density);
  const fontFamily = PDF_FONT_FAMILIES[settings.font];
  const isAts = settings.templateId === "ats";
  const accent = isAts ? PDF_COLORS.ink : settings.accent;
  const name = displayName(data);
  const template = settings.templateId;
  const showNameInFooter = data.personal.fullName.trim().length > 0;

  const styles = {
    name: {
      fontFamily,
      fontSize: t.nameSize,
      fontWeight: 700 as const,
      color: PDF_COLORS.ink,
      letterSpacing: -0.3,
      lineHeight: 1.1,
    },
    nameExecutive: {
      fontFamily,
      fontSize: t.nameSize,
      fontWeight: 600 as const,
      color: PDF_COLORS.mint,
      letterSpacing: 1.1,
      lineHeight: 1.12,
    },
    title: {
      fontFamily,
      fontSize: t.titleSize,
      fontWeight: 600 as const,
      color: accent,
      letterSpacing: 1.4,
      textTransform: "uppercase" as const,
      marginTop: 4,
    },
    titleExecutive: {
      fontFamily,
      fontSize: t.titleSize,
      fontWeight: 400 as const,
      color: hexToRgba("#f4fff8", 0.78),
      letterSpacing: 1.6,
      textTransform: "uppercase" as const,
      marginTop: 5,
    },
    contact: {
      fontFamily,
      fontSize: t.contactSize,
      color: PDF_COLORS.charcoal,
      lineHeight: 1.5,
    },
    contactExecutive: {
      fontFamily,
      fontSize: t.contactSize,
      color: hexToRgba("#f4fff8", 0.72),
      lineHeight: 1.5,
    },
    contactLink: {
      color: PDF_COLORS.charcoal,
      textDecoration: "none" as const,
    },
    contactLinkExecutive: {
      color: hexToRgba("#f4fff8", 0.82),
      textDecoration: "none" as const,
    },
    heading: {
      fontFamily,
      fontSize: t.headingSize,
      fontWeight: 700 as const,
      color: accent,
      letterSpacing: 1.7,
      textTransform: "uppercase" as const,
      lineHeight: 1.2,
    },
    headingInk: {
      fontFamily,
      fontSize: t.headingSize,
      fontWeight: 700 as const,
      color: PDF_COLORS.ink,
      letterSpacing: 0,
      textTransform: "uppercase" as const,
      lineHeight: 1.2,
    },
    body: {
      fontFamily,
      fontSize: t.bodySize,
      color: PDF_COLORS.body,
      lineHeight: t.bodyLineHeight,
    },
    bodyInk: {
      fontFamily,
      fontSize: t.bodySize,
      color: PDF_COLORS.ink,
      lineHeight: t.bodyLineHeight,
    },
    meta: {
      fontFamily,
      fontSize: t.metaSize,
      color: PDF_COLORS.charcoal,
      lineHeight: 1.35,
    },
    entryTitle: {
      fontFamily,
      fontSize: t.bodySize + 1,
      fontWeight: 700 as const,
      color: PDF_COLORS.ink,
      lineHeight: 1.25,
    },
    entryDate: {
      fontFamily,
      fontSize: t.metaSize,
      color: PDF_COLORS.charcoal,
      lineHeight: 1.25,
      textAlign: "right" as const,
    },
    footer: {
      fontFamily,
      fontSize: t.footerSize,
      color: PDF_COLORS.muted,
      letterSpacing: 0.4,
      opacity: 0.6,
    },
    bullet: {
      fontFamily,
      fontSize: t.bodySize,
      color: PDF_COLORS.body,
      lineHeight: t.bodyLineHeight,
      flex: 1,
    },
    bulletInk: {
      fontFamily,
      fontSize: t.bodySize,
      color: PDF_COLORS.ink,
      lineHeight: t.bodyLineHeight,
      flex: 1,
    },
  };

  const contact = (
    variant: "inline" | "stack",
    color: Style,
    linkStyle: Style,
    align: "left" | "center" | "right" = "left",
  ) => {
    const items = contactItems(data);
    if (items.length === 0) return null;

    if (variant === "stack") {
      return (
        <View style={{ alignItems: align === "right" ? "flex-end" : "flex-start" }}>
          {items.map((item, index) => (
            <Text
              key={`${item.type}-${index}`}
              style={[color, { textAlign: align, marginBottom: 1.5 }]}
            >
              {item.href ? (
                <Link src={item.href} style={linkStyle}>
                  {displayContact(item.value, item.type)}
                </Link>
              ) : (
                displayContact(item.value, item.type)
              )}
            </Text>
          ))}
        </View>
      );
    }

    return (
      <Text style={[color, { textAlign: align }]}>
        {items.map((item, index) => (
          <Text key={`${item.type}-${index}`}>
            {index > 0 ? "  ·  " : ""}
            {item.href ? (
              <Link src={item.href} style={linkStyle}>
                {displayContact(item.value, item.type)}
              </Link>
            ) : (
              displayContact(item.value, item.type)
            )}
          </Text>
        ))}
      </Text>
    );
  };

  const sectionHeading = (label: string) => {
    switch (template) {
      case "classic":
        return (
          <View style={{ marginBottom: 6 }}>
            <Text style={[styles.heading, { textAlign: "center" }]}>{label}</Text>
            <View
              style={{ height: 0.5, backgroundColor: PDF_COLORS.rule, marginTop: 4 }}
            />
          </View>
        );
      case "modern":
        return (
          <View style={{ marginBottom: 7 }}>
            <Text style={styles.heading}>{label}</Text>
            <View
              style={{
                width: 26,
                height: 1.6,
                backgroundColor: accent,
                marginTop: 4,
                opacity: 0.7,
              }}
            />
          </View>
        );
      case "executive":
        return (
          <View style={{ marginBottom: 7 }}>
            <Text style={styles.heading}>{label}</Text>
            <View
              style={{
                height: 0.6,
                backgroundColor: hexToRgba(accent, 0.45),
                marginTop: 4,
              }}
            />
          </View>
        );
      case "corporate":
        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 7,
            }}
          >
            <View style={{ width: 6, height: 6, backgroundColor: accent, marginRight: 5 }} />
            <Text style={[styles.heading, { flex: 1 }]}>{label}</Text>
            <View style={{ height: 0.5, backgroundColor: PDF_COLORS.rule, width: 40 }} />
          </View>
        );
      case "creative":
        return (
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: hexToRgba(accent, 0.11),
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 3,
              marginBottom: 7,
            }}
          >
            <Text style={[styles.heading, { letterSpacing: 1.3 }]}>{label}</Text>
          </View>
        );
      case "compact":
        return (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.heading}>{label}</Text>
            <View
              style={{ height: 0.5, backgroundColor: PDF_COLORS.rule, marginTop: 2.5 }}
            />
          </View>
        );
      default:
        return (
          <View style={{ marginBottom: 5 }}>
            <Text style={styles.headingInk}>{label}</Text>
          </View>
        );
    }
  };

  const renderBullet = (text: string, achievement: boolean) => {
    if (isAts) {
      return (
        <View
          key={text}
          style={{ flexDirection: "row", marginBottom: t.bulletGap, paddingRight: 2 }}
        >
          <Text
            style={{
              fontFamily,
              fontSize: t.bodySize,
              lineHeight: t.bodyLineHeight,
              color: PDF_COLORS.ink,
              width: 8,
            }}
          >
            •
          </Text>
          <Text style={styles.bulletInk}>{text}</Text>
        </View>
      );
    }

    return (
      <View
        key={text}
        style={{ flexDirection: "row", marginBottom: t.bulletGap, paddingRight: 2 }}
      >
        <View
          style={{
            width: achievement ? 2.6 : 2.2,
            height: achievement ? 2.6 : 2.2,
            borderRadius: achievement ? 0 : 2,
            backgroundColor: achievement ? accent : PDF_COLORS.charcoal,
            marginTop: achievement ? 4.6 : 4.4,
            marginRight: 5,
            opacity: achievement ? 0.95 : 0.55,
          }}
        />
        <Text style={styles.bullet}>{text}</Text>
      </View>
    );
  };

  const experienceHeader = (entry: ExperienceEntry) => {
    const role = entry.jobTitle.trim() || entry.employer.trim();
    const meta = [
      entry.jobTitle.trim() ? entry.employer.trim() : "",
      entry.location.trim(),
    ]
      .filter(Boolean)
      .join(" · ");
    const dates = formatDateRange(entry.startDate, entry.endDate, entry.current);

    if (!role && !dates && !meta) return null;

    return (
      <View>
        {role || dates ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
            wrap={false}
          >
            <Text style={[styles.entryTitle, { flex: 1, paddingRight: 12 }]}>{role}</Text>
            {dates ? (
              <Text style={[styles.entryDate, { flexShrink: 0, paddingTop: 0.6 }]}>
                {dates}
              </Text>
            ) : null}
          </View>
        ) : null}
        {meta ? (
          <Text style={[styles.meta, { marginTop: 1.5, marginBottom: 3 }]}>{meta}</Text>
        ) : null}
      </View>
    );
  };

  const experienceBullets = (entry: ExperienceEntry) => {
    const responsibilities = entry.responsibilities.filter((bullet) => bullet.text.trim());
    const achievements = entry.achievements.filter((bullet) => bullet.text.trim());
    return (
      <>
        {responsibilities.map((bullet) => renderBullet(bullet.text, false))}
        {achievements.map((bullet) => renderBullet(bullet.text, true))}
      </>
    );
  };

  const experienceEntry = (entry: ExperienceEntry) => (
    <View key={entry.id} style={{ marginBottom: t.entryGap }}>
      {experienceHeader(entry)}
      {experienceBullets(entry)}
    </View>
  );

  const educationHeader = (entry: CvData["education"][number]) => {
    const qualification =
      [entry.degree.trim(), entry.field.trim()].filter(Boolean).join(" · ") ||
      entry.institution.trim();
    const isInstitutionFallback = qualification === entry.institution.trim();
    const meta = [isInstitutionFallback ? "" : entry.institution.trim(), entry.location.trim()]
      .filter(Boolean)
      .join(" · ");
    const dates = formatDateRange(entry.startDate, entry.endDate, entry.current);

    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
          wrap={false}
        >
          <Text style={[styles.entryTitle, { flex: 1, paddingRight: 12 }]}>
            {qualification}
          </Text>
          {dates ? <Text style={[styles.entryDate, { flexShrink: 0 }]}>{dates}</Text> : null}
        </View>
        {meta ? <Text style={[styles.meta, { marginTop: 1.5 }]}>{meta}</Text> : null}
      </View>
    );
  };

  const educationBody = (entry: CvData["education"][number]) =>
    entry.description.trim() ? (
      <Text style={[styles.body, { marginTop: 3 }]}>{entry.description.trim()}</Text>
    ) : null;

  const educationEntry = (entry: CvData["education"][number]) => (
    <View key={entry.id} style={{ marginBottom: t.entryGap }}>
      {educationHeader(entry)}
      {educationBody(entry)}
    </View>
  );

  const skillCategoryHeader = (category: ReturnType<typeof visibleSkillCategories>[number]) => (
    <Text
      style={{
        fontFamily,
        fontSize: t.bodySize,
        fontWeight: 700,
        color: isAts ? PDF_COLORS.ink : accent,
        lineHeight: 1.35,
        marginBottom: 1.5,
      }}
    >
      {category.name}
    </Text>
  );

  const skillCategoryBody = (category: ReturnType<typeof visibleSkillCategories>[number]) => (
    <>
      {category.skills.map((skill) => (
        <Text key={skill.id} style={isAts ? styles.bodyInk : styles.body}>
          <Text style={{ fontWeight: 600 }}>{skill.name}</Text>
          {skill.tasks.filter((task) => task.text.trim()).length > 0 ? (
            <Text style={{ color: PDF_COLORS.charcoal }}>
              {" — "}
              {skill.tasks
                .filter((task) => task.text.trim())
                .map((task) => task.text.trim())
                .join("; ")}
            </Text>
          ) : null}
        </Text>
      ))}
    </>
  );

  const skillCategory = (category: ReturnType<typeof visibleSkillCategories>[number]) => (
    <View
      key={category.id}
      style={{ marginBottom: 7 }}
      wrap={category.skills.length <= 8}
    >
      {skillCategoryHeader(category)}
      {skillCategoryBody(category)}
    </View>
  );

  const additionalItem = (item: ReturnType<typeof visibleAdditionalSections>[number]["items"][number]) => {
    const inlineYear =
      item.text.trim().length > 0 &&
      item.text.trim().length <= 24 &&
      /\b(?:19|20)\d{2}\b/.test(item.text)
        ? item.text.trim()
        : "";
    return (
    <View key={item.id} style={{ marginBottom: 4 }}>
      <Text style={isAts ? styles.bodyInk : styles.body}>
        <Text style={{ fontWeight: 700, color: PDF_COLORS.ink }}>{item.title}</Text>
        {item.subtitle || inlineYear ? (
          <Text style={{ color: PDF_COLORS.charcoal }}>
            {item.title ? " — " : ""}
            {item.subtitle}
            {item.subtitle && inlineYear ? " · " : ""}
            {inlineYear}
          </Text>
        ) : null}
      </Text>
      {item.text.trim() && !inlineYear ? (
        <Text style={[styles.body, { marginTop: 1 }]}>{item.text.trim()}</Text>
      ) : null}
      {item.link.trim() ? (
        <Link
          src={withProtocol(item.link)}
          style={{
            fontFamily,
            fontSize: t.metaSize,
            color: isAts ? PDF_COLORS.ink : accent,
            textDecoration: "none",
            marginTop: 1.5,
          }}
        >
          {stripProtocol(item.link)}
        </Link>
      ) : null}
    </View>
    );
  };

  const additionalSections = () => {
    const sections = visibleAdditionalSections(data);
    return sections.map((section) => {
      const [first, ...rest] = section.items;
      const firstIsSmall =
        !first ||
        (first.title.length < 90 &&
          first.subtitle.length < 90 &&
          first.text.length < 260 &&
          first.link.length < 120);
      return (
        <View key={section.id} style={{ marginBottom: t.sectionGap }}>
          {first && firstIsSmall ? (
            <View wrap={false}>
              {sectionHeading(section.title)}
              {additionalItem(first)}
            </View>
          ) : (
            <>
              {sectionHeading(section.title)}
              {first ? additionalItem(first) : null}
            </>
          )}
          {rest.map(additionalItem)}
        </View>
      );
    });
  };

  const summaryContent = () =>
    data.personal.summary.trim() ? (
      <Text
        style={[
          isAts ? styles.bodyInk : styles.body,
          template === "classic" ? { textAlign: "justify" } : {},
        ]}
      >
        {data.personal.summary.trim()}
      </Text>
    ) : null;

  const sectionView = (key: RenderSectionKey) => {
    if (key === "additional") {
      return <View key={key}>{additionalSections()}</View>;
    }

    const heading = sectionHeading(sectionLabel(key));

    if (key === "experience" && data.experience.length > 0) {
      const [first, ...rest] = data.experience;
      return (
        <View key={key} style={{ marginBottom: t.sectionGap }}>
          <View wrap={false}>
            {heading}
            {experienceHeader(first)}
          </View>
          <View style={{ marginBottom: t.entryGap }}>{experienceBullets(first)}</View>
          {rest.map(experienceEntry)}
        </View>
      );
    }

    if (key === "education" && data.education.length > 0) {
      const [first, ...rest] = data.education;
      return (
        <View key={key} style={{ marginBottom: t.sectionGap }}>
          <View wrap={false}>
            {heading}
            {educationHeader(first)}
          </View>
          <View style={{ marginBottom: t.entryGap }}>{educationBody(first)}</View>
          {rest.map(educationEntry)}
        </View>
      );
    }

    if (key === "skills") {
      const categories = visibleSkillCategories(data);
      const totalSkills = categories.reduce(
        (total, category) => total + category.skills.length,
        0,
      );
      const totalTasks = categories.reduce(
        (total, category) =>
          total +
          category.skills.reduce((count, skill) => count + skill.tasks.length, 0),
        0,
      );
      const estimatedHeight =
        categories.length * 18 + totalSkills * 15 + totalTasks * 12;
      const keepTogether = totalSkills <= 14 && categories.length <= 6 && estimatedHeight < 500;

      if (keepTogether) {
        return (
          <View
            key={key}
            style={{ marginBottom: t.sectionGap }}
            wrap={false}
          >
            {heading}
            {categories.map(skillCategory)}
          </View>
        );
      }

      const [first, ...rest] = categories;
      return (
        <View key={key} style={{ marginBottom: t.sectionGap }}>
          {first ? (
            <View wrap={false}>
              {heading}
              {skillCategoryHeader(first)}
            </View>
          ) : (
            heading
          )}
          {first ? (
            <View style={{ marginBottom: 7 }} wrap={false}>
              {skillCategoryBody(first)}
            </View>
          ) : null}
          {rest.map(skillCategory)}
        </View>
      );
    }

    const summaryIsShort = data.personal.summary.trim().length < 1200;
    return (
      <View key={key} style={{ marginBottom: t.sectionGap }}>
        {summaryIsShort ? (
          <View wrap={false}>
            {heading}
            {summaryContent()}
          </View>
        ) : (
          <>
            {heading}
            {summaryContent()}
          </>
        )}
      </View>
    );
  };

  const header = () => {
    if (template === "classic") {
      return (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.name, { textAlign: "center" }]}>{name}</Text>
          {data.personal.professionalTitle.trim() ? (
            <Text style={[styles.title, { textAlign: "center", letterSpacing: 2 }]}>
              {data.personal.professionalTitle.trim()}
            </Text>
          ) : null}
          <View style={{ marginTop: 7 }}>
            {contact("inline", styles.contact, styles.contactLink, "center")}
          </View>
          <View
            style={{ height: 0.8, backgroundColor: accent, opacity: 0.55, marginTop: 12 }}
          />
        </View>
      );
    }

    if (template === "modern") {
      return (
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.name}>{name}</Text>
          {data.personal.professionalTitle.trim() ? (
            <Text style={styles.title}>{data.personal.professionalTitle.trim()}</Text>
          ) : null}
          <View style={{ width: 42, height: 2, backgroundColor: accent, marginTop: 8 }} />
          <View style={{ marginTop: 7 }}>
            {contact("inline", styles.contact, styles.contactLink, "left")}
          </View>
        </View>
      );
    }

    if (template === "executive") {
      return (
        <View
          style={{
            backgroundColor: accent,
            paddingHorizontal: t.padX,
            paddingTop: t.padTop,
            paddingBottom: 22,
          }}
        >
          <Text style={styles.nameExecutive}>{name}</Text>
          {data.personal.professionalTitle.trim() ? (
            <Text style={styles.titleExecutive}>
              {data.personal.professionalTitle.trim()}
            </Text>
          ) : null}
          <View style={{ marginTop: 10 }}>
            {contact("inline", styles.contactExecutive, styles.contactLinkExecutive, "left")}
          </View>
        </View>
      );
    }

    if (template === "corporate") {
      return (
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 18 }}>
              <Text style={styles.name}>{name}</Text>
              {data.personal.professionalTitle.trim() ? (
                <Text style={styles.title}>{data.personal.professionalTitle.trim()}</Text>
              ) : null}
            </View>
            <View style={{ width: 176, paddingTop: 2 }}>
              {contact("stack", styles.contact, styles.contactLink, "right")}
            </View>
          </View>
          <View style={{ height: 2.2, backgroundColor: accent, marginTop: 12 }} />
        </View>
      );
    }

    if (template === "creative") {
      return (
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: hexToRgba(accent, 0.12),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 11,
              }}
            >
              <Text
                style={{
                  fontFamily,
                  fontSize: 13,
                  fontWeight: 700,
                  color: accent,
                  letterSpacing: 0.5,
                }}
              >
                {initials(name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{name}</Text>
              {data.personal.professionalTitle.trim() ? (
                <Text style={[styles.title, { letterSpacing: 1.1 }]}>
                  {data.personal.professionalTitle.trim()}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={{ marginTop: 8 }}>
            {contact("inline", styles.contact, styles.contactLink, "left")}
          </View>
        </View>
      );
    }

    if (template === "compact") {
      return (
        <View style={{ marginBottom: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <Text style={[styles.name, { flex: 1, paddingRight: 12 }]}>{name}</Text>
            {data.personal.professionalTitle.trim() ? (
              <Text style={[styles.title, { marginTop: 0, fontSize: t.titleSize - 0.4 }]}>
                {data.personal.professionalTitle.trim()}
              </Text>
            ) : null}
          </View>
          <View style={{ marginTop: 5 }}>
            {contact("inline", styles.contact, styles.contactLink, "left")}
          </View>
          <View style={{ height: 0.6, backgroundColor: PDF_COLORS.rule, marginTop: 7 }} />
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={[styles.name, { letterSpacing: 0 }]}>{name}</Text>
        {data.personal.professionalTitle.trim() ? (
          <Text
            style={{
              fontFamily,
              fontSize: t.titleSize + 0.4,
              color: PDF_COLORS.ink,
              marginTop: 2,
            }}
          >
            {data.personal.professionalTitle.trim()}
          </Text>
        ) : null}
        <View style={{ marginTop: 5 }}>
          {contact("inline", styles.contact, styles.contactLink, "left")}
        </View>
      </View>
    );
  };

  const sections = getRenderSections(data, settings);
  const footer = (left: number, right: number) => (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 20,
        left,
        right,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <Text style={styles.footer}>{showNameInFooter ? name : ""}</Text>
      <Text
        style={styles.footer}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );

  const documentProps = {
    title: `${name} — Curriculum Vitae`,
    author: data.personal.fullName || "CVRabbit",
    subject: "Curriculum Vitae",
    creator: "CVRabbit",
    producer: "CVRabbit",
  };

  if (template === "executive") {
    return (
      <Document {...documentProps}>
        <Page size="A4" style={{ backgroundColor: PDF_COLORS.paper, fontFamily }}>
          {header()}
          <View
            style={{
              paddingHorizontal: t.padX,
              paddingTop: 20,
              paddingBottom: t.padBottom + 4,
            }}
          >
            {sections.map(sectionView)}
          </View>
          {footer(t.padX, t.padX)}
        </Page>
      </Document>
    );
  }

  if (template === "creative") {
    return (
      <Document {...documentProps}>
        <Page
          size="A4"
          style={{
            backgroundColor: PDF_COLORS.paper,
            fontFamily,
            paddingLeft: t.padX + 8,
            paddingRight: t.padX,
            paddingTop: t.padTop,
            paddingBottom: t.padBottom + 4,
          }}
        >
          <View
            fixed
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 11,
              backgroundColor: accent,
            }}
          />
          {header()}
          {sections.map(sectionView)}
          {footer(t.padX + 8, t.padX)}
        </Page>
      </Document>
    );
  }

  return (
    <Document {...documentProps}>
      <Page
        size="A4"
        style={{
          backgroundColor: PDF_COLORS.paper,
          fontFamily,
          paddingHorizontal: t.padX,
          paddingTop: t.padTop,
          paddingBottom: t.padBottom + 4,
        }}
      >
        {header()}
        {sections.map(sectionView)}
        {footer(t.padX, t.padX)}
      </Page>
    </Document>
  );
}
