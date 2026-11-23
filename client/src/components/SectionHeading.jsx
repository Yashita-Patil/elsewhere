export default function SectionHeading({ kicker, title, copy }) {
  return (
    <div className="section-heading">
      <p className="eyebrow"><span className="eyebrow-line" />{kicker}</p>
      <div className="section-heading-row"><h2>{title}</h2><p>{copy}</p></div>
    </div>
  );
}
