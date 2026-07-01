type SectionTitleProps = {
  title: string;
};

function SectionTitle({ title }: SectionTitleProps) {
  return <h2>{title}</h2>;
}

export default SectionTitle;
