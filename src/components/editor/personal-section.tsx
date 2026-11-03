"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/lib/editor/store";

import { Field, SectionCard } from "./editor-ui";

export function PersonalSection() {
  const personal = useEditor((state) => state.data.personal);
  const updatePersonal = useEditor((state) => state.updatePersonal);

  return (
    <SectionCard
      id="personal"
      index="01"
      title="Personal details"
      description="How you introduce yourself. Every field is optional — empty ones simply disappear from the generated CV."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName">
          <Input
            id="fullName"
            value={personal.fullName}
            onChange={(event) => updatePersonal({ fullName: event.target.value })}
            placeholder="Amara Okafor"
            autoComplete="name"
            maxLength={120}
          />
        </Field>

        <Field label="Professional title" htmlFor="professionalTitle">
          <Input
            id="professionalTitle"
            value={personal.professionalTitle}
            onChange={(event) => updatePersonal({ professionalTitle: event.target.value })}
            placeholder="Senior Product Manager"
            autoComplete="organization-title"
            maxLength={120}
          />
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={personal.email}
            onChange={(event) => updatePersonal({ email: event.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Phone number" htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={personal.phone}
            onChange={(event) => updatePersonal({ phone: event.target.value })}
            placeholder="+44 7700 900 000"
            autoComplete="tel"
          />
        </Field>

        <Field label="Location" htmlFor="location" optional>
          <Input
            id="location"
            value={personal.location}
            onChange={(event) => updatePersonal({ location: event.target.value })}
            placeholder="London, United Kingdom"
            autoComplete="address-level2"
            maxLength={120}
          />
        </Field>

        <Field label="LinkedIn" htmlFor="linkedin" optional>
          <Input
            id="linkedin"
            value={personal.linkedin}
            onChange={(event) => updatePersonal({ linkedin: event.target.value })}
            placeholder="linkedin.com/in/yourname"
            inputMode="url"
            maxLength={200}
          />
        </Field>

        <Field label="Portfolio or website" htmlFor="website" optional className="sm:col-span-2">
          <Input
            id="website"
            value={personal.website}
            onChange={(event) => updatePersonal({ website: event.target.value })}
            placeholder="yourname.com"
            inputMode="url"
            maxLength={200}
          />
        </Field>

        <Field
          label="Professional summary"
          htmlFor="summary"
          optional
          hint={`${personal.summary.length}/2000`}
          className="sm:col-span-2"
        >
          <Textarea
            id="summary"
            value={personal.summary}
            onChange={(event) => updatePersonal({ summary: event.target.value.slice(0, 2000) })}
            placeholder="A short introduction to your experience, strengths, and the kind of work you want next."
            rows={5}
            className="min-h-[8rem] leading-relaxed"
          />
          <p className="text-[0.68rem] leading-relaxed text-muted-foreground/80">
            Two to four sentences usually works best. We will not rewrite or embellish it.
          </p>
        </Field>
      </div>
    </SectionCard>
  );
}
