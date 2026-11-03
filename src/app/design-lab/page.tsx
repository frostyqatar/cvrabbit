import { notFound } from "next/navigation";

import { DesignLab } from "@/components/design-lab/design-lab";

export const metadata = {
  title: "Design lab",
  robots: { index: false, follow: false },
};

export default function DesignLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <DesignLab />;
}
