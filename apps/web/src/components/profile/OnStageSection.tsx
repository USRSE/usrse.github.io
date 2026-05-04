import { SectionFrame, NotYetWritten } from "./SectionFrame";

export function OnStageSection({ isOwner: _isOwner }: { isOwner: boolean }) {
  return (
    <SectionFrame
      number="07"
      eyebrow="On Stage"
      status="talks · panels · workshops"
      accent="teal"
    >
      <NotYetWritten message="sessions presented and chaired appear here as editorial pull-quotes" />
    </SectionFrame>
  );
}
